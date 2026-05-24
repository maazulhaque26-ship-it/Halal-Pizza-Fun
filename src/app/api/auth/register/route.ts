import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

// Enterprise-grade lightweight in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5; // Limit to 5 registrations per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (now - record.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many registration attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "CUSTOMER", // default role
    });

    return NextResponse.json(
      { success: true, message: "Registration successful" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
