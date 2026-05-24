import { NextRequest, NextResponse } from "next/server";
import { AreaService } from "@/lib/services/AreaService";
import { connectDB } from "@/lib/db/mongoose";

// GET /api/areas/search?q=query - Search areas by name
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const areas = await AreaService.searchAreas(query);

    return NextResponse.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("Error searching areas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search areas",
      },
      { status: 500 }
    );
  }
}
