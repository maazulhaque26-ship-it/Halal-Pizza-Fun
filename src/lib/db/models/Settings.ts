import mongoose, { Schema, Document } from "mongoose";

/**
 * Settings collection — exactly ONE document exists in this collection.
 * The Super Admin controls all dynamic UI/UX configuration from here.
 * No UI text, colors, or branding should ever be hardcoded in components.
 */
export interface ISettings extends Document {
  // === Branding ===
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoUrl: string;       // Cloudinary URL when uploaded via admin
  mobileLogoUrl: string;
  faviconUrl: string;    // Cloudinary URL when uploaded via admin
  darkModeLogoUrl: string;
  footerLogoUrl: string;

  // === Theme ===
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };

  // === SEO ===
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    seoShareImage: string;
    googleAnalyticsId: string;
  };

  // === Contact ===
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  contactHours: string;
  address: string;

  // === Social Links ===
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };

  // === Delivery Config (overrides code defaults) ===
  delivery: {
    baseDeliveryFee: number;
    pricePerKm: number;
    taxPercentage: number;
    maxDeliveryRadiusKm: number;
    freeDeliveryAbove: number;
  };

  // === Homepage Banners ===
  banners: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaLabel: string;
    ctaLink: string;
    isActive: boolean;
    order: number;
  }[];

  // === Homepage Sections ===
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroBackgroundUrl: string;
    showBanners: boolean;
    showFeaturedCategories: boolean;
    showRestaurantGrid: boolean;
    showAppSection: boolean;
    showTestimonials: boolean;
  };

  // === Maintenance ===
  maintenanceMode: boolean;

  // === Payment Config ===
  payment: {
    codEnabled: boolean;
  };
  aboutPage: {
    heroTitle: string;
    heroSubtitle: string;
    videoUrl: string;
    videoTitle: string;
    videoSubtitle: string;
    visionTitle: string;
    visionDesc1: string;
    visionDesc2: string;
    missionTitle: string;
    missionDesc: string;
    value1Title: string;
    value1Desc: string;
    value2Title: string;
    value2Desc: string;
    value3Title: string;
    value3Desc: string;
    // Founder section
    founderName: string;
    founderTitle: string;
    founderStory: string;
    founderImageUrl: string;
    // Gallery
    galleryImages: string[];
    // Mission Stats
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    // Dynamic tags & Milestones
    heroTag: string;
    founderTag: string;
    founderStat1Value: string;
    founderStat1Label: string;
    founderStat2Value: string;
    founderStat2Label: string;
    founderStat3Value: string;
    founderStat3Label: string;
    visionTag: string;
    valuesTag: string;
    valuesSubtitle: string;
  };
  franchisePage: {
    // Hero
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
    heroDesc: string;
    heroCta1: string;
    heroCta2: string;
    heroCta3: string;
    // Why Choose Us
    whyTitle: string;
    why1Title: string; why1Desc: string;
    why2Title: string; why2Desc: string;
    why3Title: string; why3Desc: string;
    why4Title: string; why4Desc: string;
    why5Title: string; why5Desc: string;
    why6Title: string; why6Desc: string;
    // Opportunity
    oppTitle: string;
    oppDesc: string;
    // Market Growth
    mktTitle: string;
    mkt1Value: string; mkt1Label: string;
    mkt2Value: string; mkt2Label: string;
    mkt3Value: string; mkt3Label: string;
    // USP
    uspTitle: string;
    usp1Title: string; usp1Desc: string;
    usp2Title: string; usp2Desc: string;
    usp3Title: string; usp3Desc: string;
    // Investment
    invTitle: string;
    invFeeLabel: string; invFeeValue: string;
    invStartupLabel: string; invStartupValue: string;
    invRoyaltyLabel: string; invRoyaltyValue: string;
    invMktFeeLabel: string; invMktFeeValue: string;
    invNote: string;
    // Training
    trainingTitle: string;
    training1: string;
    training2: string;
    training3: string;
    trainingDesc: string;
    // Testimonials
    testi1: string;
    testi2: string;
    testi3: string;
    // Growth Timeline
    growthTitle: string;
    growthDesc: string;
    // Branches
    branchesTitle: string;
    branch1: string; branch2: string; branch3: string;
    // CTA
    ctaTitle: string;
    ctaDesc: string;
    ctaBtn1: string; ctaBtn2: string;
    ctaPhone: string; ctaEmail: string; ctaWebsite: string;
  };
  offersPage: {
    heroTitle: string;
    heroSubtitle: string;
    deliveryBannerTitle: string;
    deliveryBannerDesc: string;
  };
  galleryPage: {
    images: string[];
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  reviewsPage: {
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  contactPage: {
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
    formIntroTitle: string;
    formIntroDesc: string;
  };
  hero: {
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    trendingTags: string[];
  };
  legalLinks: {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    cookiePolicyUrl: string;
  };
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: "HPF" },
    siteTagline: { type: String, default: "Taste the Difference" },
    siteDescription: { type: String, default: "Premium Multi-Branch Food Delivery Platform" },
    logoUrl: { type: String, default: "" },
    mobileLogoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    darkModeLogoUrl: { type: String, default: "" },
    footerLogoUrl: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#7c3aed" },
      secondaryColor: { type: String, default: "#f59e0b" },
      accentColor: { type: String, default: "#10b981" },
    },

    seo: {
      metaTitle: { type: String, default: "HPF | Premium Food Delivery" },
      metaDescription: { type: String, default: "Discover the best flavors around you." },
      ogImage: { type: String, default: "" },
      seoShareImage: { type: String, default: "" },
      googleAnalyticsId: { type: String, default: "" },
    },

    contactEmail: { type: String, default: "hello@hpf.com" },
    contactPhone: { type: String, default: "+91 8800155198" },
    contactWebsite: { type: String, default: "" },
    contactHours: { type: String, default: "Mon – Sun: 10:00 AM – 11:00 PM" },
    address: { type: String, default: "" },

    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },

    delivery: {
      baseDeliveryFee: { type: Number, default: 9 },
      pricePerKm: { type: Number, default: 3 },
      taxPercentage: { type: Number, default: 8.5 },
      maxDeliveryRadiusKm: { type: Number, default: 20 },
      freeDeliveryAbove: { type: Number, default: 500 },
    },

    banners: [
      {
        title: String,
        subtitle: String,
        imageUrl: String,
        ctaLabel: String,
        ctaLink: String,
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],

    homepage: {
      heroTitle: { type: String, default: "Discover the best flavors around you" },
      heroSubtitle: { type: String, default: "Explore top-rated restaurants, cafes, and bars in your city" },
      heroBackgroundUrl: { type: String, default: "" },
      showBanners: { type: Boolean, default: true },
      showFeaturedCategories: { type: Boolean, default: true },
      showRestaurantGrid: { type: Boolean, default: true },
      showAppSection: { type: Boolean, default: true },
      showTestimonials: { type: Boolean, default: false },
    },

    payment: {
      codEnabled: { type: Boolean, default: true },
    },

    aboutPage: {
      heroTitle: { type: String, default: "Redefining Premium Gastronomy at Home" },
      heroSubtitle: { type: String, default: "Founded with a passion for exceptional culinary experiences, HPF redefines premium food delivery." },
      videoUrl: { type: String, default: "" },
      videoTitle: { type: String, default: "Experience Premium Dining" },
      videoSubtitle: { type: String, default: "Watch how we craft every dish with passion and precision" },
      visionTitle: { type: String, default: "Elevating Every Meal" },
      visionDesc1: { type: String, default: "Our vision is to break the barrier between high-end restaurant dining and the comfort of your home." },
      visionDesc2: { type: String, default: "By combining state-of-the-art kitchen facilities with custom-engineered thermal delivery suites, we preserve the exact temperature and texture." },
      missionTitle: { type: String, default: "Our Core Mission" },
      missionDesc: { type: String, default: "To create a seamless, end-to-end premium dining standard that satisfies culinary enthusiasts through rigorous ingredient sourcing, master craftsmanship, and white-glove delivery precision." },
      value1Title: { type: String, default: "Uncompromised Quality" },
      value1Desc: { type: String, default: "We source the finest ingredients globally and locally, partner with certified vendors, and follow rigorous operating procedures." },
      value2Title: { type: String, default: "Route Optimization" },
      value2Desc: { type: String, default: "Every branch operates within custom-tailored hyperlocal zones, using real-time dispatch systems to ensure your order takes the absolute shortest path." },
      value3Title: { type: String, default: "Premium Experience" },
      value3Desc: { type: String, default: "Our packaging is an experience itself—environmentally responsible, structurally sound, and beautifully presented." },
      // Founder section
      founderName: { type: String, default: "Chef Harpreet Sidhu" },
      founderTitle: { type: String, default: "Founder & Executive Chef" },
      founderStory: { type: String, default: "Born from a lifelong obsession with culinary perfection, HPF was founded in 2019 with a single kitchen and an audacious dream — to make five-star dining accessible from the comfort of home. Harpreet spent two decades mastering classical and contemporary cuisine across Europe and Southeast Asia before returning home with a vision: that premium food delivery was not a contradiction, but an art form waiting to be perfected. Today, HPF operates across 15+ branches, each upholding the same uncompromising standards that started in that original kitchen." },
      founderImageUrl: { type: String, default: "" },
      // Gallery
      galleryImages: { type: [String], default: [] },
      // Mission Stats
      stat1Value: { type: String, default: "100%" },
      stat1Label: { type: String, default: "Gourmet" },
      stat2Value: { type: String, default: "20 min" },
      stat2Label: { type: String, default: "Avg Delivery" },
      stat3Value: { type: String, default: "15+" },
      stat3Label: { type: String, default: "Branches" },
      // Dynamic tags & Milestones
      heroTag: { type: String, default: "OUR STORY & VISION" },
      founderTag: { type: String, default: "MEET THE FOUNDER" },
      founderStat1Value: { type: String, default: "2019" },
      founderStat1Label: { type: String, default: "Founded" },
      founderStat2Value: { type: String, default: "15+" },
      founderStat2Label: { type: String, default: "Branches" },
      founderStat3Value: { type: String, default: "20yr" },
      founderStat3Label: { type: String, default: "Experience" },
      visionTag: { type: String, default: "THE VISION" },
      valuesTag: { type: String, default: "OUR VALUES" },
      valuesSubtitle: { type: String, default: "The Standards We Live By" },
    },

    franchisePage: {
      // Hero
      heroTag:      { type: String, default: "FRANCHISE OPPORTUNITY" },
      heroTitle:    { type: String, default: "Grow With Halal Pizza Fun" },
      heroSubtitle: { type: String, default: "Join one of India's fastest-growing halal food brands and build a successful franchise business with trusted support and proven systems." },
      heroDesc:     { type: String, default: "Since 2012, Halal Pizza Fun has delivered premium halal pizzas, burgers, wings, pasta, wraps, and more across multiple branches with thousands of satisfied customers." },
      heroCta1:     { type: String, default: "Apply for Franchise" },
      heroCta2:     { type: String, default: "Download Brochure" },
      heroCta3:     { type: String, default: "Contact Us" },
      // Why Choose Us
      whyTitle:     { type: String, default: "Why Partner With Halal Pizza Fun?" },
      why1Title: { type: String, default: "Trusted Brand" },        why1Desc: { type: String, default: "A decade of excellence in the halal food industry with a loyal customer base." },
      why2Title: { type: String, default: "Proven Business Model" }, why2Desc: { type: String, default: "Well-established operational systems designed for franchise success." },
      why3Title: { type: String, default: "Marketing Support" },    why3Desc: { type: String, default: "Complete branding, promotions, and advertising assistance." },
      why4Title: { type: String, default: "Training Assistance" },  why4Desc: { type: String, default: "Professional training programs for owners and staff." },
      why5Title: { type: String, default: "Innovative Menu" },      why5Desc: { type: String, default: "Pizza, Wings, Burgers, Pasta, Chizza, Garlic Bread, Mocktails, and more." },
      why6Title: { type: String, default: "100% Halal Certified" }, why6Desc: { type: String, default: "Strict halal compliance and premium ingredient sourcing." },
      // Opportunity
      oppTitle: { type: String, default: "Your Slice of the Future" },
      oppDesc:  { type: String, default: "Halal Pizza Fun offers a profitable franchise opportunity in the rapidly growing halal food market. Build a successful food business backed by a trusted and expanding brand." },
      // Market Growth
      mktTitle:  { type: String, default: "A Growing Market Opportunity" },
      mkt1Value: { type: String, default: "$2.71T" },    mkt1Label: { type: String, default: "Global Halal Market" },
      mkt2Value: { type: String, default: "3.45M+" },   mkt2Label: { type: String, default: "Muslim Population Growth" },
      mkt3Value: { type: String, default: "15+" },       mkt3Label: { type: String, default: "Active Branches" },
      // USP
      uspTitle:  { type: String, default: "What Makes Us Different?" },
      usp1Title: { type: String, default: "100% Halal" },         usp1Desc: { type: String, default: "Strict halal standards ensuring trust and authenticity." },
      usp2Title: { type: String, default: "Family-Friendly" },    usp2Desc: { type: String, default: "Comfortable atmosphere with welcoming dining experience." },
      usp3Title: { type: String, default: "Innovative Menu" },    usp3Desc: { type: String, default: "Fusion flavors and modern fast-food variety customers love." },
      // Investment
      invTitle:         { type: String, default: "Franchise Investment" },
      invFeeLabel:      { type: String, default: "Franchise Fee" },    invFeeValue:      { type: String, default: "₹5,00,000" },
      invStartupLabel:  { type: String, default: "Startup Cost" },     invStartupValue:  { type: String, default: "₹30–35 Lakhs" },
      invRoyaltyLabel:  { type: String, default: "Royalty Fee" },      invRoyaltyValue:  { type: String, default: "5% of Gross Sales" },
      invMktFeeLabel:   { type: String, default: "Marketing Fee" },    invMktFeeValue:   { type: String, default: "2% of Gross Sales" },
      invNote:          { type: String, default: "Get complete assistance with setup, operations, and financing guidance." },
      // Training & Support
      trainingTitle: { type: String, default: "Complete Training & Support" },
      training1:     { type: String, default: "2-Week Intensive Training" },
      training2:     { type: String, default: "On-Site Launch Support" },
      training3:     { type: String, default: "Ongoing Operational Assistance" },
      trainingDesc:  { type: String, default: "We provide complete operational guidance, staff training, manuals, and continuous franchise support." },
      // Testimonials
      testi1: { type: String, default: "Halal Pizza Fun provided me with all the tools and support I needed to succeed." },
      testi2: { type: String, default: "The brand's commitment to halal standards and community engagement has been a game-changer." },
      testi3: { type: String, default: "I'm proud to be part of a family-friendly halal food brand." },
      // Growth Timeline
      growthTitle: { type: String, default: "Our Journey & Growth" },
      growthDesc:  { type: String, default: "Starting from a single outlet in 2012, Halal Pizza Fun has rapidly expanded into multiple cities through quality service, innovation, and customer trust." },
      // Branches
      branchesTitle: { type: String, default: "Our Presence" },
      branch1: { type: String, default: "Delhi – 15 Branches" },
      branch2: { type: String, default: "Rajasthan – Kota" },
      branch3: { type: String, default: "Uttar Pradesh – 7 Branches" },
      // CTA
      ctaTitle:   { type: String, default: "Take the Next Step" },
      ctaDesc:    { type: String, default: "Ready to build your future with Halal Pizza Fun? Apply today and become part of a rapidly growing halal food franchise family." },
      ctaBtn1:    { type: String, default: "Apply Now" },
      ctaBtn2:    { type: String, default: "Contact Franchise Team" },
      ctaPhone:   { type: String, default: "+91 8800155198" },
      ctaEmail:   { type: String, default: "pizzafunindia@gmail.com" },
      ctaWebsite: { type: String, default: "halalpizzafun.com" },
    },

    offersPage: {
      heroTitle: { type: String, default: "Exclusive Gourmet Offers" },
      heroSubtitle: { type: String, default: "Discover curated promotions, luxury discounts, and premium coupon codes handcrafted to elevate your culinary journey." },
      deliveryBannerTitle: { type: String, default: "Complimentary Premium Delivery" },
      deliveryBannerDesc: { type: String, default: "We reward fine culinary taste. When your cart value exceeds ₹500 (after coupon discount), our premium temperature-controlled delivery is automatically applied completely free of charge." }
    },

    galleryPage: {
      images: { type: [String], default: [] },
      heroTag: { type: String, default: "CULINARY GALLERY" },
      heroTitle: { type: String, default: "Behind the Craft" },
      heroSubtitle: { type: String, default: "A glimpse into our kitchens, our food, and the passion that drives every plate we deliver." },
    },

    reviewsPage: {
      heroTag: { type: String, default: "CUSTOMER REVIEWS" },
      heroTitle: { type: String, default: "What Our Customers Say" },
      heroSubtitle: { type: String, default: "Real reviews from real customers — unfiltered, unedited, and straight from the heart." },
    },

    contactPage: {
      heroTag: { type: String, default: "GET IN TOUCH" },
      heroTitle: { type: String, default: "Contact Us" },
      heroSubtitle: { type: String, default: "Have a question, suggestion, or want to partner with us? We're just a message away." },
      formIntroTitle: { type: String, default: "We'd love to hear from you" },
      formIntroDesc: { type: String, default: "Whether you have a question about our menu, delivery, franchise opportunities, or anything else — our team is ready to help." },
    },

    hero: {
      stat1Value: { type: String, default: "4.9★" },
      stat1Label: { type: String, default: "Rating" },
      stat2Value: { type: String, default: "50K+" },
      stat2Label: { type: String, default: "Orders Served" },
      stat3Value: { type: String, default: "10+" },
      stat3Label: { type: String, default: "Years" },
      trendingTags: { type: [String], default: ["Pizza", "Cheeza", "Burgers", "Wings", "Sides"] },
    },

    legalLinks: {
      privacyPolicyUrl: { type: String, default: "" },
      termsOfServiceUrl: { type: String, default: "" },
      cookiePolicyUrl: { type: String, default: "" },
    },

    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
