import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/lib/db/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");

    const query: any = { isDeleted: { $ne: true } };
    if (!all) {
      query.isActive = true;
    }
    const categories = await Category.find(query).sort({ order: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
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
    const category = await Category.create(body);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
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
    await connectDB();
    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
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
    await connectDB();
    
    // Soft delete
    const deleted = await Category.findByIdAndUpdate(id, { isDeleted: true, isActive: false }, { new: true });
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
