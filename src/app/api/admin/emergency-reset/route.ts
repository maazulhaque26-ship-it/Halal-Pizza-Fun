/**
 * ONE-TIME emergency password reset endpoint.
 * DELETE THIS FILE immediately after use.
 *
 * GET  /api/admin/emergency-reset?token=RESET_HPF_2026_ONCE&email=...&pwd=...
 * POST /api/admin/emergency-reset  body: { token, email, newPassword }
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SECRET_TOKEN = "RESET_HPF_2026_ONCE";

async function resetPassword(email: string, newPassword: string) {
  await connectDB();
  const db = mongoose.connection.db!;
  const col = db.collection("users");

  const user = await col.findOne({ email: email.toLowerCase().trim() });
  if (!user) return { ok: false, msg: `No user found with email: ${email}` };

  const hash = await bcrypt.hash(newPassword, 10);
  await col.updateOne(
    { _id: user._id },
    { $set: { password: hash, updatedAt: new Date() } }
  );
  return { ok: true, msg: `Password reset for ${email} (${user.role}). Log in now, then DELETE this file.` };
}

/** GET — open in browser: /api/admin/emergency-reset?token=RESET_HPF_2026_ONCE&email=admin@hpf.com&pwd=NewPass123 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const pwd   = searchParams.get("pwd") || "";

  if (token !== SECRET_TOKEN) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  if (!email || !pwd || pwd.length < 6) {
    return NextResponse.json({ success: false, message: "Provide email and pwd (min 6 chars)" }, { status: 400 });
  }

  const result = await resetPassword(email, pwd);
  return NextResponse.json({ success: result.ok, message: result.msg });
}

/** POST — for curl / Postman */
export async function POST(req: Request) {
  try {
    const { token, email, newPassword } = await req.json();
    if (token !== SECRET_TOKEN) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    if (!email || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }
    const result = await resetPassword(email, newPassword);
    return NextResponse.json({ success: result.ok, message: result.msg });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
