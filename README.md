# Halal Pizza Fun — Full-Stack Food Delivery Platform

A production-ready, multi-branch food delivery platform built with **Next.js 16**, **React 19**, **MongoDB**, and **Socket.io**. Supports online ordering, real-time order tracking, multi-role administration, and seamless payment integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Server Components) |
| UI | React 19, Tailwind CSS v4, Framer Motion, GSAP |
| Language | TypeScript |
| Database | MongoDB via Mongoose |
| Auth | NextAuth v4 (JWT + RBAC) |
| Real-time | Socket.io (standalone Express server) |
| Payments | Razorpay (UPI / Card / COD) |
| Maps | Leaflet + React-Leaflet + Nominatim |
| Storage | Cloudinary |
| Push Notifications | Web Push (VAPID) |
| State Management | Zustand |
| PWA | Service Worker + Web App Manifest |
| Validation | Zod + React Hook Form |

---

## Features

### Customer-facing
- **Multi-branch ordering** — auto-detects nearest branch, branch-specific menus and pricing
- **Full checkout flow** — cart, coupon codes, dynamic delivery fee, address picker on map
- **Live order tracking** — real-time status updates via Socket.io
- **User accounts** — signup/login with email OTP, order history, saved addresses
- **Reviews** — per-product ratings and reviews
- **PWA** — installable, works offline, push notification support

### Admin & Operations
- **Super Admin dashboard** — analytics, revenue, order volume, branch performance
- **Branch Manager panel** — branch-level order management, menu, stock, timings
- **Delivery Partner dashboard** — assigned orders, route, delivery confirmation
- **CMS** — homepage content, settings, banners, and SEO managed from the admin panel
- **Franchise enquiry management**
- **Coupon and discount engine**

---

## Project Structure

```
src/
├── app/
│   ├── admin/            # Super-admin dashboard & sub-routes
│   ├── api/              # REST API route handlers
│   │   ├── auth/         # NextAuth + OTP endpoints
│   │   ├── orders/       # Order CRUD & status
│   │   ├── products/     # Menu products
│   │   ├── payments/     # Razorpay integration
│   │   └── ...
│   ├── auth/             # Login / signup pages
│   ├── branch/           # Branch manager pages
│   ├── checkout/         # Cart + checkout
│   ├── menu/             # Menu browsing
│   ├── orders/           # Customer order history
│   └── track-order/      # Live tracking page
├── components/           # Shared UI components
│   ├── ui/               # Primitives (Button, Modal, etc.)
│   ├── admin/            # Admin-specific components
│   └── maps/             # Map components
├── lib/
│   ├── db/               # MongoDB connection + Mongoose models
│   ├── auth/             # Auth helpers
│   ├── services/         # Business logic layer
│   └── utils.ts
├── store/                # Zustand stores
├── providers/            # React context providers
└── types/                # Global TypeScript types

socket-server.js          # Standalone Socket.io / Express server
scripts/                  # DB seed scripts
public/
├── sw.js                 # Service worker
└── manifest.json         # PWA manifest
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account
- A [Razorpay](https://razorpay.com/) account (test keys work for development)

### 1. Clone & Install

```bash
git clone https://github.com/maazulhaque26-ship-it/Halal-Pizza-Fun.git
cd Halal-Pizza-Fun
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in every value. See the table below.

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Random 32-char secret (`openssl rand -base64 32`) |
| `JWT_SECRET` | Separate secret for custom JWT signing |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key |
| `EMAIL_USER` | SMTP sender email (Gmail) |
| `EMAIL_PASS` | Gmail app password |

### 3. Seed the Database

```bash
npm run seed
```

This creates the default Super Admin account using `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD` from your `.env.local`.

### 4. Run Development Servers

```bash
npm run dev
```

This starts **both** the Next.js dev server (`localhost:3000`) and the Socket.io server (`localhost:4000`) via `concurrently`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js + Socket.io in watch mode |
| `npm run build` | Production build |
| `npm run start` | Production server (Next.js + Socket.io) |
| `npm run seed` | Seed database with default admin |
| `npm run lint` | ESLint |

---

## Deployment

### Vercel (recommended for Next.js)

1. Push this repo to GitHub.
2. Import the project in your [Vercel dashboard](https://vercel.com/).
3. Add all environment variables from `.env.example` under **Project → Settings → Environment Variables**.
4. Deploy.

> **Note:** The Socket.io server (`socket-server.js`) is a standalone Node process and cannot run on Vercel's serverless functions. Deploy it separately on **Railway**, **Render**, or a VPS, then set `NEXT_PUBLIC_SOCKET_URL` to its public URL.

### Database

Use [MongoDB Atlas](https://www.mongodb.com/atlas) for a managed cloud database. Replace `MONGODB_URI` with the Atlas connection string.

---

## Security

- **CSRF protection** on all mutating API routes
- **Rate limiting** on auth and payment endpoints (express-rate-limit)
- **Helmet.js** headers on the Socket.io server
- **Zod** schema validation on all API inputs
- **bcryptjs** password hashing
- **Role-based access control** — Super Admin / Branch Manager / Delivery Partner / Customer
- All secrets managed via environment variables — never committed to source control

---

## License

© 2026 Halal Pizza Fun. All rights reserved.
