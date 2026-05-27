// Always fetch fresh data so admin-controlled content (hero background, banners,
// settings) is visible immediately after saving — never serve a stale Next.js cache.
export const dynamic = "force-dynamic";

import { getSettings } from "@/lib/services/SettingsService";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/lib/db/models/Category";
import { Product } from "@/lib/db/models/Product";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import BranchSection from "@/components/BranchSection";
import RestaurantGrid from "@/components/RestaurantGrid";
import ReviewSection from "@/components/ReviewSection";
import Footer from "@/components/Footer";

/**
 * Homepage — Server Component.
 * Fetches settings + content from DB and passes as props to client components.
 * Zero hardcoded content.
 */
export default async function Home() {
  let settings = null;
  let categories: any[] = [];
  let featuredProducts: any[] = [];
  let branches: any[] = [];

  try {
    await connectDB();
    const [settingsData, categoriesData, featuredProductsData, branchesData] = await Promise.all([
      getSettings(),
      Category.find({ isActive: true }).sort({ order: 1 }).lean(),
      Product.find({ isAvailable: true })
        .limit(8)
        .populate("categoryId", "name")
        .lean(),
      import("@/lib/db/models/Branch").then(m => m.Branch.find({ isActive: true }).lean()),
    ]);

    settings = settingsData;
    // Fix: Convert MongoDB objects (like ObjectId) to plain JSON before passing to Client Components
    categories = JSON.parse(JSON.stringify(categoriesData));
    featuredProducts = JSON.parse(JSON.stringify(featuredProductsData));
    branches = JSON.parse(JSON.stringify(branchesData));
  } catch (err) {
    console.error("Homepage data fetch failed:", err);
  }

  const hp = settings?.homepage;
  const hs = (settings as any)?.hero;
  const ll = (settings as any)?.legalLinks;

  const heroStats = hs ? [
    { value: hs.stat1Value || "4.9★", label: hs.stat1Label || "Rating" },
    { value: hs.stat2Value || "50K+", label: hs.stat2Label || "Orders Served" },
    { value: hs.stat3Value || "10+",  label: hs.stat3Label || "Years" },
  ] : undefined;

  const heroTrendingTags: string[] | undefined =
    Array.isArray(hs?.trendingTags) && hs.trendingTags.length > 0
      ? hs.trendingTags
      : undefined;

  return (
    <main className="min-h-screen">
      <Navbar
        siteName={settings?.siteName || "Halal Pizza Fun"}
        logoUrl={settings?.logoUrl || undefined}
        mobileLogoUrl={settings?.mobileLogoUrl || undefined}
        darkModeLogoUrl={settings?.darkModeLogoUrl || undefined}
      />
      <Hero
        title={hp?.heroTitle}
        subtitle={hp?.heroSubtitle}
        backgroundUrl={hp?.heroBackgroundUrl}
        stats={heroStats}
        trendingTags={heroTrendingTags}
      />
      {hp?.showFeaturedCategories !== false && (
        <CategorySection categories={categories} />
      )}
      <BranchSection branches={branches} />
      {hp?.showRestaurantGrid !== false && (
        <RestaurantGrid products={featuredProducts} />
      )}
      <ReviewSection />
      <Footer
        siteName={settings?.siteName}
        contactEmail={settings?.contactEmail}
        contactPhone={settings?.contactPhone}
        contactHours={(settings as any)?.contactHours}
        socialLinks={settings?.socialLinks}
        footerLogoUrl={settings?.footerLogoUrl}
        privacyPolicyUrl={ll?.privacyPolicyUrl}
        termsOfServiceUrl={ll?.termsOfServiceUrl}
        cookiePolicyUrl={ll?.cookiePolicyUrl}
      />
    </main>
  );
}
