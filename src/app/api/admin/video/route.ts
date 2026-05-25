import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Settings } from "@/lib/db/models/Settings";
import { ROLES } from "@/config/constants";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const settings = (await Settings.findOne({}).lean()) as any;
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

    let finalVideoUrl = videoUrl?.trim() || "";

    if (file) {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: "Only mp4, webm, ogg, mov files are allowed." },
          { status: 400 }
        );
      }
      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ success: false, message: "Video must be under 100 MB." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "hpf/videos", resource_type: "video" },
            (err, res) => {
              if (err || !res) reject(err || new Error("Cloudinary upload failed"));
              else resolve(res as { secure_url: string });
            }
          )
          .end(buffer);
      });

      finalVideoUrl = result.secure_url;
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

    return NextResponse.json({ success: true, videoUrl: finalVideoUrl });
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
    const settings = (await Settings.findOne({}).lean()) as any;
    const existingUrl: string = settings?.aboutPage?.videoUrl || "";

    // Delete from Cloudinary if it was a Cloudinary URL
    if (existingUrl && existingUrl.includes("cloudinary.com")) {
      try {
        const publicId = existingUrl.split("/upload/")[1]?.replace(/\.[^.]+$/, "");
        if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      } catch {
        // Non-fatal — proceed with clearing the DB field
      }
    }

    await Settings.findOneAndUpdate({}, { $set: { "aboutPage.videoUrl": "" } }, { upsert: true });
    return NextResponse.json({ success: true, message: "Video removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
