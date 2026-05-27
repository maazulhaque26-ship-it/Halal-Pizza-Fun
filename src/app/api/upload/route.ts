import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { ROLES } from "@/config/constants";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES_STAFF = 10 * 1024 * 1024; // 10 MB for admins / branch managers
const MAX_BYTES_GUEST = 2 * 1024 * 1024;  // 2 MB for review-avatar guest uploads
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// ─── In-memory per-IP rate limiter for guest uploads ───────────────────
const GUEST_UPLOAD_LIMIT = 5;            // 5 uploads / window
const GUEST_UPLOAD_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const guestUploadMap = new Map<string, { count: number; resetAt: number }>();

function isGuestRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = guestUploadMap.get(ip);
  if (!entry || now > entry.resetAt) {
    guestUploadMap.set(ip, { count: 1, resetAt: now + GUEST_UPLOAD_WINDOW_MS });
    return false;
  }
  if (entry.count >= GUEST_UPLOAD_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("[Upload] Cloudinary env vars missing");
      return NextResponse.json(
        { success: false, message: "Image upload is not configured on the server." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const isStaff =
      role === ROLES.SUPER_ADMIN ||
      role === ROLES.BRANCH_MANAGER ||
      role === ROLES.MANAGER;

    // ─── Anonymous + customer uploads are rate-limited and size-capped ────
    // (used by the public review form for guest avatars).
    if (!isStaff) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      if (isGuestRateLimited(ip)) {
        return NextResponse.json(
          { success: false, message: "Too many uploads. Please try again later." },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    // Force folder for non-staff to prevent overwriting brand assets
    const requestedFolder = (formData.get("folder") as string) || "uploads";
    const folder = isStaff ? requestedFolder : "guest-avatars";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // ─── MIME + size validation ─────────────────────────────────────────
    const maxBytes = isStaff ? MAX_BYTES_STAFF : MAX_BYTES_GUEST;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, message: `File too large. Max ${maxBytes / (1024 * 1024)} MB.` },
        { status: 413 }
      );
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only image files (jpg, png, webp, gif) are allowed." },
        { status: 400 }
      );
    }

    const extension = file.name ? path.extname(file.name).toLowerCase() : ".png";
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { success: false, message: "Only image files (jpg, png, webp, gif) are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: "image" }, (error, res) => {
          if (error || !res) reject(error || new Error("Cloudinary upload failed"));
          else resolve(res as { secure_url: string });
        })
        .end(buffer);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 30 seconds")), 30_000)
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]);

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
