// ─── Email Branding ───────────────────────────────────────────────────────────
// All values are derived from the settings document that the caller passes in.
// This module NEVER fetches from the database — it only transforms the data it
// receives, keeping templates side-effect free and easy to test.

export interface EmailBranding {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  websiteUrl: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
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

    logoUrl:
      settings?.mobileLogoUrl ||
      settings?.logoUrl ||
      `${appUrl}/icons/icon-192x192.png`,

    primaryColor: settings?.theme?.primaryColor || "#f59e0b",
    accentColor: settings?.theme?.accentColor || "#d97706",

    supportEmail:
      settings?.contactEmail ||
      process.env.ADMIN_EMAIL ||
      process.env.EMAIL_USER ||
      "",

    websiteUrl: appUrl,

    socialLinks: {
      facebook: settings?.socialLinks?.facebook || undefined,
      instagram: settings?.socialLinks?.instagram || undefined,
      twitter: settings?.socialLinks?.twitter || undefined,
      youtube: settings?.socialLinks?.youtube || undefined,
    },
  };
}
