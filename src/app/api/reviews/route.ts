import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Review } from "@/lib/db/models/Review";

// In-memory rate limiter: max 3 reviews per IP per hour
const reviewRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkReviewRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = reviewRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    reviewRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET() {
  try {
    await connectDB();
    const reviews = await Review.find({ status: "approved" })
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
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkReviewRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many reviews submitted. Try again later." },
        { status: 429 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { guestName, rating, comment } = body;

    if (!rating || !comment) {
      return NextResponse.json({ success: false, error: "Rating and comment are required" }, { status: 400 });
    }

    if (typeof comment !== "string" || comment.length > 1000) {
      return NextResponse.json({ success: false, error: "Comment must be under 1000 characters" }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be 1–5" }, { status: 400 });
    }

    const newReview = await Review.create({
      guestName: typeof guestName === "string" ? guestName.slice(0, 60) : "Anonymous Foodie",
      rating: numRating,
      comment: comment.trim(),
      status: "pending", // requires admin approval — not auto-approved
    });

    return NextResponse.json({ success: true, data: { id: newReview._id } });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
