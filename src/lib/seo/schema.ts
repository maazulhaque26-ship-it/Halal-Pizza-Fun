/**
 * JSON-LD Schema generators for Halal Pizza Fun.
 * Each function returns a plain object — serialize with JSON.stringify when rendering.
 * Safe for server components. No runtime dependencies.
 */

import { SEO_CONFIG } from "./config";

const B = SEO_CONFIG.business;
const BASE = SEO_CONFIG.siteUrl;

// ─── Shared address block ────────────────────────────────────────────────────
const postalAddress = {
  "@type": "PostalAddress",
  streetAddress:   B.address.streetAddress,
  addressLocality: B.address.addressLocality,
  addressRegion:   B.address.addressRegion,
  postalCode:      B.address.postalCode,
  addressCountry:  B.address.addressCountry,
};

const geoCoordinates = {
  "@type":     "GeoCoordinates",
  latitude:    B.geo.latitude,
  longitude:   B.geo.longitude,
};

// ─── 1. Organization ─────────────────────────────────────────────────────────
export function organizationSchema() {
  return {
    "@context":  "https://schema.org",
    "@type":     "Organization",
    "@id":       `${BASE}/#organization`,
    name:        B.name,
    legalName:   B.legalName,
    url:         BASE,
    logo: {
      "@type":        "ImageObject",
      url:            B.logo,
      width:          "200",
      height:         "200",
    },
    image:       B.image,
    description: B.description,
    email:       B.email,
    telephone:   B.telephone,
    address:     postalAddress,
    sameAs:      B.sameAs,
    contactPoint: {
      "@type":            "ContactPoint",
      telephone:          B.telephone,
      contactType:        "customer service",
      availableLanguage:  ["English", "Hindi", "Urdu"],
    },
  };
}

// ─── 2. Website ──────────────────────────────────────────────────────────────
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type":    "WebSite",
    "@id":      `${BASE}/#website`,
    name:       B.name,
    url:        BASE,
    publisher: { "@id": `${BASE}/#organization` },
    potentialAction: {
      "@type":       "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE}/menu?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── 3. LocalBusiness / Restaurant ──────────────────────────────────────────
export function localBusinessSchema() {
  return {
    "@context":          "https://schema.org",
    "@type":             ["Restaurant", "FastFoodRestaurant", "FoodEstablishment"],
    "@id":               `${BASE}/#localbusiness`,
    name:                B.name,
    description:         B.description,
    url:                 BASE,
    telephone:           B.telephone,
    email:               B.email,
    priceRange:          B.priceRange,
    image:               B.image,
    logo:                B.logo,
    address:             postalAddress,
    geo:                 geoCoordinates,
    openingHours:        B.openingHours,
    servesCuisine:       B.servesCuisine,
    hasMenu:             B.hasMenu,
    acceptsReservations: B.acceptsReservations,
    currenciesAccepted:  "INR",
    paymentAccepted:     "Cash, Credit Card, Debit Card, UPI, Net Banking",
    sameAs:              B.sameAs,
    aggregateRating: {
      "@type":       "AggregateRating",
      ratingValue:   "4.7",
      bestRating:    "5",
      worstRating:   "1",
      ratingCount:   "320",   // update from actual reviews
    },
  };
}

// ─── 4. BreadcrumbList ───────────────────────────────────────────────────────
export interface BreadcrumbItem {
  name:     string;
  url:      string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context":   "https://schema.org",
    "@type":      "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type":    "ListItem",
      position:   index + 1,
      name:       item.name,
      item:       item.url,
    })),
  };
}

// ─── 5. FAQPage ──────────────────────────────────────────────────────────────
export interface FaqItem {
  question: string;
  answer:   string;
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context":   "https://schema.org",
    "@type":      "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type":          "Question",
      name:             faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:    faq.answer,
      },
    })),
  };
}

// ─── 6. Local SEO page — LocalBusiness with area override ───────────────────
export interface LocalPageSchemaOptions {
  areaName:    string;
  pageUrl:     string;
  description: string;
  faqs:        FaqItem[];
  breadcrumbs: BreadcrumbItem[];
}

export function localPageSchemas(opts: LocalPageSchemaOptions) {
  const localBusiness = {
    ...localBusinessSchema(),
    description: opts.description,
    url:         opts.pageUrl,
    areaServed: {
      "@type": "City",
      name:    "New Delhi",
    },
  };

  return {
    localBusiness,
    breadcrumb:  breadcrumbSchema(opts.breadcrumbs),
    faq:         faqSchema(opts.faqs),
    organization: organizationSchema(),
    website:      websiteSchema(),
  };
}