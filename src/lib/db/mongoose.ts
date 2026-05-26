import mongoose from "mongoose";
import { env } from "@/config/env";

// Register every model once so populate() never throws "Schema not registered".
// Import order matters: referenced models (Category, Branch, User) before dependants.
import "@/lib/db/models/User";
import "@/lib/db/models/Branch";
import "@/lib/db/models/Category";
import "@/lib/db/models/Product";
import "@/lib/db/models/ProductVariant";
import "@/lib/db/models/Order";
import "@/lib/db/models/Payment";
import "@/lib/db/models/Coupon";
import "@/lib/db/models/Review";
import "@/lib/db/models/Notification";
import "@/lib/db/models/DeliveryPartner";
import "@/lib/db/models/Area";
import "@/lib/db/models/OrderTransfer";
import "@/lib/db/models/AuditLog";
import "@/lib/db/models/Inventory";
import "@/lib/db/models/Settings";
import "@/lib/db/models/IdempotencyKey";
import "@/lib/db/models/Migration";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (process.env.NODE_ENV === "development" && !(global as any).socketServerStarted) {
    (global as any).socketServerStarted = true;
    try {
      const { spawn } = require("child_process");
      const path = require("path");
      console.log("⚡ [Auto-Start] Initiating background Socket.IO server...");
      const child = spawn("node", [path.join(process.cwd(), "socket-server.js")], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } catch (err) {
      console.error("⚠️ [Auto-Start] Failed to start Socket.IO server:", err);
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then(async (mongoose) => {
      console.log("🟢 Connected to MongoDB Database");
      // Dynamic import avoids top-level circular-dep risk in Next.js serverless bundles
      const { runMigrations } = await import("@/lib/db/migrations/runner");
      await runMigrations();
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("🔴 MongoDB Connection Error:", e);
    throw e;
  }

  return cached.conn;
};
