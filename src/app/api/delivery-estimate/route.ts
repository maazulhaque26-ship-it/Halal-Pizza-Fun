import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Branch } from "@/lib/db/models/Branch";
import { getSettings } from "@/lib/services/SettingsService";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const branchId = searchParams.get("branchId") || "";

    await connectDB();
    const settings = await getSettings();
    const cfg = settings.delivery ?? {};
    const baseFee: number = (cfg as any).baseDeliveryFee ?? 9;
    const pricePerKm: number = (cfg as any).pricePerKm ?? 3;
    const freeAbove: number = (cfg as any).freeDeliveryAbove ?? 500;
    const taxPct: number = (cfg as any).taxPercentage ?? 8.5;

    // 1. Direct branch estimation (for manual branch selection flows)
    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, isDeleted: { $ne: true } }).lean();
      if (!branch) {
        return NextResponse.json(
          { success: false, message: "Branch not found" },
          { status: 404 }
        );
      }

      // Use branch custom delivery charge if defined, otherwise fall back to settings base delivery fee
      const deliveryFee = typeof (branch as any).deliveryCharge === "number" 
        ? (branch as any).deliveryCharge 
        : baseFee;

      return NextResponse.json({
        success: true,
        withinRange: true,
        branchId: branch._id,
        branchName: branch.name,
        distanceKm: 0,
        deliveryFee,
        freeDeliveryAbove: freeAbove,
        taxPercentage: taxPct,
        baseFee,
        pricePerKm,
      });
    }

    // 2. Coordinate-based fallback
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, message: "lat/lng coordinates or branchId query parameter is required" },
        { status: 400 }
      );
    }

    const branches = await Branch.find({ isActive: true, isDeleted: { $ne: true } }).lean();
    let nearestBranch: any = null;
    let nearestDistKm = Infinity;

    for (const branch of branches) {
      const [bLng, bLat] = (branch as any).location?.coordinates ?? [];
      if (bLat == null || bLng == null) continue;

      const distKm = haversineKm(lat, lng, bLat, bLng);
      const radius = Number((branch as any).deliveryRadiusKm) || 5;

      if (distKm <= radius && distKm < nearestDistKm) {
        nearestDistKm = distKm;
        nearestBranch = branch;
      }
    }

    if (!nearestBranch) {
      return NextResponse.json({
        success: false,
        message: "No branch can deliver to this location",
        withinRange: false,
      });
    }

    // Distance-based fee: base + (km * rate)
    const deliveryFee = Number((baseFee + nearestDistKm * pricePerKm).toFixed(2));

    return NextResponse.json({
      success: true,
      withinRange: true,
      branchId: nearestBranch._id,
      branchName: nearestBranch.name,
      distanceKm: Number(nearestDistKm.toFixed(2)),
      deliveryFee,
      freeDeliveryAbove: freeAbove,
      taxPercentage: taxPct,
      baseFee,
      pricePerKm,
    });
  } catch (err: any) {
    console.error("GET /api/delivery-estimate error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
