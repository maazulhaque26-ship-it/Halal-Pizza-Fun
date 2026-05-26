import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("HPF Food Delivery"),

  // MongoDB URI is NOT an HTTP URL — z.string().url() rejects mongodb:// in Zod v4
  MONGODB_URI: z.string().min(10).default("mongodb://localhost:27017/hpf"),

  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(1).default("default_secret_for_dev_only"),
  JWT_SECRET: z.string().min(1).default("default_jwt_secret_for_dev_only"),

  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  NEXT_PUBLIC_SOCKET_URL: z.string().default("http://localhost:4000"),

  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),

  ADMIN_DEFAULT_EMAIL: z.string().default("admin@hpf.com"),
  ADMIN_DEFAULT_PASSWORD: z.string().min(6).default("admin123"),
  SOCKET_API_KEY: z.string().default("dev_socket_api_key_123"),
  VAPID_SUBJECT: z.string().default("mailto:hello@hpf.com"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default("BBs-3YLB0cWuEYS48uNzJyK1B2zms0OOP-WFWR9dwTZ0BMExIsN1fmeOrMmmszQBH1wXL6Y5jrv5J7PRTdP_5kM"),
  VAPID_PRIVATE_KEY: z.string().default("default_private_vapid_key_for_dev_only_1234567890"),
  CSRF_SECRET: z.string().min(16).default("csrf_dev_secret_replace_in_production_1234567890"),

});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // Zod v4 uses .issues instead of removed .format()
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.issues, null, 2));
  throw new Error("Invalid environment variables. Check server logs.");
}

export const env = _env.data;
