import type { NextConfig } from "next";

// ─── Build-time environment variable validation ────────────────────────────────
// This runs during `next build` / `vercel build`. If NEXT_PUBLIC_SOCKET_URL is
// missing or pointing at localhost during a production build, the build FAILS
// immediately with a clear error instead of silently baking localhost into the
// JS bundle and shipping broken real-time to all users.
//
// To bypass locally (e.g. NODE_ENV=production build without Render):
//   SKIP_SOCKET_URL_CHECK=1 next build
if (
  process.env.NODE_ENV === "production" &&
  !process.env.SKIP_SOCKET_URL_CHECK
) {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (
    !socketUrl ||
    socketUrl.includes("localhost") ||
    socketUrl.includes("127.0.0.1")
  ) {
    throw new Error(
      "\n\n" +
      "════════════════════════════════════════════════════════\n" +
      " FATAL BUILD ERROR: NEXT_PUBLIC_SOCKET_URL is missing\n" +
      " or is pointing to localhost in a production build.\n\n" +
      ` Current value: "${socketUrl}"\n\n` +
      " Fix:\n" +
      "   1. Open Vercel dashboard → your project → Settings\n" +
      "      → Environment Variables\n" +
      "   2. Add (or update) NEXT_PUBLIC_SOCKET_URL with the\n" +
      "      value: https://hpf-socket-server.onrender.com\n" +
      "   3. Set the environment target to 'Production'\n" +
      "   4. Trigger a new GitHub Actions deployment\n" +
      "════════════════════════════════════════════════════════\n"
    );
  }
}

const nextConfig: NextConfig = {
  // Allow the local network IP to access dev resources (HMR) without warnings
  allowedDevOrigins: ["10.23.5.84"],

  // Tell Next.js/Turbopack these packages are Node.js-only.
  // Without this, Turbopack may try to bundle them for the browser and crash.
  serverExternalPackages: [
    "mongoose",
    "web-push",
    "bcryptjs",
    "jsonwebtoken",
    "nodemailer",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
