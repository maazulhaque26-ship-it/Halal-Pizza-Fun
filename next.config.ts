import path from "path";
import type { NextConfig } from "next";

// ─── Build-time environment variable warning ────────────────────────────────
// Warn (not fail) if NEXT_PUBLIC_SOCKET_URL is missing or pointing at localhost
// during a production build. The variable is injected by CI via
// .env.production.local so throwing here would break Vercel cloud builds.
if (process.env.NODE_ENV === "production") {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (
    !socketUrl ||
    socketUrl.includes("localhost") ||
    socketUrl.includes("127.0.0.1")
  ) {
    console.warn(
      "\n⚠  WARNING: NEXT_PUBLIC_SOCKET_URL is missing or points to localhost." +
      "\n   Real-time features will not work in production." +
      `\n   Current value: "${socketUrl}"\n`
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

  // ─── Webpack: explicit @ alias ─────────────────────────────────────────
  // Next.js normally reads @/* from tsconfig.json paths, but vercel build
  // re-runs npm ci in its own environment before calling next build, which
  // can leave the tsconfig paths unresolved on Linux. Hardcode the alias so
  // it is always set regardless of how tsconfig.json is loaded.
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },

  // ─── HTTP Security Headers ──────────────────────────────────────────────
  // Hardens responses against clickjacking, MIME-sniffing, leakage and other
  // common web attacks. HSTS forces HTTPS for one year (including subdomains).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
