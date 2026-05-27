import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { PwaManager } from "@/components/pwa/PwaManager";
import { OrderPopup } from "@/components/admin/OrderPopup";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getSettings } from "@/lib/services/SettingsService";
import { ASSETS } from "@/config/constants";
import { CsrfProvider } from "@/components/CsrfProvider";
import "./globals.css";

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
 * No hardcoded SEO values — all admin-controlled.
 */
export async function generateMetadata(): Promise<Metadata> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    // If DB is unavailable, fall back gracefully
    settings = null;
  }

  const siteName = settings?.siteName || "HPF";
  const siteDescription =
    settings?.siteDescription || "Premium Food Delivery Platform";
  const metaTitle = settings?.seo?.metaTitle || `${siteName} | Discover the Best Food Around You`;
  const metaDescription = settings?.seo?.metaDescription || siteDescription;
  const ogImage = settings?.seo?.ogImage || ASSETS.FALLBACK_FOOD_IMAGE;
  const seoShareImage = settings?.seo?.seoShareImage || ogImage;

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDescription,
    keywords: ["food delivery", "restaurants", "food", "order online"],
    authors: [{ name: siteName }],
    openGraph: {
      type: "website",
      siteName,
      title: metaTitle,
      description: metaDescription,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [seoShareImage],
    },
    icons: {
      icon: settings?.faviconUrl || ASSETS.FAVICON,
      shortcut: settings?.faviconUrl || ASSETS.FAVICON,
    },
    manifest: "/manifest.json",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: metaTitle,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${plusJakarta.variable} ${playfair.variable}`} data-scroll-behavior="smooth">
      {/* suppressHydrationWarning: browser extensions (Grammarly, password managers)
          inject attributes/text into the DOM after SSR, causing React error #418.
          This tells React to ignore those mismatches on the body element only. */}
      <body suppressHydrationWarning className="font-sans antialiased" style={{ fontFamily: "var(--font-jakarta), 'Inter', system-ui, sans-serif" }}>
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
