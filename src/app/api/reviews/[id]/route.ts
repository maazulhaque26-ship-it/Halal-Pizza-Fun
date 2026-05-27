import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Review } from "@/lib/db/models/Review";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const { status } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    console.error("PATCH /api/reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    const review = await Review.findByIdAndDelete(id).lean();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error: any) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
