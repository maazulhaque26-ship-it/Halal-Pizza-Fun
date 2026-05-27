import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { z } from "zod";
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
import { IdempotencyKey } from "@/lib/db/models/IdempotencyKey";
import { sendEmail, getBranding } from "@/lib/email";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/orderConfirmation";
import { buildAdminOrderAlertEmail } from "@/lib/email/templates/adminOrderAlert";

const itemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  selectedAddons: z.array(z.object({ name: z.string().min(1) })).optional().default([]),
});

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  alternatePhone: z.string().optional(),
  houseNumber: z.string().min(1),
  floor: z.string().optional(),
  street: z.string().min(1),
  landmark: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  deliveryInstructions: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const requestSchema = z.object({
  items: z.array(itemSchema).min(1),
  deliveryAddress: addressSchema,
  branchId: z.string().optional(),
  specialInstructions: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["ONLINE", "COD"]).optional().default("ONLINE"),
});

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

function hasRazorpayConfig() {
  return Boolean(
    env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      !env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("your_") &&
      !env.RAZORPAY_KEY_SECRET.startsWith("your_")
  );
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // ── Idempotency-Key header (required for COD; optional for online) ─────
    const idempotencyKey = req.headers.get("Idempotency-Key")?.trim() || null;

    if (!hasRazorpayConfig()) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay is not configured. Add real Razorpay keys before accepting paid orders.",
        },
        { status: 503 }
      );
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid checkout payload" }, { status: 400 });
    }

    await connectDB();

    // ── Idempotency check (early-return cached response for COD duplicates) ─
    if (idempotencyKey) {
      const existing = await IdempotencyKey.findOne({
        key: idempotencyKey,
        userId: session.user.id,
      });
      if (existing) {
        return NextResponse.json(existing.response);
      }
    }

    // ── Load DB settings for authoritative fee config ──────────────────────
    const settings = await getSettings();
    const deliveryCfg = settings.delivery as any;
    const baseFee: number = deliveryCfg?.baseDeliveryFee ?? 9;
    const pricePerKm: number = deliveryCfg?.pricePerKm ?? 3;
    const freeAbove: number = deliveryCfg?.freeDeliveryAbove ?? 500;
    const taxPct: number = deliveryCfg?.taxPercentage ?? 8.5;

    const { items, deliveryAddress, specialInstructions, couponCode, paymentMethod } = parsed.data;

    // Reject COD if it's globally disabled in settings
    if (paymentMethod === "COD" && settings.payment?.codEnabled === false) {
      return NextResponse.json({ success: false, message: "Cash on Delivery is currently disabled." }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = Array.from(new Set(productIds));
    const products = await Product.find({ _id: { $in: uniqueProductIds }, isAvailable: true }).lean();
    const productById = new Map(products.map((product: any) => [product._id.toString(), product]));

    if (productById.size !== uniqueProductIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more cart items are no longer available." },
        { status: 409 }
      );
    }

    // ── Resolve variant IDs to prices in a single batch query ─────────────
    const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];
    const variantMap = new Map<string, { price: number; variantName: string }>();
    if (variantIds.length > 0) {
      const dbVariants = await ProductVariant.find({
        _id: { $in: variantIds },
        isAvailable: true,
      }).lean();
      for (const v of dbVariants as any[]) {
        variantMap.set(v._id.toString(), { price: v.price, variantName: v.variantName });
      }
    }

    const orderItems = items.map((item) => {
      const product: any = productById.get(item.productId);
      const selectedAddons = item.selectedAddons.map((addon) => {
        const dbAddon = product.addons?.find(
          (candidate: any) => candidate.name === addon.name && candidate.isAvailable !== false
        );
        if (!dbAddon) {
          throw new Error(`Addon "${addon.name}" is not available for ${product.name}`);
        }
        return { name: dbAddon.name, price: dbAddon.price };
      });

      // If a variantId is supplied it must exist and be available
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new Error(`Selected variant for ${product.name} is no longer available.`);
        }
        return {
          productId: product._id,
          variantId: item.variantId,
          variantName: variant.variantName,
          quantity: item.quantity,
          price: variant.price,
          selectedAddons,
        };
      }

      return {
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        selectedAddons,
      };
    });

    const subTotal = orderItems.reduce((total, item) => {
      const addonsTotal = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      return total + (item.price + addonsTotal) * item.quantity;
    }, 0);

    let couponDiscount = 0;
    const normalizedCoupon = couponCode?.trim().toUpperCase();
    if (normalizedCoupon) {
      const coupon = await Coupon.findOne({
        code: normalizedCoupon,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!coupon || coupon.usedCount >= coupon.maxUses || subTotal < coupon.minOrderValue) {
        return NextResponse.json({ success: false, message: "Coupon is invalid for this order." }, { status: 400 });
      }

      // Per-user limit check
      if (coupon.maxUsesPerUser > 0) {
        const userUses = coupon.usageByUser?.get(session.user.id) ?? 0;
        if (userUses >= coupon.maxUsesPerUser) {
          return NextResponse.json(
            { success: false, message: "You have already used this coupon the maximum number of times." },
            { status: 400 }
          );
        }
      }

      couponDiscount =
        coupon.discountType === "PERCENTAGE" ? (subTotal * coupon.discountValue) / 100 : coupon.discountValue;
    }

    // ── Find Branch & Calculate Delivery Fee ────────────────────────────────────
    let selectedBranch: any = null;
    let deliveryFee = 0;
    let distanceKm = 0;

    const { branchId } = parsed.data;

    if (branchId) {
      // 1. Direct Manual Selection Flow
      const { Branch } = require("@/lib/db/models/Branch");
      const dbBranch = await Branch.findOne({ _id: branchId, isDeleted: { $ne: true } }).lean();
      if (!dbBranch) {
        return NextResponse.json({ success: false, message: "Selected branch is not available." }, { status: 404 });
      }
      selectedBranch = dbBranch;
      
      const customCharge = (dbBranch as any).deliveryCharge;
      const baseCharge = typeof customCharge === "number" ? customCharge : baseFee;
      
      if (deliveryAddress.coordinates && dbBranch.location?.coordinates) {
        const [bLng, bLat] = dbBranch.location.coordinates;
        distanceKm = haversineKm(
          deliveryAddress.coordinates.lat,
          deliveryAddress.coordinates.lng,
          bLat,
          bLng
        );
      }

      const taxableAmount = Math.max(subTotal - couponDiscount, 0);
      deliveryFee = taxableAmount >= freeAbove ? 0 : baseCharge;
    } else if (deliveryAddress.coordinates) {
      // 2. Coordinate-based fallback flow
      const nearestBranch = await BranchService.findNearestActiveBranch(
        deliveryAddress.coordinates.lat,
        deliveryAddress.coordinates.lng
      );

      if (!nearestBranch) {
        return NextResponse.json(
          { success: false, message: "No open branch can deliver to this address right now." },
          { status: 404 }
        );
      }
      selectedBranch = nearestBranch;

      const [bLng, bLat] = nearestBranch.location?.coordinates ?? [];
      distanceKm = haversineKm(
        deliveryAddress.coordinates.lat,
        deliveryAddress.coordinates.lng,
        bLat,
        bLng
      );

      const taxableAmount = Math.max(subTotal - couponDiscount, 0);
      deliveryFee = taxableAmount >= freeAbove ? 0 : Number((baseFee + distanceKm * pricePerKm).toFixed(2));
    } else {
      return NextResponse.json(
        { success: false, message: "Please specify either coordinates or a selected branchId for delivery calculations." },
        { status: 400 }
      );
    }

    const taxableAmount = Math.max(subTotal - couponDiscount, 0);
    const tax = Number(((taxableAmount * taxPct) / 100).toFixed(2));
    const total = Number((taxableAmount + deliveryFee + tax).toFixed(2));

    // ── Cash on Delivery Flow ──────────────────────────────────────────────
    if (paymentMethod === "COD") {
      const order = await Order.create({
        orderId: `ORD-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
        customerId: session.user.id,
        branchId: selectedBranch._id,
        items: orderItems,
        subTotal: Number(subTotal.toFixed(2)),
        tax,
        deliveryFee,
        total,
        deliveryAddress,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        specialInstructions,
        realtimeStatus: "RECEIVED",
        orderTimeline: [{ status: "PENDING", timestamp: new Date(), note: "Order placed via COD" }]
      });

      if (normalizedCoupon) {
        await Coupon.updateOne(
          { code: normalizedCoupon },
          {
            $inc: {
              usedCount: 1,
              [`usageByUser.${session.user.id}`]: 1,
            },
          }
        );
      }

      // Notify Branch via Socket & PWA Push
      const { NotificationService } = await import("@/lib/services/NotificationService");
      const orderObj = order.toObject ? order.toObject() : order;
      await NotificationService.sendOrderAlert({
        branchId: selectedBranch._id.toString(),
        orderId: order.orderId,
        orderTotal: total,
        customerName: deliveryAddress.fullName,
        order: orderObj,
      });

      // ── Fire-and-forget order confirmation emails ───────────────────────────
      if (session.user.email) {
        const branding = getBranding(settings);
        const emailItems = orderItems.map((item: any) => ({
          name: (productById.get(item.productId.toString()) as any)?.name ?? "Item",
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price,
          selectedAddons: item.selectedAddons,
        }));
        const emailDeliveryAddress = {
          fullName: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          houseNumber: deliveryAddress.houseNumber,
          floor: deliveryAddress.floor,
          street: deliveryAddress.street,
          landmark: deliveryAddress.landmark,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
          deliveryInstructions: deliveryAddress.deliveryInstructions,
        };
        Promise.all([
          sendEmail({
            to: session.user.email,
            subject: `Order Confirmed — ${order.orderId} | ${branding.appName}`,
            html: buildOrderConfirmationEmail({
              branding,
              customerName: deliveryAddress.fullName,
              orderId: order.orderId,
              orderStatus: "PLACED",
              items: emailItems,
              subTotal: Number(subTotal.toFixed(2)),
              tax,
              deliveryFee,
              total,
              paymentMethod: "COD",
              deliveryAddress: emailDeliveryAddress,
              estimatedMinutes: 45,
              trackUrl: `${branding.websiteUrl}/orders`,
            }),
          }),
          sendEmail({
            to: branding.supportEmail || branding.appName,
            subject: `🍕 New COD Order — ${order.orderId} (${deliveryAddress.city})`,
            html: buildAdminOrderAlertEmail({
              branding,
              orderId: order.orderId,
              orderStatus: "PLACED",
              customerName: deliveryAddress.fullName,
              customerEmail: session.user.email,
              customerPhone: deliveryAddress.phone,
              items: emailItems,
              subTotal: Number(subTotal.toFixed(2)),
              tax,
              deliveryFee,
              total,
              paymentMethod: "COD",
              deliveryAddress: emailDeliveryAddress,
              specialInstructions,
              ordersAdminUrl: `${branding.websiteUrl}/branch`,
            }),
          }),
        ]).catch((err) => console.error("[OrderEmail] Failed to send COD confirmation:", err));
      }

      const codResponse = {
        success: true,
        order,
        assignedBranch: {
          id: selectedBranch._id,
          name: selectedBranch.name,
          distanceKm: Number(distanceKm.toFixed(2)),
        },
        amount: total,
        deliveryFee,
        distanceKm: Number(distanceKm.toFixed(2)),
      };

      // Store idempotency key so duplicate submissions return cached response
      if (idempotencyKey) {
        await IdempotencyKey.findOneAndUpdate(
          { key: idempotencyKey, userId: session.user.id },
          {
            $setOnInsert: {
              key: idempotencyKey,
              userId: session.user.id,
              response: codResponse,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
          { upsert: true }
        );
      }

      return NextResponse.json(codResponse);
    }

    // ── Online Payment Flow ────────────────────────────────────────────────
    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const razorpay = new Razorpay({
      key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: env.RAZORPAY_KEY_SECRET || "",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt,
      notes: {
        branchId: selectedBranch._id.toString(),
        userId: session.user.id,
      },
    });

    const payment = await Payment.create({
      userId: session.user.id,
      amount: total,
      currency: "INR",
      method: "razorpay",
      status: "pending",
      gatewayOrderId: razorpayOrder.id,
      receipt,
      orderSnapshot: {
        branchId: selectedBranch._id,
        items: orderItems,
        subTotal: Number(subTotal.toFixed(2)),
        tax,
        deliveryFee,
        distanceKm: Number(distanceKm.toFixed(2)),
        total,
        deliveryAddress,
        paymentMethod: "ONLINE",
        specialInstructions,
        couponCode: normalizedCoupon,
      },
      paymentGatewayData: { order: razorpayOrder },
    });

    return NextResponse.json({
      success: true,
      order: razorpayOrder,
      checkoutSessionId: payment._id,
      assignedBranch: {
        id: selectedBranch._id,
        name: selectedBranch.name,
        distanceKm: Number(distanceKm.toFixed(2)),
      },
      amount: total,
      deliveryFee,
      distanceKm: Number(distanceKm.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Payment Order Creation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Could not initiate payment" },
      { status: 500 }
    );
  }
}
