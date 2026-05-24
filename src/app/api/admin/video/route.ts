import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Settings } from "@/lib/db/models/Settings";
import { ROLES } from "@/config/constants";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const settings = await Settings.findOne({}).lean() as any;
    return NextResponse.json({
      success: true,
      data: {
        videoUrl: settings?.aboutPage?.videoUrl || "",
        videoTitle: settings?.aboutPage?.videoTitle || "Experience Premium Dining",
        videoSubtitle: settings?.aboutPage?.videoSubtitle || "Watch how we craft every dish",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;
    const videoTitle = formData.get("videoTitle") as string | null;
    const videoSubtitle = formData.get("videoSubtitle") as string | null;

    let finalVideoUrl = videoUrl || "";

    if (file) {
      const extension = path.extname(file.name).toLowerCase();
      const allowedVideoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
      if (!allowedVideoExtensions.includes(extension)) {
        return NextResponse.json({ success: false, message: "Only video files (mp4, webm, ogg, mov) are allowed." }, { status: 400 });
      }

      const maxSizeBytes = 100 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return NextResponse.json({ success: false, message: "Video file must be under 100MB." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const videosDir = path.join(process.cwd(), "public", "uploads", "videos");
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `promo_${uniqueSuffix}${extension}`;
      const filepath = path.join(videosDir, filename);
      await fs.promises.writeFile(filepath, buffer);
      finalVideoUrl = `/uploads/videos/${filename}`;
    }

    await connectDB();
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "aboutPage.videoUrl": finalVideoUrl,
          ...(videoTitle ? { "aboutPage.videoTitle": videoTitle } : {}),
          ...(videoSubtitle ? { "aboutPage.videoSubtitle": videoSubtitle } : {}),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Video updated successfully", videoUrl: finalVideoUrl });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const settings = await Settings.findOne({}).lean() as any;
    const existingVideoUrl: string = settings?.aboutPage?.videoUrl || "";

    if (existingVideoUrl && existingVideoUrl.startsWith("/uploads/")) {
      const localPath = path.join(process.cwd(), "public", existingVideoUrl);
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath);
      }
    }

    await Settings.findOneAndUpdate({}, { $set: { "aboutPage.videoUrl": "" } }, { upsert: true });
    return NextResponse.json({ success: true, message: "Video removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
