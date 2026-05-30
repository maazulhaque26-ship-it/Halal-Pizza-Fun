import type { MetadataRoute } from "next";

/**
 * Dynamic sitemap for Halal Pizza Fun (pizzafun.co.in).
 *
 * ── Priority guidelines ──────────────────────────────────────────────────
 * 1.0 — Homepage
 * 0.9 — Core conversion pages (Menu, Offers)
 * 0.8 — Local SEO landing pages (high commercial intent)
 * 0.7 — Brand / supporting pages (Branches, About)
 * 0.5 — Trust / utility pages
 * 0.3 — Low-discovery pages
 *
 * Customer-facing pages only. Admin, branch, auth, checkout routes are
 * intentionally excluded — they are disallowed in robots.txt too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base         = process.env.NEXT_PUBLIC_APP_URL || "https://pizzafun.co.in";
  const lastModified = new Date();

  type SitemapEntry = {
    path:            string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority:        number;
  };

  const routes: SitemapEntry[] = [
    // ── Homepage ─────────────────────────────────────────────────────────
    { path: "/",              changeFrequency: "daily",   priority: 1.0 },

    // ── Core conversion ───────────────────────────────────────────────────
    { path: "/menu",          changeFrequency: "daily",   priority: 0.9 },
    { path: "/offers",        changeFrequency: "weekly",  priority: 0.9 },

    // ── Local SEO landing pages (HIGH PRIORITY) ───────────────────────────
    // These target high-intent local searches and should be crawled frequently.
    { path: "/pizza-near-shaheen-bagh",  changeFrequency: "weekly",  priority: 0.8 },
    { path: "/pizza-near-zakir-nagar",   changeFrequency: "weekly",  priority: 0.8 },
    { path: "/pizza-near-tikona-park",   changeFrequency: "weekly",  priority: 0.8 },

    // ── Brand & supporting ────────────────────────────────────────────────
    { path: "/branches",      changeFrequency: "weekly",  priority: 0.7 },
    { path: "/about-us",      changeFrequency: "monthly", priority: 0.6 },
    { path: "/franchise",     changeFrequency: "monthly", priority: 0.6 },
    { path: "/gallery",       changeFrequency: "monthly", priority: 0.5 },
    { path: "/reviews",       changeFrequency: "weekly",  priority: 0.5 },
    { path: "/contact",       changeFrequency: "monthly", priority: 0.5 },
    { path: "/delivery",      changeFrequency: "monthly", priority: 0.5 },

    // ── Utility ───────────────────────────────────────────────────────────
    { path: "/track-order",   changeFrequency: "yearly",  priority: 0.3 },
  ];

  return routes.map((r) => ({
    url:             `${base}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority:        r.priority,
  }));
}