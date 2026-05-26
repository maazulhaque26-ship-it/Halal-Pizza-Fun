import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const all = searchParams.get("all"); // admin view includes unavailable

    const query: any = { isDeleted: { $ne: true } };
    if (!all) query.isAvailable = true;
    if (categoryId) query.categoryId = categoryId;

    const products = await Product.find(query)
      .populate("categoryId", "name")
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();
    const product = await Product.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ success: false, message: "Could not create product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: "Product ID required" }, { status: 400 });

    await connectDB();
    const product = await Product.findByIdAndUpdate(id, updates, { new: true }).populate("categoryId", "name");
    if (!product) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("PATCH /api/products error:", error);
    return NextResponse.json({ success: false, message: "Could not update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });

    await connectDB();
    // Soft delete — preserves order history integrity
    const deleted = await Product.findByIdAndUpdate(id, { isDeleted: true, isAvailable: false }, { new: true });
    if (!deleted) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
