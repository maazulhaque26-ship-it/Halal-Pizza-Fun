"use client";

/**
 * CsrfProvider — patches window.fetch once at the layout level so that
 * every mutating request (POST / PUT / PATCH / DELETE) automatically
 * includes the X-CSRF-Token and Cookie double-submit pair.
 *
 * Drop this component into any layout and all child pages are protected
 * without touching individual fetch() calls.
 */

import { useEffect, useRef } from "react";

async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await window._originalFetch?.("/api/csrf") ?? await fetch("/api/csrf");
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken ?? "";
    }
  } catch {
    /* non-fatal */
  }
  return "";
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const tokenRef = useRef<string>("");
  const patchedRef = useRef(false);

  useEffect(() => {
    if (patchedRef.current) return;
    patchedRef.current = true;

    // Keep a reference to the original fetch before patching
    if (typeof window !== "undefined") {
      window._originalFetch = window.fetch;

      // Fetch initial token
      fetchCsrfToken().then((t) => {
        tokenRef.current = t;
      });

      // Patch global fetch
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = (init?.method ?? "GET").toUpperCase();
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const isApiCall = url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/");
        const isMutating = MUTATING_METHODS.has(method);
        const isCsrfExempt = url.includes("/api/auth/") || url.includes("/api/csrf");

        if (isMutating && isApiCall && !isCsrfExempt) {
          // If we don't have a token yet, fetch one now
          if (!tokenRef.current) {
            tokenRef.current = await fetchCsrfToken();
          }

          init = {
            ...init,
            headers: {
              ...(init?.headers ?? {}),
              "X-CSRF-Token": tokenRef.current,
            },
          };
        }

        const result = await window._originalFetch!(input, init);

        // If the server returned 403 (expired token), refresh and retry once
        if (result.status === 403 && isMutating && isApiCall && !isCsrfExempt) {
          tokenRef.current = await fetchCsrfToken();
          init = {
            ...init,
            headers: {
              ...(init?.headers ?? {}),
              "X-CSRF-Token": tokenRef.current,
            },
          };
          return window._originalFetch!(input, init);
        }

        return result;
      };
    }

    return () => {
      // Restore original fetch on unmount (layout change / HMR)
      if (typeof window !== "undefined" && window._originalFetch) {
        window.fetch = window._originalFetch;
        patchedRef.current = false;
      }
    };
  }, []);

  return <>{children}</>;
}

// Extend Window type to hold original fetch reference
declare global {
  interface Window {
    _originalFetch?: typeof fetch;
  }
}
