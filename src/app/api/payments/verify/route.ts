import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import mongoose from "mongoose";
import { ORDER_STATUS } from "@/config/constants";
import { env } from "@/config/env";
import { authOptions } from "@/lib/auth/options";
import { Coupon } from "@/lib/db/models/Coupon";
import { Order } from "@/lib/db/models/Order";
import { Payment } from "@/lib/db/models/Payment";
import { Product } from "@/lib/db/models/Product";
import { ProductVariant } from "@/lib/db/models/ProductVariant";
import { connectDB } from "@/lib/db/mongoose";
import { BranchService } from "@/lib/services/BranchService";
import { getSettings } from "@/lib/services/SettingsService";
import { sendEmail, getBranding } from "@/lib/email";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/orderConfirmation";
import { buildAdminOrderAlertEmail } from "@/lib/email/templates/adminOrderAlert";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function hasRazorpayConfig() {
  return Boolean(
    env.RAZORPAY_KEY_SECRET &&
      env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      !env.RAZORPAY_KEY_SECRET.startsWith("your_") &&
      !env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("your_")
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!hasRazorpayConfig()) {
      return NextResponse.json({ success: false, message: "Razorpay is not configured." }, { status: 503 });
    }

    const parsed = verifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing payment verification fields" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // ── Signature Verification ─────────────────────────────────────────────
    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: "Payment verification failed: Invalid Signature" }, { status: 400 });
    }

    await connectDB();

    // ── Idempotency and Double-spend Check (Atomic findOneAndUpdate) ───────
    // Query for payment with status "pending" and atomically mark as "processing"
    const payment = await Payment.findOneAndUpdate(
      {
        gatewayOrderId: razorpay_order_id,
        userId: session.user.id,
        status: "pending"
      },
      {
        $set: { status: "processing" }
      },
      { new: false } // Returns the document BEFORE update
    );

    // If no pending payment was found, it might have been completed already
    if (!payment) {
      const existingCompletedPayment = await Payment.findOne({
        gatewayOrderId: razorpay_order_id,
        userId: session.user.id
      });

      if (existingCompletedPayment && existingCompletedPayment.status === "completed" && existingCompletedPayment.orderId) {
        const existingOrder = await Order.findById(existingCompletedPayment.orderId);
        return NextResponse.json({
          success: true,
          message: "Payment already verified",
          order: existingOrder,
        });
      }

      return NextResponse.json({ success: false, message: "Payment session not found or already processed" }, { status: 404 });
    }

    const snapshot = payment.orderSnapshot;
    if (!snapshot) {
      // Revert status to pending on error
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
      return NextResponse.json({ success: false, message: "Checkout snapshot missing" }, { status: 409 });
    }

    // ── Server-side re-validation of amount against database pricing ────────
    const productIds = snapshot.items.map((item: any) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    // Batch-load any variants referenced in the snapshot
    const snapshotVariantIds = snapshot.items
      .map((i: any) => i.variantId)
      .filter(Boolean) as string[];
    const variantMap = new Map<string, number>(); // variantId → price
    if (snapshotVariantIds.length > 0) {
      const dbVariants = await ProductVariant.find({ _id: { $in: snapshotVariantIds } }).lean();
      for (const v of dbVariants as any[]) {
        variantMap.set(v._id.toString(), v.price);
      }
    }

    let computedSubtotal = 0;
    for (const item of snapshot.items) {
      const dbProduct = productMap.get(item.productId.toString());
      if (!dbProduct || !dbProduct.isAvailable) {
        await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
        return NextResponse.json({ success: false, message: "Product is no longer available" }, { status: 409 });
      }

      // Resolve unit price: variant price takes precedence over base product price
      let unitPrice = dbProduct.price;
      if (item.variantId) {
        const variantPrice = variantMap.get(item.variantId.toString());
        if (variantPrice === undefined) {
          await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
          return NextResponse.json({ success: false, message: "Selected variant is no longer available" }, { status: 409 });
        }
        unitPrice = variantPrice;
      }

      let addonsPrice = 0;
      for (const addon of item.selectedAddons) {
        const dbAddon = dbProduct.addons?.find((a: any) => a.name === addon.name);
        if (!dbAddon) {
          await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
          return NextResponse.json({ success: false, message: `Addon "${addon.name}" is invalid` }, { status: 409 });
        }
        addonsPrice += dbAddon.price;
      }
      computedSubtotal += (unitPrice + addonsPrice) * item.quantity;
    }

    // Check subtotal discrepancy
    if (Math.abs(computedSubtotal - snapshot.subTotal) > 0.01) {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
      return NextResponse.json({ success: false, message: "Order subtotal mismatch: pricing has changed" }, { status: 409 });
    }

    // Revalidate Coupon
    let computedDiscount = 0;
    if (snapshot.couponCode) {
      const coupon = await Coupon.findOne({
        code: snapshot.couponCode,
        isActive: true,
      });
      if (coupon && computedSubtotal >= coupon.minOrderValue) {
        computedDiscount = coupon.discountType === "PERCENTAGE" 
          ? (computedSubtotal * coupon.discountValue) / 100 
          : coupon.discountValue;
      }
    }

    // Revalidate settings and delivery charge
    const settings = await getSettings();
    const deliveryCfg = settings.delivery as any;
    const baseFee = deliveryCfg?.baseDeliveryFee ?? 9;
    const pricePerKm = deliveryCfg?.pricePerKm ?? 3;
    const freeAbove = deliveryCfg?.freeDeliveryAbove ?? 500;
    const taxPct = deliveryCfg?.taxPercentage ?? 8.5;

    const { Branch } = require("@/lib/db/models/Branch");
    const nearestBranch = await Branch.findOne({ _id: snapshot.branchId, isDeleted: { $ne: true } }).lean();

    if (!nearestBranch) {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
      return NextResponse.json({ success: false, message: "Associated branch is no longer available" }, { status: 409 });
    }

    const customCharge = nearestBranch.deliveryCharge;
    const baseCharge = typeof customCharge === "number" ? customCharge : baseFee;

    let distanceKm = snapshot.distanceKm || 0;
    if (!snapshot.branchId && snapshot.deliveryAddress.coordinates) {
      const [bLng, bLat] = nearestBranch.location?.coordinates ?? [];
      distanceKm = haversineKm(
        snapshot.deliveryAddress.coordinates.lat,
        snapshot.deliveryAddress.coordinates.lng,
        bLat,
        bLng
      );
    }

    const taxableAmount = Math.max(computedSubtotal - computedDiscount, 0);
    const computedDeliveryFee = taxableAmount >= freeAbove 
      ? 0 
      : (snapshot.branchId ? baseCharge : Number((baseFee + distanceKm * pricePerKm).toFixed(2)));
    const computedTax = Number(((taxableAmount * taxPct) / 100).toFixed(2));
    const computedTotal = Number((taxableAmount + computedDeliveryFee + computedTax).toFixed(2));

    // Final total check
    if (Math.abs(computedTotal - payment.amount) > 0.01) {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
      return NextResponse.json({ success: false, message: "Order total mismatch: recalculation failed" }, { status: 409 });
    }

    // ── Atomic: Order + Payment completion + Coupon in one transaction ─────
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    let order: any;
    try {
      const [createdOrder] = await Order.create(
        [
          {
            orderId: `ORD-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
            customerId: payment.userId,
            branchId: nearestBranch?._id || snapshot.branchId,
            items: snapshot.items,
            subTotal: snapshot.subTotal,
            tax: snapshot.tax,
            deliveryFee: snapshot.deliveryFee,
            total: snapshot.total,
            deliveryAddress: snapshot.deliveryAddress,
            status: ORDER_STATUS.PENDING,
            paymentMethod: snapshot.paymentMethod,
            paymentStatus: "PAID",
            paymentId: razorpay_payment_id,
            specialInstructions: snapshot.specialInstructions,
            realtimeStatus: "RECEIVED",
            orderTimeline: [{ status: "PENDING", timestamp: new Date(), note: "Payment verified online" }],
          },
        ],
        { session: dbSession }
      );
      order = createdOrder;

      payment.orderId = order._id;
      payment.status = "completed";
      payment.transactionId = razorpay_payment_id;
      payment.verifiedAt = new Date();
      payment.paymentGatewayData = {
        ...payment.paymentGatewayData,
        verification: { razorpay_order_id, razorpay_payment_id },
      };
      await payment.save({ session: dbSession });

      if (snapshot.couponCode) {
        await Coupon.updateOne(
          { code: snapshot.couponCode },
          {
            $inc: {
              usedCount: 1,
              [`usageByUser.${payment.userId}`]: 1,
            },
          },
          { session: dbSession }
        );
      }

      await dbSession.commitTransaction();
    } catch (txError) {
      await dbSession.abortTransaction();
      // Revert payment to pending so customer can retry
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
      throw txError;
    } finally {
      await dbSession.endSession();
    }

    // ── Notify Branch via Socket + Web Push ─────────────────────────────────
    const { NotificationService } = await import("@/lib/services/NotificationService");
    const orderObj = order.toObject ? order.toObject() : order;
    await NotificationService.sendOrderAlert({
      branchId: order.branchId.toString(),
      orderId: order.orderId,
      orderTotal: order.total,
      order: orderObj,
    });

    // ── Fire-and-forget order confirmation emails (online payment) ───────────
    if (session.user.email) {
      const branding = getBranding(settings);
      const emailItems = snapshot.items.map((item: any) => ({
        name: (productMap.get(item.productId.toString()) as any)?.name ?? "Item",
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price,
        selectedAddons: item.selectedAddons ?? [],
      }));
      const addr = snapshot.deliveryAddress;
      const emailDeliveryAddress = {
        fullName: addr.fullName,
        phone: addr.phone,
        houseNumber: addr.houseNumber,
        floor: addr.floor,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        deliveryInstructions: addr.deliveryInstructions,
      };
      Promise.all([
        sendEmail({
          to: session.user.email,
          subject: `Order Confirmed — ${order.orderId} | ${branding.appName}`,
          html: buildOrderConfirmationEmail({
            branding,
            customerName: addr.fullName,
            orderId: order.orderId,
            orderStatus: "PLACED",
            items: emailItems,
            subTotal: snapshot.subTotal,
            tax: snapshot.tax,
            deliveryFee: snapshot.deliveryFee,
            total: snapshot.total,
            paymentMethod: "Online Payment",
            deliveryAddress: emailDeliveryAddress,
            estimatedMinutes: 45,
            trackUrl: `${branding.websiteUrl}/orders`,
          }),
        }),
        sendEmail({
          to: branding.supportEmail || branding.appName,
          subject: `💳 New Online Order — ${order.orderId} (${addr.city})`,
          html: buildAdminOrderAlertEmail({
            branding,
            orderId: order.orderId,
            orderStatus: "PLACED",
            customerName: addr.fullName,
            customerEmail: session.user.email,
            customerPhone: addr.phone,
            items: emailItems,
            subTotal: snapshot.subTotal,
            tax: snapshot.tax,
            deliveryFee: snapshot.deliveryFee,
            total: snapshot.total,
            paymentMethod: "Online Payment",
            paymentStatus: "PAID",
            deliveryAddress: emailDeliveryAddress,
            specialInstructions: snapshot.specialInstructions,
            ordersAdminUrl: `${branding.websiteUrl}/branch`,
          }),
        }),
      ]).catch((err) => console.error("[OrderEmail] Failed to send online confirmation:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and order created",
      order,
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
