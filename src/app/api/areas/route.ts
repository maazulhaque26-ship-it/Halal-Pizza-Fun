import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { AreaService } from "@/lib/services/AreaService";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";

// GET /api/areas - List all active areas for customer selection
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const areas = await AreaService.getAllAreas();

    return NextResponse.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch areas",
      },
      { status: 500 }
    );
  }
}

// POST /api/areas - Create new area (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication and role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super admins can create areas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, assignedBranchId, pinCodes, landmarks, displayOrder } =
      body;

    // Validate required fields
    if (!name || !assignedBranchId) {
      return NextResponse.json(
        { success: false, error: "Name and assignedBranchId are required" },
        { status: 400 }
      );
    }

    const area = await AreaService.createArea({
      name,
      description,
      assignedBranchId: new mongoose.Types.ObjectId(assignedBranchId),
      pinCodes,
      landmarks,
      displayOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: area,
        message: "Area created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating area:", error);
    const message = (error as Error).message;

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to create area",
      },
      { status: 500 }
    );
  }
}
