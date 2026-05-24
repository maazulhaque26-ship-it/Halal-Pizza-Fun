import { NextResponse } from "next/server";
import { BranchService } from "@/lib/services/BranchService";
import { z } from "zod";

const querySchema = z.object({
  lat: z.string().transform((val) => parseFloat(val)),
  lng: z.string().transform((val) => parseFloat(val)),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");

    if (!latRaw || !lngRaw) {
      return NextResponse.json(
        { success: false, message: "Latitude and Longitude are required." },
        { status: 400 }
      );
    }

    const parsed = querySchema.safeParse({ lat: latRaw, lng: lngRaw });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid coordinates." },
        { status: 400 }
      );
    }

    const { lat, lng } = parsed.data;

    const nearestBranch = await BranchService.findNearestActiveBranch(lat, lng);

    if (!nearestBranch) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Sorry, we do not deliver to your location at this time." 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nearestBranch,
    });
  } catch (error: any) {
    console.error("Error finding nearest branch:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
