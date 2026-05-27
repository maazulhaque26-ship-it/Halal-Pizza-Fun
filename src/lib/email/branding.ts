// ─── Email Branding ───────────────────────────────────────────────────────────
// All values are derived from the settings document that the caller passes in.
// This module NEVER fetches from the database — it only transforms the data it
// receives, keeping templates side-effect free and easy to test.

export interface EmailBranding {
  appName: string;
  tagline: string;
  logoUrl: string;
  headerFoodImageUrl: string;
  primaryColor: string;
  accentColor: string;
  darkColor: string;
  supportEmail: string;
  phone: string;
  websiteUrl: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    youtube?: string;
  };
}

/**
 * Build the branding object for email templates.
 *
 * @param settings - A plain-object version of the Settings DB document
 *                   (pass `null` or `undefined` to use env / default values).
 */
export function getBranding(settings?: Record<string, any> | null): EmailBranding {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://pizzafun.co.in";

  return {
    appName:
      settings?.siteName ||
      process.env.NEXT_PUBLIC_APP_NAME ||
      "Halal Pizza Fun",

    tagline:
      settings?.tagline ||
      "Delicious. Halal. Always.",

    logoUrl:
      settings?.mobileLogoUrl ||
      settings?.logoUrl ||
      `${appUrl}/icons/icon-192x192.png`,

    // Food hero image shown in email header (right side pizza photo)
    // Admin can set this via Settings → Email Header Image
    headerFoodImageUrl:
      settings?.emailHeaderImageUrl ||
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=240&h=200&fit=crop&q=80",

    primaryColor: settings?.theme?.primaryColor || "#f4813f",
    accentColor: settings?.theme?.accentColor || "#2e7d52",
    darkColor: "#1a3320",

    supportEmail:
      settings?.contactEmail ||
      process.env.ADMIN_EMAIL ||
      process.env.EMAIL_USER ||
      "",

    phone:
      settings?.phone ||
      settings?.contactPhone ||
      "",

    websiteUrl: appUrl,

    socialLinks: {
      facebook:  settings?.socialLinks?.facebook  || undefined,
      instagram: settings?.socialLinks?.instagram || undefined,
      whatsapp:  settings?.socialLinks?.whatsapp  || undefined,
      twitter:   settings?.socialLinks?.twitter   || undefined,
      youtube:   settings?.socialLinks?.youtube   || undefined,
    },
  };
}
