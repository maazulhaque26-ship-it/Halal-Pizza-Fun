import type { MetadataRoute } from "next";

/**
 * Static sitemap for SEO crawling. Add dynamic entries (e.g. /menu/[id]) here
 * as the menu evolves. Customer-facing pages only — admin/branch routes stay
 * out of the index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://pizzafun.co.in";
  const lastModified = new Date();

  const routes: Array<{
    path: string;
    changeFrequency:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "daily", priority: 1.0 },
    { path: "/menu", changeFrequency: "daily", priority: 0.9 },
    { path: "/offers", changeFrequency: "weekly", priority: 0.8 },
    { path: "/branches", changeFrequency: "weekly", priority: 0.7 },
    { path: "/about-us", changeFrequency: "monthly", priority: 0.6 },
    { path: "/franchise", changeFrequency: "monthly", priority: 0.6 },
    { path: "/gallery", changeFrequency: "monthly", priority: 0.5 },
    { path: "/reviews", changeFrequency: "weekly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/track-order", changeFrequency: "yearly", priority: 0.4 },
    { path: "/delivery", changeFrequency: "monthly", priority: 0.4 },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
