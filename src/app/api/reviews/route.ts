import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Review } from "@/lib/db/models/Review";

export async function GET() {
  try {
    await connectDB();
    const reviews = await Review.find({ status: { $ne: "rejected" } })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { guestName, guestAvatar, rating, comment } = body;

    if (!rating || !comment) {
      return NextResponse.json({ success: false, error: "Rating and comment are required" }, { status: 400 });
    }

    const newReview = await Review.create({
      guestName: guestName || "Anonymous Foodie",
      guestAvatar: guestAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      rating: Number(rating),
      comment,
      status: "approved", // auto-approve for immediate feedback display
    });

    return NextResponse.json({ success: true, data: newReview });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
