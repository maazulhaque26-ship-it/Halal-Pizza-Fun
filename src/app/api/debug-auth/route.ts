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

// One-time seed endpoint — creates admin if missing
export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (key !== "hpf-seed-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const db = (await import("mongoose")).default.connection.db!;

    const existing = await db.collection("users").findOne({ email: "admin@hpf.com" });
    if (existing) {
      return NextResponse.json({ status: "already exists", role: existing.role });
    }

    const pwd = await bcrypt.hash("admin123", 10);
    await db.collection("users").insertOne({
      name: "Super Admin",
      email: "admin@hpf.com",
      password: pwd,
      role: "SUPER_ADMIN",
      isActive: true,
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mgr = await db.collection("users").findOne({ email: "manager@hpf.com" });
    if (!mgr) {
      const pwd2 = await bcrypt.hash("manager123", 10);
      await db.collection("users").insertOne({
        name: "Branch Manager",
        email: "manager@hpf.com",
        password: pwd2,
        role: "BRANCH_MANAGER",
        isActive: true,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ status: "created", email: "admin@hpf.com", password: "admin123" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
