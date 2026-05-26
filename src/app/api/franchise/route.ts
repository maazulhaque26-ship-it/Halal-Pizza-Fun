import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Settings } from "@/lib/db/models/Settings";

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

// ─── Helper: build applicant email HTML ──────────────────────────────────────
// Kept as a plain function (no nested template literals) to avoid the
// "Expected unicode escape" Turbopack/TS parse error that occurs when
// back-tick strings are escaped inside an outer template literal.
function buildApplicantEmail(opts: {
  firstName: string;
  siteName: string;
  logoUrl: string;
  fb?: string;
  insta?: string;
  yt?: string;
}): string {
  const { firstName, siteName, logoUrl, fb, insta, yt } = opts;

  const logoHtml = logoUrl
    ? '<img src="' + logoUrl + '" alt="' + siteName + '" style="max-width:120px;margin-bottom:20px;" />'
    : '<h2 style="color:#f59e0b;margin:0 0 20px 0;">' + siteName + "</h2>";

  const socialLinks = [
    fb
      ? '<a href="' + fb + '" style="display:inline-block;margin-left:5px;background:#111;color:#fff;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;text-decoration:none;font-size:13px;font-weight:bold;">f</a>'
      : "",
    insta
      ? '<a href="' + insta + '" style="display:inline-block;margin-left:5px;background:#111;color:#fff;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;text-decoration:none;font-size:13px;font-weight:bold;">in</a>'
      : "",
    yt
      ? '<a href="' + yt + '" style="display:inline-block;margin-left:5px;background:#111;color:#fff;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;text-decoration:none;font-size:13px;font-weight:bold;">yt</a>'
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body{font-family:'Inter',Arial,sans-serif;margin:0;padding:0;background-color:#f4f4f5;}
  .container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05);}
  .header{background-color:#111;padding:40px 30px;position:relative;}
  .header-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.72);}
  .header-content{position:relative;z-index:1;}
  .header-title{color:#fff;font-size:26px;font-weight:800;margin:0 0 10px;text-transform:uppercase;line-height:1.25;}
  .header-title span{color:#f59e0b;}
  .header-subtitle{color:#d1d5db;font-size:15px;margin:0;}
  .body-content{padding:40px 30px;color:#374151;line-height:1.6;}
  .greeting{font-size:20px;color:#111;margin-bottom:16px;font-weight:600;}
  .greeting span{color:#f59e0b;}
  .time-box{border:2px dashed #fcd34d;background:#fffbeb;border-radius:12px;padding:24px;text-align:center;margin:30px 0;}
  .time-box h3{margin:0 0 4px;color:#111;font-size:17px;}
  .time-box .hours{color:#f59e0b;font-size:28px;font-weight:800;margin:4px 0;}
  .time-box p{margin:0;color:#4b5563;font-size:14px;}
  .why-title{font-size:16px;font-weight:700;color:#111;text-transform:uppercase;text-align:center;margin-bottom:20px;letter-spacing:1px;}
  .feature-icon{width:48px;height:48px;background:#fffbeb;border-radius:50%;line-height:48px;text-align:center;margin:0 auto 8px;font-size:22px;}
  .feature-title{font-size:11px;font-weight:700;color:#111;margin:0 0 4px;}
  .feature-desc{font-size:10px;color:#6b7280;margin:0;line-height:1.4;}
  .divider{border:none;border-top:1px solid #e5e7eb;margin:30px 0;}
  .team-name{font-weight:700;color:#111;}
  .slogan{color:#f59e0b;font-style:italic;font-size:17px;font-family:Georgia,serif;margin:8px 0 0;}
  .footer-bottom{background:#111;color:#9ca3af;text-align:center;padding:18px;font-size:12px;}
</style>
</head>
<body>
<div style="padding:20px;">
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        ${logoHtml}
        <h1 class="header-title">THANK YOU FOR<br>CHOOSING TO GROW<br><span>WITH US!</span></h1>
        <p class="header-subtitle">We have received your franchise application successfully.</p>
      </div>
    </div>

    <!-- BODY -->
    <div class="body-content">
      <div class="greeting">Hi <span>${firstName}</span>,</div>
      <p style="font-size:16px;margin:0 0 24px;">
        Thank you for your interest in starting a franchise journey with <strong>${siteName}</strong>!<br><br>
        We have received your application and our franchise director will personally review your details.
      </p>

      <!-- 48-hour box -->
      <div class="time-box">
        <h3>We will get in touch with you within</h3>
        <div class="hours">48 HOURS</div>
        <p>to discuss the next steps.</p>
      </div>

      <!-- Why partner -->
      <div class="why-title">🔥 WHY PARTNER WITH ${siteName.toUpperCase()}? 🔥</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="text-align:center;">
        <tr>
          <td width="20%" align="center" valign="top" style="padding:0 5px;">
            <div class="feature-icon">🏅</div>
            <p class="feature-title">Trusted Brand</p>
            <p class="feature-desc">A growing brand with loyal customers.</p>
          </td>
          <td width="20%" align="center" valign="top" style="padding:0 5px;">
            <div class="feature-icon">👨‍🏫</div>
            <p class="feature-title">Complete Training</p>
            <p class="feature-desc">Full training &amp; operational support.</p>
          </td>
          <td width="20%" align="center" valign="top" style="padding:0 5px;">
            <div class="feature-icon">📢</div>
            <p class="feature-title">Marketing Support</p>
            <p class="feature-desc">National marketing &amp; promotions.</p>
          </td>
          <td width="20%" align="center" valign="top" style="padding:0 5px;">
            <div class="feature-icon">📈</div>
            <p class="feature-title">High Profit</p>
            <p class="feature-desc">Proven model with high returns.</p>
          </td>
          <td width="20%" align="center" valign="top" style="padding:0 5px;">
            <div class="feature-icon">🤝</div>
            <p class="feature-title">Ongoing Support</p>
            <p class="feature-desc">Continuous guidance from our team.</p>
          </td>
        </tr>
      </table>

      <!-- Signature -->
      <hr class="divider">
      <table width="100%">
        <tr>
          <td>
            <p style="margin:0 0 4px;">Best Regards,</p>
            <p class="team-name">${siteName} Team</p>
            <p class="slogan">Let's grow together!</p>
          </td>
          <td align="right" valign="bottom">
            ${socialLinks
              ? `<p style="font-size:12px;font-weight:600;margin:0 0 5px;">Follow Us</p><div>${socialLinks}</div>`
              : ""}
          </td>
        </tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div class="footer-bottom">
      &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Helper: build admin notification email HTML ──────────────────────────────
function buildAdminEmail(opts: {
  siteName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  capital: string;
}): string {
  const { siteName, firstName, lastName, email, phone, city, capital } = opts;
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;border:1px solid #ddd;border-radius:10px;">
    <h2 style="color:#333;">New Franchise Application</h2>
    <p style="color:#555;">A new franchise request has been submitted:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <tr style="background:#fff;border-bottom:1px solid #ddd;">
        <td style="padding:10px;font-weight:bold;width:35%;">Name</td>
        <td style="padding:10px;">${firstName} ${lastName}</td>
      </tr>
      <tr style="background:#fff;border-bottom:1px solid #ddd;">
        <td style="padding:10px;font-weight:bold;">Email</td>
        <td style="padding:10px;">${email}</td>
      </tr>
      <tr style="background:#fff;border-bottom:1px solid #ddd;">
        <td style="padding:10px;font-weight:bold;">Phone</td>
        <td style="padding:10px;">${phone}</td>
      </tr>
      <tr style="background:#fff;border-bottom:1px solid #ddd;">
        <td style="padding:10px;font-weight:bold;">Target City</td>
        <td style="padding:10px;">${city}</td>
      </tr>
      <tr style="background:#fff;">
        <td style="padding:10px;font-weight:bold;">Liquid Capital</td>
        <td style="padding:10px;">${capital}</td>
      </tr>
    </table>
    <p style="margin-top:20px;color:#777;font-size:12px;">Automated message from the ${siteName} franchise portal.</p>
  </div>`;
}

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

    console.log(`[Franchise] Application from ${email} (IP: ${ip}, city: ${city})`);
    await connectDB();
    const settings = (await Settings.findOne().lean()) as any;

    const siteName = settings?.siteName || "Halal Pizza Fun";
    const logoUrl =
      settings?.logoUrl ||
      "https://res.cloudinary.com/dd8htj7dz/image/upload/v1731650367/hpf-logo_vj9qxj.png";
    const fb = settings?.socialLinks?.facebook || "";
    const insta = settings?.socialLinks?.instagram || "";
    const yt = settings?.socialLinks?.youtube || "";

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const senderAddress = process.env.EMAIL_USER || "noreply@hpf.com";

    const applicantMailOptions = {
      from: `"${siteName}" <${senderAddress}>`,
      to: email,
      subject: `Franchise Application Received - ${siteName}`,
      html: buildApplicantEmail({ firstName, siteName, logoUrl, fb, insta, yt }),
    };

    const adminMailOptions = {
      from: `"${siteName} Franchise System" <${senderAddress}>`,
      to: process.env.ADMIN_EMAIL || senderAddress,
      subject: `New Franchise Application from ${firstName} ${lastName}`,
      html: buildAdminEmail({ siteName, firstName, lastName, email, phone, city, capital }),
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await Promise.all([
        transporter.sendMail(applicantMailOptions),
        transporter.sendMail(adminMailOptions),
      ]);
      console.log("✅ Franchise emails sent successfully");
    } else {
      console.warn(
        "⚠️ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in your .env to enable email sending."
      );
    }

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
