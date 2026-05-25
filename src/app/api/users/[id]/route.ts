import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    const body = await request.json();
    const { name, email, password, role, branchId } = body;

    await connectDB();
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    if (name) userToUpdate.name = name;
    if (email && email !== userToUpdate.email) {
      const exists = await User.findOne({ email });
      if (exists) return NextResponse.json({ success: false, message: "Email already taken" }, { status: 409 });
      userToUpdate.email = email;
    }
    if (password) {
      userToUpdate.password = await bcrypt.hash(password, 10);
    }
    if (role) {
      userToUpdate.role = role;
    }
    if (role === ROLES.BRANCH_MANAGER) {
      userToUpdate.branchId = branchId || null;
    } else {
      userToUpdate.branchId = undefined;
    }

    await userToUpdate.save();
    
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    await connectDB();
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          isArchived: true,
          isActive: false,
          archivedAt: new Date(),
          archivedBy: session.user.id,
        },
      },
      { new: true }
    );
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "User archived successfully" });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    await connectDB();
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: { isArchived: false, isActive: true },
        $unset: { archivedAt: "", archivedBy: "" },
      },
      { new: true }
    );
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "User restored successfully" });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
