import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Settings } from "@/lib/db/models/Settings";
import { sendEmail } from "@/lib/email/mailer";
import { getBranding } from "@/lib/email/branding";
import {
  buildContactNotificationEmail,
  buildContactAcknowledgementEmail,
} from "@/lib/email/templates/contactNotification";
import { emailConfig } from "@/lib/email/config";

// ─── Rate limiter: max 3 submissions per IP per hour ─────────────────────────
const franchiseRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkFranchiseRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = franchiseRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    franchiseRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Zod validation schema ────────────────────────────────────────────────────
const franchiseSchema = z.object({
  firstName: z.string().min(1).max(60).trim(),
  lastName: z.string().max(60).trim().optional().default(""),
  email: z.string().email().max(254).trim().toLowerCase(),
  phone: z.string().min(7).max(20).trim(),
  city: z.string().min(1).max(100).trim(),
  capital: z.string().max(100).trim().optional().default(""),
  // honeypot — must be absent or empty; bots typically fill it
  website: z.string().max(0, "Bot detected").optional(),
});

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkFranchiseRateLimit(ip)) {
      console.warn(`[Franchise] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: "Too many applications submitted. Try again later." },
        { status: 429 }
      );
    }

    // ── Zod validation + honeypot check ──────────────────────────────────────
    const parsed = franchiseSchema.safeParse(await req.json());
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      if (firstError?.path[0] === "website") {
        // Honeypot triggered — silently accept to not tip off bots
        return NextResponse.json({ success: true, message: "Application submitted successfully" });
      }
      return NextResponse.json(
        { success: false, message: firstError?.message || "Invalid submission" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, city, capital } = parsed.data;
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    console.log(`[Franchise] Application from ${email} (IP: ${ip}, city: ${city})`);

    await connectDB();
    const settings = (await Settings.findOne().lean()) as any;
    const branding = getBranding(settings);

    // ── Email to applicant ────────────────────────────────────────────────────
    const applicantHtml = buildContactAcknowledgementEmail({
      branding,
      recipientName: firstName,
      inquiryType: "franchise inquiry",
      replyWithin: "48 hours",
    });

    // ── Email to admin / franchise team ──────────────────────────────────────
    const adminFields = [
      { label: "Full Name", value: fullName },
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "Target City", value: city },
      ...(capital ? [{ label: "Available Capital", value: capital }] : []),
    ];

    const adminHtml = buildContactNotificationEmail({
      branding,
      formType: "New Franchise Inquiry",
      submitterName: fullName,
      submitterEmail: email,
      submitterPhone: phone,
      fields: adminFields,
      submittedAt: new Date(),
    });

    await Promise.all([
      sendEmail({
        to: email,
        subject: "We received your inquiry — " + branding.appName,
        html: applicantHtml,
      }),
      sendEmail({
        to: emailConfig.adminEmail || email,
        subject: "New Franchise Inquiry from " + fullName + " (" + city + ")",
        html: adminHtml,
        replyTo: email,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error: any) {
    console.error("Franchise API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
