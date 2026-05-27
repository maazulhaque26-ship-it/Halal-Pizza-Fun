import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const query: any = { isArchived: { $ne: true } };
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query).populate("branchId", "name").select("-password").sort({ createdAt: -1 }).lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: users, total });
  } catch (error) {
    console.error("GET /api/users error:", error);
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
    const { name, email, password, role, branchId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "name, email and password required" }, { status: 400 });
    }

    await connectDB();
    const exists = await User.findOne({ email });
    if (exists) return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || ROLES.CUSTOMER, branchId });

    const { password: _, ...safe } = user.toObject();
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
