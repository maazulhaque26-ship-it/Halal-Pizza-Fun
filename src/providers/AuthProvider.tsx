"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Don't re-fetch session every time the user switches back to the tab.
      // Default is true — it causes a brief status="loading" flash that triggers
      // the protected-layout redirect to /auth/login even when the user IS logged in.
      refetchOnWindowFocus={false}
      // Re-validate session every 10 minutes in the background (keep alive).
      refetchInterval={10 * 60}
    >
      {children}
    </SessionProvider>
  );
}
