import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    // Note: This endpoint is public to allow customers to upload avatars for reviews.
    // Security: We enforce that only image files can be uploaded.

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const extension = file.name ? path.extname(file.name).toLowerCase() : ".png";
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ success: false, message: "Only image files (jpg, png, webp, gif) are allowed." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${folder}_${uniqueSuffix}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file locally
    await fs.promises.writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;
    console.log(`✅ Local file uploaded successfully: ${fileUrl}`);

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Local upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
