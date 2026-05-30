import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLD";
import { localPageSchemas } from "@/lib/seo/schema";
import { SEO_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Pizza Near Zakir Nagar | Halal Pizza Delivery | Halal Pizza Fun",
  description:
    "Looking for pizza near Zakir Nagar, Delhi? Halal Pizza Fun delivers hot, fresh halal pizza in 30 minutes. Order online now — cheese burst, chicken tikka & more!",
  keywords: [
    "pizza near zakir nagar",
    "pizza delivery zakir nagar",
    "halal pizza zakir nagar",
    "best pizza zakir nagar",
    "pizza home delivery zakir nagar",
    "online pizza order zakir nagar",
    "fast food near zakir nagar",
    "halal food delivery zakir nagar",
    "pizza near shaheen bagh zakir nagar",
    "pizza south east delhi",
  ],
  alternates: {
    canonical: `${SEO_CONFIG.siteUrl}/pizza-near-zakir-nagar`,
  },
  openGraph: {
    title:       "Pizza Near Zakir Nagar | Halal Pizza Fun Delhi",
    description: "Order fresh halal pizza near Zakir Nagar. Delivered hot in 30 minutes. 100% halal certified.",
    url:         `${SEO_CONFIG.siteUrl}/pizza-near-zakir-nagar`,
    type:        "website",
    images: [{ url: SEO_CONFIG.defaults.ogImage, width: 1200, height: 630, alt: "Halal Pizza Near Zakir Nagar" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Pizza Near Zakir Nagar | Halal Pizza Fun",
    description: "Fresh halal pizza delivered fast to Zakir Nagar, Delhi.",
    images:      [SEO_CONFIG.defaults.ogImage],
  },
};

const faqs = [
  {
    question: "Does Halal Pizza Fun deliver to Zakir Nagar?",
    answer:
      "Yes! Zakir Nagar is within our primary delivery zone. We deliver to all parts of Zakir Nagar including the main market area, residential streets, and nearby sectors. Simply place your order at pizzafun.co.in and we will have it at your door.",
  },
  {
    question: "What is the delivery time for pizza to Zakir Nagar?",
    answer:
      "Our standard delivery time to Zakir Nagar is 25–35 minutes from the time of order confirmation. We work hard to ensure every pizza arrives hot and fresh at your doorstep.",
  },
  {
    question: "Is there a delivery charge for Zakir Nagar orders?",
    answer:
      "Delivery charges depend on your exact location and order value. Visit pizzafun.co.in to see the current delivery fee for your address in Zakir Nagar. We also run free delivery offers regularly — check our Offers page.",
  },
  {
    question: "What are the best-selling pizzas near Zakir Nagar?",
    answer:
      "The most popular choices among Zakir Nagar customers include our Chicken Tikka Pizza, BBQ Chicken Cheese Burst, Spicy Loaded Chicken, and Classic Margherita. All available on our menu at pizzafun.co.in/menu.",
  },
  {
    question: "Can I order pizza late at night in Zakir Nagar?",
    answer:
      "We are open for delivery until 11:30 PM every day. So yes, whether it is a late dinner or a midnight craving, Halal Pizza Fun is available to satisfy your hunger in Zakir Nagar.",
  },
  {
    question: "Do you offer family combo deals for Zakir Nagar delivery?",
    answer:
      "Absolutely. We have several family combo meals that include multiple pizzas, sides, and beverages at a bundled discount. These are perfect for families and group orders. Visit our Offers page for current combos.",
  },
  {
    question: "Is your pizza halal certified for Zakir Nagar customers?",
    answer:
      "Yes, every single item on our menu is prepared under strict halal guidelines. We source our meat from verified halal-certified suppliers, and our kitchen maintains full halal integrity in all its processes.",
  },
  {
    question: "How do I place an order for Zakir Nagar delivery?",
    answer:
      "Visit pizzafun.co.in, browse our menu, add items to your cart, and enter your Zakir Nagar address at checkout. You can pay via UPI, card, or cash on delivery. You will receive an order confirmation and real-time tracking link instantly.",
  },
  {
    question: "Do you deliver to areas adjacent to Zakir Nagar?",
    answer:
      "Yes. Our delivery zone covers Zakir Nagar and neighbouring areas including Shaheen Bagh, Batla House, Okhla, Ghaffar Manzil, Abul Fazal Enclave, and Jamia Nagar. Check the delivery map on our website for full coverage.",
  },
  {
    question: "What payment methods are accepted for Zakir Nagar delivery?",
    answer:
      "We accept UPI (Google Pay, PhonePe, Paytm), credit and debit cards, net banking, and cash on delivery. All digital payments are fully secure.",
  },
];

const schemas = localPageSchemas({
  areaName:    "Zakir Nagar",
  pageUrl:     `${SEO_CONFIG.siteUrl}/pizza-near-zakir-nagar`,
  description: "Halal Pizza Fun delivers fresh halal pizzas to Zakir Nagar, Shaheen Bagh, Batla House, Okhla and surrounding South-East Delhi areas.",
  faqs,
  breadcrumbs: [
    { name: "Home",           url: SEO_CONFIG.siteUrl },
    { name: "Pizza Delivery", url: `${SEO_CONFIG.siteUrl}/delivery` },
    { name: "Zakir Nagar",    url: `${SEO_CONFIG.siteUrl}/pizza-near-zakir-nagar` },
  ],
});

export default function PizzaNearZakirNagarPage() {
  return (
    <>
      <JsonLd data={schemas.localBusiness} />
      <JsonLd data={schemas.breadcrumb} />
      <JsonLd data={schemas.faq} />

      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Halal Pizza Fun"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="text-white font-semibold hidden sm:block">Halal Pizza Fun</span>
        </Link>
        <Link
          href="/menu"
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-sm px-4 py-2 rounded-full transition-colors"
        >
          Order Now
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-yellow-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/delivery" className="hover:text-yellow-400 transition-colors">Pizza Delivery</Link>
            <span>/</span>
            <span className="text-yellow-400">Zakir Nagar</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
            Fresh Halal Pizza Near{" "}
            <span className="text-yellow-400">Zakir Nagar</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Delhi&apos;s best halal pizza, delivered hot to your door in 30 minutes. Zakir Nagar&apos;s trusted pizza destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/menu"   className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-base px-8 py-3 rounded-full transition-colors inline-block">View Full Menu</Link>
            <Link href="/offers" className="border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 font-semibold text-base px-8 py-3 rounded-full transition-colors inline-block">Today&apos;s Offers</Link>
          </div>
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">

          <section className="mb-12">
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              Zakir Nagar is one of South-East Delhi&apos;s most beloved residential and commercial hubs, known for its energetic markets, warm community, and a deep appreciation for good food. Located right next to Shaheen Bagh, it shares the same rich food culture — and now, the same incredible pizza experience from <strong>Halal Pizza Fun</strong>.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              We have built our reputation in Zakir Nagar on three things: quality, speed, and trust. Every pizza we deliver is made fresh from scratch, using only halal-certified ingredients, and dispatched within minutes of your order being confirmed. No reheated, pre-made, or stored pizzas — ever.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              From a quick solo meal to a family feast, Halal Pizza Fun has the right pizza for every occasion in Zakir Nagar. Order online in seconds and track your delivery in real time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              What Makes Us the Best Pizza Near Zakir Nagar
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: "🏅", title: "Trusted by Thousands",  desc: "Hundreds of satisfied customers in Zakir Nagar order from us regularly. Read their reviews on our website." },
                { icon: "🍗", title: "Premium Halal Chicken",  desc: "We only use fresh, tender halal chicken cuts sourced from certified suppliers. No frozen, no compromises." },
                { icon: "📱", title: "Order in 60 Seconds",    desc: "Our mobile-friendly website makes ordering effortless. Browse, choose, pay — done in under a minute." },
                { icon: "🎁", title: "Regular Deals & Combos", desc: "From weekday discounts to family combos, we keep your pizza affordable. Check our Offers page for today's deals." },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Top Pizzas We Deliver to Zakir Nagar
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Our menu features classic favourites and signature specialities, all prepared halal and delivered fresh. Here is what Zakir Nagar customers love most:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                { name: "Chicken Tikka Pizza",       desc: "Our Zakir Nagar signature — tender tikka chicken with a smoky masala base and generous mozzarella." },
                { name: "BBQ Chicken Cheese Burst",  desc: "A Zakir Nagar fan favourite. Smoky pulled chicken, caramelised onions, with cheese oozing from every edge." },
                { name: "Paneer & Chicken Special",  desc: "The best of both worlds — tender halal chicken with fresh paneer cubes on a tangy tomato base." },
                { name: "Hot & Spicy Chicken",       desc: "For Zakir Nagar spice lovers. Loaded with crispy chicken, fresh chillies, and our signature hot sauce." },
                { name: "Classic Margherita",        desc: "Sometimes simple is best. Tomato sauce, buffalo mozzarella, fresh basil — timeless and delicious." },
                { name: "Garlic Butter Chicken",     desc: "Garlic-infused butter base with juicy chicken chunks, perfect for those who love bold, rich flavours." },
              ].map((pizza) => (
                <li key={pizza.name} className="flex gap-3 items-start">
                  <span className="text-yellow-500 font-bold mt-1">●</span>
                  <span className="text-slate-700">
                    <strong className="text-slate-900">{pizza.name}</strong> — {pizza.desc}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/menu" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-6 py-3 rounded-full transition-colors">
              Explore Full Menu →
            </Link>
          </section>

          <section className="mb-12 bg-slate-900 text-white rounded-3xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Delivery Coverage — Zakir Nagar &amp; Nearby Areas</h2>
            <p className="text-slate-300 mb-4 leading-relaxed">
              We cover all of Zakir Nagar and its neighbouring localities. From the main market to the quietest residential lanes — we deliver everywhere.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
              {[
                "Zakir Nagar Main Market", "Zakir Nagar Residential", "Shaheen Bagh",
                "Batla House", "Okhla Phase 1", "Okhla Phase 2",
                "Ghaffar Manzil", "Abul Fazal Enclave", "Jamia Nagar",
                "Noor Nagar", "Haji Colony", "Jasola",
              ].map((area) => (
                <div key={area} className="flex items-center gap-2">
                  <span className="text-yellow-400">✓</span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 border-l-4 border-yellow-400 pl-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Halal Pizza Built for the Zakir Nagar Community
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              The Zakir Nagar community deserves food that matches its values. That is why Halal Pizza Fun was built from the ground up as a halal-first restaurant. We do not offer halal as an option — it is the only way we cook.
            </p>
            <p className="text-slate-700 leading-relaxed mb-3">
              Our halal chicken is sourced fresh daily from certified vendors. Our kitchen maintains strict halal protocol at every stage — from storage to preparation to packaging. Our delivery bags are clean, sealed, and tamper-evident so your order arrives exactly as it left our kitchen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Order today and experience why Halal Pizza Fun has become Zakir Nagar&apos;s most loved pizza brand.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
              Frequently Asked Questions — Pizza Delivery in Zakir Nagar
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="group border border-slate-200 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-900 list-none">
                    {faq.question}
                    <span className="text-yellow-500 font-black text-xl ml-4">+</span>
                  </summary>
                  <div className="p-5 text-slate-700 leading-relaxed bg-white">{faq.answer}</div>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Explore Other Areas We Serve</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/pizza-near-shaheen-bagh", label: "Pizza Near Shaheen Bagh", desc: "Halal pizza delivered fast to Shaheen Bagh." },
                { href: "/pizza-near-tikona-park",  label: "Pizza Near Tikona Park",  desc: "Fresh pizza to Tikona Park & nearby areas." },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 transition-colors group">
                  <div className="font-bold text-yellow-400 group-hover:text-yellow-300 mb-1">{link.label} →</div>
                  <div className="text-slate-400 text-sm">{link.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-yellow-400 rounded-3xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">Order Pizza in Zakir Nagar Now</h2>
            <p className="text-slate-800 mb-6">Fresh. Halal. Delivered in 30 minutes. No excuses.</p>
            <Link href="/menu" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg px-10 py-4 rounded-full transition-colors inline-block">
              Order Now — It&apos;s Fast &amp; Easy
            </Link>
          </section>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 text-sm py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Halal Pizza Fun. All rights reserved.</p>
          <nav className="flex gap-4 flex-wrap justify-center">
            <Link href="/"                          className="hover:text-white transition-colors">Home</Link>
            <Link href="/menu"                      className="hover:text-white transition-colors">Menu</Link>
            <Link href="/offers"                    className="hover:text-white transition-colors">Offers</Link>
            <Link href="/about-us"                  className="hover:text-white transition-colors">About</Link>
            <Link href="/contact"                   className="hover:text-white transition-colors">Contact</Link>
            <Link href="/pizza-near-shaheen-bagh"   className="hover:text-white transition-colors">Shaheen Bagh</Link>
            <Link href="/pizza-near-tikona-park"    className="hover:text-white transition-colors">Tikona Park</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}