import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Branch } from "@/lib/db/models/Branch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters").max(100),
  contactNumber: z.string().min(7, "Contact number must be valid").max(15),
  deliveryRadiusKm: z.number().positive("Delivery radius must be positive").max(100),
  address: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    zip: z.string().min(1).max(20),
  }),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }),
  operatingHours: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format"),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format"),
  }),
  isActive: z.boolean().optional().default(true),
  isAcceptingOrders: z.boolean().optional().default(true),
  managerId: z.string().nullable().optional(),
  // Optional fields
  logo: z.string().optional(),
  description: z.string().max(1000).optional(),
  deliveryCharge: z.number().min(0).optional(),
  estimatedDeliveryTime: z.string().max(50).optional(),
  timezone: z.string().max(60).optional().default("Asia/Kolkata"),
  whatsappNumber: z.string().max(15).optional(),
});

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    await connectDB();
    const branches = await Branch.find({ isArchived: { $ne: true } })
      .populate("managerId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    console.error("GET /api/branches error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = branchSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid branch payload data",
        errors: parsed.error.format(),
      }, { status: 400 });
    }

    await connectDB();

    // Auto-generate a unique slug from the branch name
    const baseSlug = toSlug(parsed.data.name);
    let slug = baseSlug;
    let attempt = 0;
    while (await Branch.exists({ slug })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const branch = await Branch.create({ ...parsed.data, slug });
    return NextResponse.json({ success: true, data: branch }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/branches error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
