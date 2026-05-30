import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLD";
import { localPageSchemas } from "@/lib/seo/schema";
import { SEO_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Pizza Near Tikona Park | Fresh Halal Pizza Delivery | Halal Pizza Fun",
  description:
    "Order pizza near Tikona Park, Delhi. Halal Pizza Fun delivers hot, fresh halal pizza to Tikona Park in 30 minutes. 100% halal certified. Order online now!",
  keywords: [
    "pizza near tikona park",
    "pizza delivery tikona park",
    "halal pizza tikona park",
    "best pizza tikona park",
    "pizza home delivery tikona park",
    "online pizza order tikona park",
    "fast food near tikona park",
    "halal food delivery tikona park",
    "pizza south delhi tikona park",
    "pizza near okhla tikona park",
  ],
  alternates: {
    canonical: `${SEO_CONFIG.siteUrl}/pizza-near-tikona-park`,
  },
  openGraph: {
    title:       "Pizza Near Tikona Park | Halal Pizza Fun Delhi",
    description: "Fresh halal pizza delivered fast to Tikona Park. Order online, 30-minute delivery. 100% halal certified.",
    url:         `${SEO_CONFIG.siteUrl}/pizza-near-tikona-park`,
    type:        "website",
    images: [{ url: SEO_CONFIG.defaults.ogImage, width: 1200, height: 630, alt: "Halal Pizza Near Tikona Park" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Pizza Near Tikona Park | Halal Pizza Fun",
    description: "Fresh halal pizza delivered fast to Tikona Park, Delhi.",
    images:      [SEO_CONFIG.defaults.ogImage],
  },
};

const faqs = [
  {
    question: "Does Halal Pizza Fun deliver to Tikona Park?",
    answer:
      "Yes! Tikona Park is within our delivery zone. We deliver fresh halal pizzas directly to your door in Tikona Park and all adjacent areas. Simply visit pizzafun.co.in, place your order, and we will have it with you quickly.",
  },
  {
    question: "How fresh is the pizza delivered to Tikona Park?",
    answer:
      "Every pizza is made fresh when you order — we never pre-make or store cooked pizzas. Your dough is freshly rolled, topped, and baked only after your order is confirmed. It arrives at Tikona Park hot, crispy, and made moments ago.",
  },
  {
    question: "What is the estimated delivery time to Tikona Park?",
    answer:
      "Our average delivery time to Tikona Park is 25–40 minutes. Actual time may vary slightly depending on traffic and order volume, but we always aim to get your pizza to you as fast as possible without compromising quality.",
  },
  {
    question: "Are there any special offers for Tikona Park delivery?",
    answer:
      "Yes! We run regular offers including weekday discounts, family combo deals, and seasonal promotions. All offers apply to Tikona Park orders. Visit pizzafun.co.in/offers to see what is available today.",
  },
  {
    question: "What varieties of halal pizza are available near Tikona Park?",
    answer:
      "We have a wide menu featuring Chicken Tikka Pizza, BBQ Chicken Cheese Burst, Spicy Chicken Loaded, Classic Margherita, Garlic Chicken Paneer, Double Chicken Supreme, and many more. All items are 100% halal. View the full menu at pizzafun.co.in/menu.",
  },
  {
    question: "Can I order pizza for a large group from Tikona Park?",
    answer:
      "Absolutely. We cater to large group orders with our family combo meals and bulk ordering options. Whether it is a birthday party, office lunch, or family gathering in Tikona Park, we can handle it. Contact us for bulk order details.",
  },
  {
    question: "Is online payment available for Tikona Park orders?",
    answer:
      "Yes, all digital payment methods are available — UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, and net banking. We also accept cash on delivery. All online payments are fully secure.",
  },
  {
    question: "Do you deliver to nearby areas around Tikona Park?",
    answer:
      "Yes. Our delivery zone extends from Tikona Park to Shaheen Bagh, Zakir Nagar, Okhla, Batla House, Ghaffar Manzil, and all of South-East Delhi. Enter your exact address at checkout to confirm delivery availability.",
  },
  {
    question: "What makes Halal Pizza Fun the best pizza for Tikona Park customers?",
    answer:
      "Three things set us apart: freshness (every pizza is made to order), trust (100% halal certified with verified suppliers), and speed (30-minute delivery goal). These three pillars make us the preferred pizza brand for Tikona Park residents.",
  },
  {
    question: "How can I contact Halal Pizza Fun for a Tikona Park delivery question?",
    answer:
      "Visit pizzafun.co.in/contact for all our contact details including email and phone. Our support team is available during business hours to help with delivery queries, order modifications, or any feedback.",
  },
];

const schemas = localPageSchemas({
  areaName:    "Tikona Park",
  pageUrl:     `${SEO_CONFIG.siteUrl}/pizza-near-tikona-park`,
  description: "Halal Pizza Fun delivers fresh halal pizzas to Tikona Park, Shaheen Bagh, Zakir Nagar, Okhla and South-East Delhi.",
  faqs,
  breadcrumbs: [
    { name: "Home",           url: SEO_CONFIG.siteUrl },
    { name: "Pizza Delivery", url: `${SEO_CONFIG.siteUrl}/delivery` },
    { name: "Tikona Park",    url: `${SEO_CONFIG.siteUrl}/pizza-near-tikona-park` },
  ],
});

export default function PizzaNearTikonaParkPage() {
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
            <span className="text-yellow-400">Tikona Park</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
            Fresh Halal Pizza Near{" "}
            <span className="text-yellow-400">Tikona Park</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Hot, fresh, 100% halal pizza delivered to Tikona Park in just 30 minutes. Order online in seconds.
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
              Tikona Park is a peaceful and thriving residential neighbourhood in South Delhi, known for its tight-knit community and love of great food. And when it comes to pizza delivery in the area, one brand has consistently stood out for quality, speed, and trust — <strong>Halal Pizza Fun</strong>.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              We bring the authentic taste of fresh, oven-baked halal pizza directly to your home in Tikona Park. Whether you are planning a relaxed dinner for two, a birthday celebration for the family, or simply satisfying a sudden pizza craving, our team is ready to deliver the perfect pizza to your door.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              No frozen shortcuts. No reheated leftovers. Every pizza at Halal Pizza Fun is hand-crafted and freshly baked after you order. That commitment to freshness is why Tikona Park residents keep coming back to us again and again.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Why Tikona Park Chooses Halal Pizza Fun
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: "🔥", title: "Always Hot on Arrival",      desc: "Our insulated packaging and fast delivery process ensure your pizza arrives piping hot, every single time." },
                { icon: "🌿", title: "Fresh, Natural Ingredients",  desc: "We use real mozzarella, fresh vegetables, and hand-selected toppings — no artificial flavours, no preservatives." },
                { icon: "🛡️", title: "100% Halal Guarantee",       desc: "From raw ingredients to final packaging, every step follows strict halal certification standards." },
                { icon: "🎯", title: "Accurate, On-Time Delivery",  desc: "Our dedicated delivery team knows the Tikona Park area and ensures precise, timely deliveries every time." },
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
              Pizzas We Deliver Near Tikona Park
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Our menu has something for every taste — from fiery spice lovers to cheese enthusiasts to those who appreciate classic simplicity. Here is a look at our most popular options delivered near Tikona Park:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                { name: "Chicken Tikka Masala Pizza", desc: "Our signature — juicy tikka chicken on a rich masala base, topped with fresh mozzarella and coriander." },
                { name: "Four Cheese Delight",         desc: "A cheese lover's dream — mozzarella, cheddar, gouda, and cream cheese on a butter garlic base." },
                { name: "Crispy BBQ Chicken",          desc: "Tender chicken strips, caramelised onions, and smoky BBQ sauce on a hand-stretched golden crust." },
                { name: "Veggie Supreme",              desc: "Fresh bell peppers, mushrooms, black olives, and cherry tomatoes on a tangy tomato sauce base." },
                { name: "Peri Peri Chicken",           desc: "Crispy peri peri chicken chunks with sweet corn, jalapeños and our signature peri sauce. Addictive." },
                { name: "Classic Chicken & Mushroom",  desc: "Simple, hearty, and satisfying — a timeless combination loved by Tikona Park families." },
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
              See Full Menu →
            </Link>
          </section>

          <section className="mb-12 bg-slate-900 text-white rounded-3xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Delivery Coverage — Tikona Park &amp; Surroundings</h2>
            <p className="text-slate-300 mb-4 leading-relaxed">
              We deliver to Tikona Park and all the surrounding localities in South-East Delhi. Our delivery radius is designed to reach you wherever you are in this area.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
              {[
                "Tikona Park Main", "Shaheen Bagh", "Zakir Nagar",
                "Batla House", "Okhla Phase 1", "Okhla Phase 2",
                "Sarita Vihar", "Abul Fazal Enclave", "Ghaffar Manzil",
                "Jasola", "Noor Nagar", "Jamia Nagar",
              ].map((area) => (
                <div key={area} className="flex items-center gap-2">
                  <span className="text-yellow-400">✓</span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Not sure if we deliver to your street?{" "}
              <Link href="/contact" className="text-yellow-400 underline">Contact us</Link>
              {" "}and we will confirm in seconds.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              How to Order Pizza in Tikona Park
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { step: "1", title: "Visit Our Website",  desc: "Go to pizzafun.co.in on any device — mobile, tablet, or desktop. No app download needed." },
                { step: "2", title: "Pick Your Pizza",    desc: "Browse our full menu, customise your toppings, and add combo sides like garlic bread or loaded fries." },
                { step: "3", title: "Add Your Address",   desc: "Enter your exact Tikona Park address and choose your preferred payment method." },
                { step: "4", title: "Sit Back & Track",   desc: "Track your order live at pizzafun.co.in/track-order. We will notify you when your pizza is out for delivery." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="bg-yellow-400 text-slate-900 font-black text-lg w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <strong className="text-slate-900 block">{s.title}</strong>
                    <span className="text-slate-600">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 border-l-4 border-yellow-400 pl-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              A Halal Pizza Brand You Can Trust in Tikona Park
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Finding genuinely halal food in Delhi can be a challenge. Many restaurants claim halal but cannot back it with verified sourcing or preparation standards. At Halal Pizza Fun, we take a different approach. Our halal certification is not a label — it is a practice that governs every aspect of our kitchen operations.
            </p>
            <p className="text-slate-700 leading-relaxed mb-3">
              From the moment fresh chicken arrives at our kitchen to the moment your pizza leaves in our delivery bag, halal compliance is maintained at every step. We work only with trusted, certified halal meat suppliers, and our staff follows strict preparation protocols to ensure zero cross-contamination with non-halal products.
            </p>
            <p className="text-slate-700 leading-relaxed">
              For the Tikona Park community, this means you can order from Halal Pizza Fun with complete peace of mind — knowing that every bite on your plate is genuinely halal.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
              Frequently Asked Questions — Pizza Delivery in Tikona Park
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">More Areas We Serve</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/pizza-near-shaheen-bagh", label: "Pizza Near Shaheen Bagh", desc: "Fast halal delivery to Shaheen Bagh & all nearby areas." },
                { href: "/pizza-near-zakir-nagar",  label: "Pizza Near Zakir Nagar",  desc: "Fresh pizza delivered to Zakir Nagar in 30 minutes." },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 transition-colors group">
                  <div className="font-bold text-yellow-400 group-hover:text-yellow-300 mb-1">{link.label} →</div>
                  <div className="text-slate-400 text-sm">{link.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-yellow-400 rounded-3xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              Order Your Pizza in Tikona Park Today
            </h2>
            <p className="text-slate-800 mb-6">Fresh. Halal. Hot. At your door in 30 minutes.</p>
            <Link href="/menu" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg px-10 py-4 rounded-full transition-colors inline-block">
              Order Now — Fast &amp; Easy
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
            <Link href="/pizza-near-zakir-nagar"    className="hover:text-white transition-colors">Zakir Nagar</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}