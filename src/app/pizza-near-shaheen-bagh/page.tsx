import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLD";
import { localPageSchemas } from "@/lib/seo/schema";
import { SEO_CONFIG } from "@/lib/seo/config";

// ─── SEO Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Pizza Near Shaheen Bagh | Fresh Halal Pizza Delivery | Halal Pizza Fun",
  description:
    "Craving pizza near Shaheen Bagh? Halal Pizza Fun delivers fresh, 100% halal pizzas in 30 minutes. Cheese burst, chicken tikka, BBQ chicken & more. Order online now!",
  keywords: [
    "pizza near shaheen bagh",
    "pizza delivery shaheen bagh",
    "halal pizza shaheen bagh",
    "best pizza shaheen bagh",
    "pizza home delivery shaheen bagh",
    "online pizza order shaheen bagh",
    "pizza near okhla",
    "halal food delivery shaheen bagh",
    "fast food near shaheen bagh",
    "pizza near jamia nagar",
  ],
  alternates: {
    canonical: `${SEO_CONFIG.siteUrl}/pizza-near-shaheen-bagh`,
  },
  openGraph: {
    title:       "Pizza Near Shaheen Bagh | Halal Pizza Fun Delhi",
    description: "Order fresh halal pizza in Shaheen Bagh. Fast delivery, 100% halal certified. Chicken tikka, cheese burst, BBQ & more.",
    url:         `${SEO_CONFIG.siteUrl}/pizza-near-shaheen-bagh`,
    type:        "website",
    images: [{ url: SEO_CONFIG.defaults.ogImage, width: 1200, height: 630, alt: "Halal Pizza near Shaheen Bagh" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Pizza Near Shaheen Bagh | Halal Pizza Fun",
    description: "Fresh halal pizza delivered fast to Shaheen Bagh, Delhi.",
    images:      [SEO_CONFIG.defaults.ogImage],
  },
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const faqs = [
  {
    question: "Is Halal Pizza Fun available for delivery near Shaheen Bagh?",
    answer:
      "Yes! Halal Pizza Fun delivers fresh, hot pizzas directly to Shaheen Bagh and all surrounding areas including Ghaffar Manzil, Abul Fazal Enclave, Noor Nagar, Batla House, and Jamia Nagar. Simply visit our website, place your order, and track your delivery in real time.",
  },
  {
    question: "How long does pizza delivery take to Shaheen Bagh?",
    answer:
      "Our average delivery time to Shaheen Bagh is 25–35 minutes, depending on your exact location and order volume. We prioritise speed without compromising on freshness — every pizza is prepared only after you place your order.",
  },
  {
    question: "Is the pizza at Halal Pizza Fun genuinely halal?",
    answer:
      "Absolutely. Every ingredient used at Halal Pizza Fun is 100% halal certified. We source our chicken and meat from verified halal suppliers. Our kitchen follows strict halal preparation guidelines, so you can order with complete confidence.",
  },
  {
    question: "What is the minimum order value for delivery to Shaheen Bagh?",
    answer:
      "We have a minimal order threshold to ensure quality delivery to your area. Visit our website or contact us directly to check the current minimum order value and any applicable delivery charges for your exact location in Shaheen Bagh.",
  },
  {
    question: "What pizzas are most popular near Shaheen Bagh?",
    answer:
      "Our most loved pizzas in the Shaheen Bagh area include Chicken Tikka Pizza, BBQ Chicken Cheese Burst, Spicy Chicken Loaded, Classic Margherita, and our signature Double Chicken Supreme. Check our full menu at pizzafun.co.in/menu.",
  },
  {
    question: "Do you offer discounts and deals for Shaheen Bagh orders?",
    answer:
      "Yes, we regularly run offers on combo meals, weekday discounts, and special deals for loyal customers. Check our Offers page at pizzafun.co.in/offers for the latest promotions and coupon codes valid for Shaheen Bagh delivery.",
  },
  {
    question: "What are your delivery hours in Shaheen Bagh?",
    answer:
      "We are open for delivery 7 days a week from 10:00 AM to 11:30 PM. Late-night cravings? We have you covered right up to closing. Check the website for any special hour changes during holidays.",
  },
  {
    question: "Can I track my pizza order from Shaheen Bagh?",
    answer:
      "Yes! Once you place an order on our website, you will receive real-time tracking updates. Visit pizzafun.co.in/track-order and enter your order ID to see exactly where your pizza is at any moment.",
  },
  {
    question: "Do you deliver to Batla House, Jamia Nagar, and nearby areas?",
    answer:
      "Yes, our delivery zone covers Shaheen Bagh, Batla House, Jamia Nagar, Okhla, Abul Fazal Enclave, Ghaffar Manzil, Noor Nagar, and adjacent localities. If your address falls within our delivery radius, you will be able to place an order successfully on our website.",
  },
  {
    question: "How can I pay for my pizza order in Shaheen Bagh?",
    answer:
      "We accept all major payment methods — UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, and cash on delivery. Choose whichever is most convenient at checkout.",
  },
];

// ─── Schema Data ─────────────────────────────────────────────────────────────
const schemas = localPageSchemas({
  areaName:    "Shaheen Bagh",
  pageUrl:     `${SEO_CONFIG.siteUrl}/pizza-near-shaheen-bagh`,
  description: "Halal Pizza Fun delivers fresh halal pizzas to Shaheen Bagh, Okhla, Batla House, Jamia Nagar and surrounding areas of South-East Delhi.",
  faqs,
  breadcrumbs: [
    { name: "Home",           url: SEO_CONFIG.siteUrl },
    { name: "Pizza Delivery", url: `${SEO_CONFIG.siteUrl}/delivery` },
    { name: "Shaheen Bagh",   url: `${SEO_CONFIG.siteUrl}/pizza-near-shaheen-bagh` },
  ],
});

// ─── Page Component ──────────────────────────────────────────────────────────
export default function PizzaNearShaheenBaghPage() {
  return (
    <>
      {/* JSON-LD Schemas */}
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
            <span className="text-yellow-400">Shaheen Bagh</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
            Fresh Halal Pizza Near{" "}
            <span className="text-yellow-400">Shaheen Bagh</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Delivered hot to your door in 30 minutes. 100% halal certified. No compromises.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/menu"
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-base px-8 py-3 rounded-full transition-colors inline-block"
            >
              View Full Menu
            </Link>
            <Link
              href="/offers"
              className="border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 font-semibold text-base px-8 py-3 rounded-full transition-colors inline-block"
            >
              Today&apos;s Offers
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Section 1: Intro */}
          <section className="mb-12">
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              Shaheen Bagh is one of Delhi&apos;s most vibrant and flavour-loving neighbourhoods. Nestled in the heart of South-East Delhi, close to Jamia Millia Islamia and the lively Okhla district, Shaheen Bagh is home to food lovers who know quality. And when it comes to pizza, one name has become synonymous with freshness, trust, and speed in this area — <strong>Halal Pizza Fun</strong>.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              We are Delhi&apos;s favourite halal pizza restaurant, and we&apos;re proud to serve the Shaheen Bagh community with hand-crafted pizzas made fresh to order. Every pizza that leaves our kitchen is 100% halal certified, prepared with real ingredients, and delivered to your doorstep while still hot and crispy.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              Whether you&apos;re ordering a quick lunch, planning a family dinner, or satisfying a late-night craving, Halal Pizza Fun is ready to deliver the best pizza experience in Shaheen Bagh — every single time.
            </p>
          </section>

          {/* Section 2: Why HPF */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Why Halal Pizza Fun Is Shaheen Bagh&apos;s Favourite Pizza
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: "🍕", title: "100% Halal Certified",   desc: "Every ingredient — from chicken to sauces — is sourced from verified halal suppliers. No compromises, ever." },
                { icon: "⚡", title: "Fast 30-Minute Delivery", desc: "We know you are hungry. Our streamlined kitchen and local delivery team ensure your pizza arrives hot within 30 minutes." },
                { icon: "🌶️", title: "Made Fresh, Every Order", desc: "We never pre-make or store pizzas. Every order is freshly prepared the moment you place it — that is our promise." },
                { icon: "💳", title: "Easy Online Ordering",    desc: "Order in seconds through our website. Pay via UPI, card, or cash on delivery. Real-time order tracking included." },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Menu highlights */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Most Popular Pizzas Near Shaheen Bagh
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Our Shaheen Bagh customers have their clear favourites. Here are the pizzas that fly off our shelves every day. All are 100% halal, made with fresh mozzarella, and available for immediate delivery.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                { name: "Chicken Tikka Pizza",        desc: "Tender marinated chicken tikka on a tangy tomato base, loaded with mozzarella. A crowd favourite." },
                { name: "BBQ Chicken Cheese Burst",   desc: "Smoky BBQ sauce, pulled chicken, caramelised onions, and a cheese-filled crust that oozes on every bite." },
                { name: "Spicy Chicken Loaded",       desc: "For those who like it hot — crispy chicken strips, jalapeños, chilli flakes, and a sriracha drizzle." },
                { name: "Classic Margherita",         desc: "Simplicity done right. San Marzano tomato sauce, fresh mozzarella, and a drizzle of extra virgin olive oil." },
                { name: "Double Chicken Supreme",     desc: "Our bestseller — double the chicken, double the cheese, double the satisfaction." },
                { name: "Garlic Chicken Paneer",      desc: "A unique Delhi-inspired topping combo of garlicky chicken and paneer chunks that locals love." },
              ].map((pizza) => (
                <li key={pizza.name} className="flex gap-3 items-start">
                  <span className="text-yellow-500 font-bold mt-1">●</span>
                  <span className="text-slate-700">
                    <strong className="text-slate-900">{pizza.name}</strong> — {pizza.desc}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/menu"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-6 py-3 rounded-full transition-colors"
            >
              See Full Menu →
            </Link>
          </section>

          {/* Section 4: Delivery coverage */}
          <section className="mb-12 bg-slate-900 text-white rounded-3xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              We Deliver Across Shaheen Bagh &amp; Beyond
            </h2>
            <p className="text-slate-300 mb-4 leading-relaxed">
              Our delivery zone covers all of Shaheen Bagh and extends to every major nearby locality. Whether you are at home, the office, or a hostel near Jamia — we will find you.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
              {[
                "Shaheen Bagh Main", "Ghaffar Manzil", "Abul Fazal Enclave",
                "Noor Nagar", "Batla House", "Jamia Nagar",
                "Okhla Phase 1", "Okhla Phase 2", "Haji Colony",
                "Jasola", "Joga Bai", "Shahi Idgah Area",
              ].map((area) => (
                <div key={area} className="flex items-center gap-2">
                  <span className="text-yellow-400">✓</span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Do not see your area?{" "}
              <Link href="/contact" className="text-yellow-400 underline">Contact us</Link>
              {" "}— we are always expanding our delivery zone.
            </p>
          </section>

          {/* Section 5: How to order */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              How to Order Pizza in Shaheen Bagh
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { step: "1", title: "Browse Our Menu",    desc: "Visit pizzafun.co.in/menu and explore our full range of halal pizzas, sides, and combos." },
                { step: "2", title: "Add to Cart",         desc: "Choose your pizza size, toppings, and add sides like garlic bread or loaded fries." },
                { step: "3", title: "Checkout Securely",   desc: "Enter your Shaheen Bagh address and pay via UPI, card, or cash on delivery." },
                { step: "4", title: "Track Your Order",    desc: "Receive real-time updates and track your delivery at pizzafun.co.in/track-order." },
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

          {/* Section 6: Halal trust */}
          <section className="mb-12 border-l-4 border-yellow-400 pl-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Our Halal Commitment to Shaheen Bagh
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              We understand that for the Shaheen Bagh community, halal is not just a preference — it is a requirement. That is why at Halal Pizza Fun, halal is not a marketing buzzword; it is the foundation of how we operate.
            </p>
            <p className="text-slate-700 leading-relaxed mb-3">
              All our chicken and meat products are sourced exclusively from halal-certified suppliers. Our kitchen follows strict segregation protocols, and our staff is trained in halal food handling. When you order from us, you have our complete assurance that every bite on your plate meets the highest halal standards.
            </p>
            <p className="text-slate-700 leading-relaxed">
              This commitment has made us the most trusted pizza brand in Shaheen Bagh, Zakir Nagar, Tikona Park, and across South-East Delhi.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
              Frequently Asked Questions — Pizza Delivery in Shaheen Bagh
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group border border-slate-200 rounded-2xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-900 list-none">
                    {faq.question}
                    <span className="text-yellow-500 font-black text-xl ml-4">+</span>
                  </summary>
                  <div className="p-5 text-slate-700 leading-relaxed bg-white">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Explore more */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Explore Other Areas We Serve</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/pizza-near-zakir-nagar", label: "Pizza Near Zakir Nagar", desc: "Fast halal pizza delivery to Zakir Nagar & nearby areas." },
                { href: "/pizza-near-tikona-park", label: "Pizza Near Tikona Park", desc: "Fresh pizza delivered to Tikona Park & surrounding localities." },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 transition-colors group"
                >
                  <div className="font-bold text-yellow-400 group-hover:text-yellow-300 mb-1">{link.label} →</div>
                  <div className="text-slate-400 text-sm">{link.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-yellow-400 rounded-3xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              Ready to Order Pizza in Shaheen Bagh?
            </h2>
            <p className="text-slate-800 mb-6">
              Fresh. Halal. Hot. Delivered to your door in 30 minutes.
            </p>
            <Link
              href="/menu"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg px-10 py-4 rounded-full transition-colors inline-block"
            >
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
            <Link href="/"                           className="hover:text-white transition-colors">Home</Link>
            <Link href="/menu"                       className="hover:text-white transition-colors">Menu</Link>
            <Link href="/offers"                     className="hover:text-white transition-colors">Offers</Link>
            <Link href="/about-us"                   className="hover:text-white transition-colors">About</Link>
            <Link href="/contact"                    className="hover:text-white transition-colors">Contact</Link>
            <Link href="/pizza-near-zakir-nagar"     className="hover:text-white transition-colors">Zakir Nagar</Link>
            <Link href="/pizza-near-tikona-park"     className="hover:text-white transition-colors">Tikona Park</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}