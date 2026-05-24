"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * useCsrf — fetches a CSRF token from /api/csrf on mount and stores it.
 * Use the returned `csrfToken` as the value of the `X-CSRF-Token` header
 * on every state-mutating fetch (POST / PUT / PATCH / DELETE).
 *
 * Usage:
 *   const { csrfToken, fetchCsrf } = useCsrf();
 *   fetch("/api/orders", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
 *     body: JSON.stringify(data),
 *   });
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string>("");

  const fetchCsrf = useCallback(async () => {
    try {
      const res = await fetch("/api/csrf");
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken ?? "");
      }
    } catch {
      // Non-fatal: token stays empty; backend will reject mutating requests.
      console.warn("[useCsrf] Failed to fetch CSRF token.");
    }
  }, []);

  useEffect(() => {
    fetchCsrf();
  }, [fetchCsrf]);

  return { csrfToken, refetch: fetchCsrf };
}
