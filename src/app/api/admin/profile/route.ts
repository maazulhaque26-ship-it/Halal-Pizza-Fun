import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { ROLES } from "@/config/constants";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("-password");
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, currentPassword, newPassword } = body;

    await connectDB();
    const user = await User.findById(session.user.id).select("+password");
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    if (name && name.trim()) user.name = name.trim();
    if (image) user.image = image;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "Current password required to change password" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password || "");
      if (!valid) {
        return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, message: "New password must be at least 6 characters" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return NextResponse.json({ success: true, message: "Profile updated successfully", data: { name: user.name, image: user.image } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
