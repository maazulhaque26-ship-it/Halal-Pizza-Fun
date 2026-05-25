import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import { env } from "@/config/env";

export async function GET() {
  const result: Record<string, any> = {
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    MONGODB_URI_prefix: env.MONGODB_URI?.slice(0, 40) + "...",
    NEXTAUTH_SECRET_set: !!env.NEXTAUTH_SECRET,
  };

  try {
    await connectDB();
    result.db = "connected";

    const user = await User.findOne({ email: "admin@hpf.com" }).select("+password");
    if (!user) {
      result.user = "NOT FOUND";
    } else {
      result.user = "found";
      result.user_role = user.role;
      result.has_password = !!user.password;
      const match = await bcrypt.compare("admin123", user.password!);
      result.password_match = match;
    }
  } catch (e: any) {
    result.db_error = e.message;
  }

  return NextResponse.json(result);
}
