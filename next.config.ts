import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the local network IP to access dev resources (HMR) without warnings
  allowedDevOrigins: ['10.23.5.84'],

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
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
