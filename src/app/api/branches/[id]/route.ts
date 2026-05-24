import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Branch } from "@/lib/db/models/Branch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import { z } from "zod";

const branchPatchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  contactNumber: z.string().min(7).max(15).optional(),
  deliveryRadiusKm: z.number().positive().max(100).optional(),
  address: z.object({
    street: z.string().min(1).max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    zip: z.string().min(1).max(20).optional(),
  }).optional(),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }).optional(),
  operatingHours: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format").optional(),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format").optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  isAcceptingOrders: z.boolean().optional(),
  managerId: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = branchPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid branch details payload",
        errors: parsed.error.format()
      }, { status: 400 });
    }

    await connectDB();
    const branch = await Branch.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!branch) return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    console.error("PATCH /api/branches/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    await Branch.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Branch deleted" });
  } catch (error) {
    console.error("DELETE /api/branches/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
