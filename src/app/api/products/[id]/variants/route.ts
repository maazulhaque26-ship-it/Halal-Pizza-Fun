import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductVariant } from "@/lib/db/models/ProductVariant";
import { Product } from "@/lib/db/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import { z } from "zod";

const variantSchema = z.object({
  variantName: z.string().min(1).max(50),
  price: z.number().positive(),
  sizeLabel: z.string().max(50).optional(),
  isAvailable: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

// GET /api/products/[id]/variants — public; pass ?all=true (admin only) to include unavailable
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    // Admin-only: verify session when requesting all variants
    if (all) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();
    const filter: Record<string, any> = { productId: id };
    if (!all) filter.isAvailable = true;

    const variants = await ProductVariant.find(filter).sort({ sortOrder: 1 }).lean();
    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    console.error("GET variants error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST /api/products/[id]/variants — SUPER_ADMIN only
export async function POST(
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

    // Verify product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = variantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid variant data",
        errors: parsed.error.format(),
      }, { status: 400 });
    }

    const variant = await ProductVariant.create({
      productId: id,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: variant }, { status: 201 });
  } catch (error: any) {
    console.error("POST variant error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
