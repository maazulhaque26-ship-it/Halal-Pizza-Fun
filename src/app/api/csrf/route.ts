import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

/**
 * GET /api/csrf
 * Returns a fresh CSRF token.
 * The browser must store this and send it back as the X-CSRF-Token header
 * on every state-mutating request (POST / PATCH / PUT / DELETE).
 */
export async function GET() {
  const token = generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });

  // Also set as a cookie so the proxy middleware can do double-submit verification
  response.cookies.set("csrf-token", token, {
    httpOnly: false,    // must be readable by JS to send in header
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,    // 1 hour
  });

  return response;
}
