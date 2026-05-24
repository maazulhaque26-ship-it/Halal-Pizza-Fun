import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Settings } from "@/lib/db/models/Settings";
import { ROLES } from "@/config/constants";

export const dynamic = "force-dynamic";

// ─── Flatten nested object to MongoDB dot-notation paths ──────────────────────
// { aboutPage: { stat1Value: "X" } } → { "aboutPage.stat1Value": "X" }
// Arrays are kept intact (not flattened further).
function flattenToDotPaths(obj: any, prefix = ""): Record<string, any> {
  return Object.keys(obj).reduce<Record<string, any>>((acc, k) => {
    const path = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      Object.keys(val).length > 0
    ) {
      Object.assign(acc, flattenToDotPaths(val, path));
    } else {
      acc[path] = val;
    }
    return acc;
  }, {});
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();
    // Use .lean() to get a plain JS object — avoids Mongoose Document
    // serialization quirks which can cause nested fields to be lost.
    let doc = await Settings.findOne().lean<Record<string, any>>();
    if (!doc) {
      const created = await Settings.create({});
      doc = created.toObject();
    } else {
      // ── Migration: seed any schema fields missing from the existing document.
      const schemaPaths = (Settings.schema as any).paths as Record<string, any>;
      const missing: Record<string, any> = {};

      for (const path of Object.keys(schemaPaths)) {
        const def = schemaPaths[path]?.options?.default;
        if (def === undefined) continue;

        const keys = path.split(".");
        let cur: any = doc;
        for (const k of keys) {
          if (cur == null || typeof cur !== "object") { cur = undefined; break; }
          cur = cur[k];
        }

        if (cur === undefined || cur === null) {
          missing[path] = typeof def === "function" ? def() : def;
        }
      }

      if (Object.keys(missing).length > 0) {
        await Settings.updateOne({}, { $set: missing });
        doc = await Settings.findOne().lean<Record<string, any>>();
      }
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    await connectDB();

    // Flatten to dot-paths so $set updates only the supplied fields
    // without clobbering any sibling fields in the same nested object.
    // This completely bypasses Mongoose's change-tracking and uses
    // MongoDB's native atomic $set — guaranteed to persist every field.
    const flatBody = flattenToDotPaths(body);

    const updated = await Settings.findOneAndUpdate(
      {},
      { $set: flatBody },
      { new: true, upsert: true, lean: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
