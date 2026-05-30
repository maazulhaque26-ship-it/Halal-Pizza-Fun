import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { PwaManager } from "@/components/pwa/PwaManager";
import { OrderPopup } from "@/components/admin/OrderPopup";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getSettings } from "@/lib/services/SettingsService";
import { ASSETS } from "@/config/constants";
import { CsrfProvider } from "@/components/CsrfProvider";
import { organizationSchema, websiteSchema, localBusinessSchema } from "@/lib/seo/schema";
import { SEO_CONFIG } from "@/lib/seo/config";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLD";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  themeColor: "#F4C430",
  width: "device-width",
  initialScale: 1,
};

/**
 * Dynamic metadata generated from the database Settings document.
 * Falls back to HPF-specific SEO defaults when DB is unavailable.
 */
export async function generateMetadata(): Promise<Metadata> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }

  const siteName    = settings?.siteName    || SEO_CONFIG.siteName;
  const siteDesc    = settings?.siteDescription || SEO_CONFIG.defaults.description;
  const metaTitle   = settings?.seo?.metaTitle
    || `${siteName} | Best Halal Pizza Delivery in Delhi – Shaheen Bagh, Zakir Nagar`;
  const metaDesc    = settings?.seo?.metaDescription || SEO_CONFIG.defaults.description;
  const ogImage     = settings?.seo?.ogImage        || SEO_CONFIG.defaults.ogImage;
  const seoShareImg = settings?.seo?.seoShareImage  || ogImage;
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL || SEO_CONFIG.siteUrl;

  return {
    // ── Titles ──────────────────────────────────────────────────────────
    title: {
      default:  metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDesc,

    // ── Keywords (merged: brand + local + long-tail sample) ─────────────
    keywords: [
      ...SEO_CONFIG.primaryKeywords,
      ...SEO_CONFIG.secondaryKeywords,
      "halal pizza fun",
      "pizza fun delhi",
      "hpf food delivery",
      siteDesc,
    ],

    // ── Authorship & robots ──────────────────────────────────────────────
    authors:  [{ name: siteName, url: baseUrl }],
    robots: {
      index:             true,
      follow:            true,
      googleBot: {
        index:              true,
        follow:             true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet":       -1,
      },
    },

    // ── Canonical & alternates ──────────────────────────────────────────
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/",
      languages: { "en-IN": "/" },
    },

    // ── Open Graph ───────────────────────────────────────────────────────
    openGraph: {
      type:      "website",
      siteName,
      title:     metaTitle,
      description: metaDesc,
      url:       baseUrl,
      locale:    SEO_CONFIG.locale,
      images: [
        {
          url:    ogImage,
          width:  1200,
          height: 630,
          alt:    `${siteName} – Halal Pizza Delhi`,
        },
      ],
    },

    // ── Twitter / X ──────────────────────────────────────────────────────
    twitter: {
      card:        "summary_large_image",
      site:        SEO_CONFIG.brandHandle,
      title:       metaTitle,
      description: metaDesc,
      images:      [seoShareImg],
    },

    // ── Icons & manifest ─────────────────────────────────────────────────
    icons: {
      icon:     settings?.faviconUrl || ASSETS.FAVICON,
      shortcut: settings?.faviconUrl || ASSETS.FAVICON,
      apple:    "/icons/icon-192x192.png",
    },
    manifest: "/manifest.json",

    // ── PWA / Apple ──────────────────────────────────────────────────────
    appleWebApp: {
      capable:          true,
      statusBarStyle:   "black-translucent",
      title:            metaTitle,
    },

    // ── Verification (fill in after connecting to search consoles) ───────
    verification: {
      google: "",   // ← paste your Google Search Console verification token
      // yandex: "",
      // bing:   "",
    },

    // ── Category ────────────────────────────────────────────────────────
    category: "food",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${plusJakarta.variable} ${playfair.variable}`}
      data-scroll-behavior="smooth"
    >
      <body
        suppressHydrationWarning
        className="font-sans antialiased"
        style={{ fontFamily: "var(--font-jakarta), 'Inter', system-ui, sans-serif" }}
      >
        {/* ── Global JSON-LD Schemas ─────────────────────────────────────
            Injected once for every page. Google reads these from any page
            in the site, so putting them in the root layout is the most
            efficient approach. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <JsonLd data={localBusinessSchema()} />

        <CsrfProvider>
          <AuthProvider>
            {children}
            <PwaManager />
            <OrderPopup />
            <MobileBottomNav />
          </AuthProvider>
        </CsrfProvider>
      </body>
    </html>
  );
}