import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductVariant } from "@/lib/db/models/ProductVariant";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import { z } from "zod";

const updateSchema = z.object({
  variantName: z.string().min(1).max(50).optional(),
  price: z.number().positive().optional(),
  sizeLabel: z.string().max(50).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// PATCH /api/products/[id]/variants/[variantId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id, variantId } = await params;
    await connectDB();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: parsed.error.format() }, { status: 400 });
    }

    const variant = await ProductVariant.findOneAndUpdate(
      { _id: variantId, productId: id },
      { $set: parsed.data },
      { new: true }
    );

    if (!variant) {
      return NextResponse.json({ success: false, message: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: variant });
  } catch (error: any) {
    console.error("PATCH variant error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/products/[id]/variants/[variantId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id, variantId } = await params;
    await connectDB();

    await ProductVariant.findOneAndDelete({ _id: variantId, productId: id });
    return NextResponse.json({ success: true, message: "Variant deleted" });
  } catch (error: any) {
    console.error("DELETE variant error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
