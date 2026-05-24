import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLES } from "@/config/constants";
import { env } from "@/config/env";
import { validateCsrfToken } from "@/lib/csrf";

// ─── Mutating methods that require a valid CSRF token ────────────────────────
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// ─── Paths exempt from CSRF (NextAuth handles its own CSRF, public webhooks, etc.)
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/",       // NextAuth manages its own CSRF
  "/api/csrf",        // token issuance endpoint itself
];

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─── CSRF Validation (stateless double-submit pattern) ───────────────────
  if (
    CSRF_PROTECTED_METHODS.has(req.method) &&
    pathname.startsWith("/api/") &&
    !isCsrfExempt(pathname)
  ) {
    const headerToken = req.headers.get("x-csrf-token") || "";
    const cookieToken = req.cookies.get("csrf-token")?.value || "";

    // Tokens must match AND each must be individually valid
    const valid =
      headerToken &&
      cookieToken &&
      headerToken === cookieToken &&
      validateCsrfToken(headerToken);

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing CSRF token." },
        { status: 403 }
      );
    }
  }

  const token = await getToken({
    req,
    secret: env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // ─── Route Protections ───────────────────────────────────────────────────
  const requiresAuth =
    pathname.startsWith("/admin/") || pathname === "/admin" ||
    pathname.startsWith("/branch/") || pathname === "/branch" ||
    pathname.startsWith("/checkout/") || pathname === "/checkout" ||
    pathname.startsWith("/orders/") || pathname === "/orders" ||
    pathname.startsWith("/api/orders/") || pathname === "/api/orders" ||
    pathname.startsWith("/api/admin/") || pathname === "/api/admin" ||
    pathname.startsWith("/api/branch/") || pathname === "/api/branch";

  if (requiresAuth && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(
      new URL(`/auth/login?reason=unauthenticated&from=${encodeURIComponent(pathname)}`, req.url)
    );
  }

  // ─── Super Admin Routing (RBAC) ──────────────────────────────────────────
  if (
    (pathname.startsWith("/admin/") || pathname === "/admin" ||
     pathname.startsWith("/api/admin/") || pathname === "/api/admin") &&
    token?.role !== ROLES.SUPER_ADMIN
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Admin only" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/auth/login?reason=unauthorized", req.url));
  }

  // ─── Branch Manager / Super Admin Routing (RBAC) ────────────────────────
  if (
    (pathname.startsWith("/branch/") || pathname === "/branch" ||
     pathname.startsWith("/api/branch/") || pathname === "/api/branch") &&
    token?.role !== ROLES.BRANCH_MANAGER &&
    token?.role !== ROLES.SUPER_ADMIN
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Branch Manager only" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/auth/login?reason=unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/branch/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/api/orders/:path*",
    "/api/admin/:path*",
    "/api/branch/:path*",
    // CSRF validation runs on all API mutation routes
    "/api/((?!auth|csrf).*)/:path*",
  ],
};

