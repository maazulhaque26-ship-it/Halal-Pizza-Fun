/**
 * ONE-TIME emergency password reset endpoint.
 * DELETE THIS FILE immediately after use.
 *
 * POST /api/admin/emergency-reset
 * Body: { token: "RESET_2026", email: "...", newPassword: "..." }
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

const SECRET_TOKEN = "RESET_HPF_2026_ONCE";

export async function POST(req: Request) {
  try {
    const { token, email, newPassword } = await req.json();

    if (token !== SECRET_TOKEN) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    if (!email || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { $set: { password: hash } }, { runValidators: false });

    return NextResponse.json({
      success: true,
      message: `Password reset for ${email}. DELETE this endpoint now!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
