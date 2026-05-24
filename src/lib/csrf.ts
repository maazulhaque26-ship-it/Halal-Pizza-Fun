import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || "csrf_fallback_dev";

/**
 * Generates a CSRF token: randomNonce.HMAC(randomNonce, CSRF_SECRET)
 * This is a stateless, double-submit-cookie-compatible pattern.
 */
export function generateCsrfToken(): string {
  const nonce = randomBytes(32).toString("hex");
  const hmac = createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
  return `${nonce}.${hmac}`;
}

/**
 * Validates a CSRF token previously issued by generateCsrfToken()
 */
export function validateCsrfToken(token: string): boolean {
  try {
    const [nonce, hmac] = token.split(".");
    if (!nonce || !hmac) return false;
    const expected = createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
    return expected === hmac;
  } catch {
    return false;
  }
}
