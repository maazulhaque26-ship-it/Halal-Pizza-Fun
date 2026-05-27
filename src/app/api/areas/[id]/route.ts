import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { AreaService } from "@/lib/services/AreaService";
import { connectDB } from "@/lib/db/mongoose";
import { ROLES } from "@/config/constants";
import mongoose from "mongoose";

// GET /api/areas/[id] - Get specific area details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const area = await AreaService.getAreaById(id);
    if (!area) {
      return NextResponse.json(
        { success: false, error: "Area not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error("Error fetching area:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch area",
      },
      { status: 500 }
    );
  }
}

// PUT /api/areas/[id] - Update area (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Check authentication and role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super admins can update areas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, assignedBranchId, pinCodes, landmarks, displayOrder } =
      body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (assignedBranchId) updateData.assignedBranchId = assignedBranchId;
    if (pinCodes) updateData.pinCodes = pinCodes;
    if (landmarks) updateData.landmarks = landmarks;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const area = await AreaService.updateArea(id, updateData);
    if (!area) {
      return NextResponse.json(
        { success: false, error: "Area not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: area,
      message: "Area updated successfully",
    });
  } catch (error) {
    console.error("Error updating area:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update area",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/areas/[id] - Delete area (soft delete, ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Check authentication and role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super admins can delete areas" },
        { status: 403 }
      );
    }

    const area = await AreaService.deactivateArea(id);
    if (!area) {
      return NextResponse.json(
        { success: false, error: "Area not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Area deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting area:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete area",
      },
      { status: 500 }
    );
  }
}
