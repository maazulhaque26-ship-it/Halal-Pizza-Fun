import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

/** POST /api/me/password — change current user's password */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "Both fields are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    // Load user with password for verification only
    const user = await User.findById(session.user.id).select("+password").lean();
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const match = await bcrypt.compare(currentPassword, (user as any).password || "");
    if (!match) {
      return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 });
    }

    // Use findByIdAndUpdate to avoid Mongoose document lifecycle issues
    // (bypasses pre-save hooks, validation, and document state problems)
    const newHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(
      session.user.id,
      { $set: { password: newHash } },
      { runValidators: false }
    );

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("[/api/me/password]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
