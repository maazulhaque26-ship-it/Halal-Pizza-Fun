import mongoose from "mongoose";
import { env } from "@/config/env";

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

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongoose) => {
      console.log("🟢 Connected to MongoDB Database");
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
