/**
 * Socket.IO client singleton — single source of truth for ALL socket
 * connections in the app. No page component should ever call `io()` directly.
 *
 * URL resolution order:
 *   1. NEXT_PUBLIC_SOCKET_URL env var (inlined at build time by Next.js)
 *   2. Hard fail in production if undefined/localhost (caught at runtime)
 *
 * Auth flow:
 *   Call connectSocket() instead of getSocket().connect().
 *   connectSocket() fetches a short-lived JWT from /api/auth/socket-token
 *   and sets socket.auth before connecting. The NextAuth session cookie is
 *   SameSite=Lax and is NOT forwarded to the Render origin — the JWT is
 *   the only way to authenticate cross-origin socket connections.
 *
 * Reconnection:
 *   connect_error handler automatically refreshes the JWT on auth failures
 *   (expired token after 2h) and retries. reconnectionAttempts is Infinity
 *   so the socket survives Render free-tier cold starts (~30s wake-up).
 */
import { io, Socket } from "socket.io-client";

// ─── URL ─────────────────────────────────────────────────────────────────────
// NEXT_PUBLIC_* vars are replaced with literal strings at build time.
// If the build ran without the var, the bundle literally contains "undefined"
// and the fallback kicks in. We surface this as a loud error instead of
// silently connecting to localhost in production.

const _rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

function resolveSocketUrl(): string {
  // Server-side: return a dummy value — sockets are client-only
  if (typeof window === "undefined") return "http://localhost:4000";

  if (!_rawUrl) {
    const msg =
      "[Socket] NEXT_PUBLIC_SOCKET_URL is not set. " +
      "Set it in your Vercel dashboard → Environment Variables → Production, " +
      "then redeploy. Falling back to localhost (will fail in production).";
    console.error(msg);
    return "http://localhost:4000";
  }

  if (
    process.env.NODE_ENV === "production" &&
    (_rawUrl.includes("localhost") || _rawUrl.includes("127.0.0.1"))
  ) {
    console.error(
      "[Socket] CRITICAL: NEXT_PUBLIC_SOCKET_URL is a localhost URL in production! " +
      `Value: "${_rawUrl}". ` +
      "This means the build ran without the Vercel env var. " +
      "Fix: set NEXT_PUBLIC_SOCKET_URL in Vercel dashboard and trigger a new deployment."
    );
  }

  return _rawUrl;
}

const SOCKET_URL = resolveSocketUrl();

// ─── Singleton ────────────────────────────────────────────────────────────────
let socket: Socket | null = null;
let connectErrorCount = 0;

export function getSocket(): Socket {
  // SSR safety: never instantiate on the server
  if (typeof window === "undefined") {
    throw new Error("[Socket] getSocket() called server-side. Import it inside useEffect only.");
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,           // Always call connectSocket(), not connect()
      transports: ["websocket", "polling"], // WebSocket first; polling as TCP fallback
      reconnection: true,
      reconnectionAttempts: Infinity, // Survive Render free-tier cold starts
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,  // Cap at 30s — long enough for Render wake-up
      timeout: 20000,               // 20s handshake timeout (8s was too low for mobile)
      upgrade: true,
    });

    // ── Global lifecycle logging ────────────────────────────────────────────
    socket.on("connect", () => {
      connectErrorCount = 0;
      console.log(`[Socket] Connected  id=${socket!.id}  url=${SOCKET_URL}`);
    });

    socket.on("connect_error", async (err) => {
      connectErrorCount++;
      if (connectErrorCount === 1 || connectErrorCount % 5 === 0) {
        console.warn(`[Socket] connect_error #${connectErrorCount}: ${err.message}  url=${SOCKET_URL}`);
      }

      // Token expired or rejected → refresh before the next reconnect attempt
      const isAuthError =
        err.message.includes("expired") ||
        err.message.includes("Invalid") ||
        err.message.includes("Token is required") ||
        err.message.includes("Authentication");

      if (isAuthError) {
        try {
          const res = await fetch("/api/auth/socket-token");
          if (res.ok) {
            const { token } = await res.json();
            (socket as any).auth = { token };
            console.log("[Socket] JWT refreshed — next reconnect will use fresh token");
          }
        } catch {
          // fetch failed (offline) — keep retrying; token refreshed on next attempt
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      // "io server disconnect" = server explicitly closed (e.g. auth failure).
      // Manually re-enter the reconnect loop so the fresh token (set above) is used.
      if (reason === "io server disconnect") {
        socket?.connect();
      }
    });

    socket.on("error", (err) => {
      console.warn("[Socket] Server error event:", err);
    });
  }

  return socket;
}

/**
 * Fetch a short-lived JWT and connect the socket. Safe to call multiple times:
 * if the socket is already connected, returns immediately without doing anything.
 *
 * All components that need the socket should call this instead of
 * `getSocket().connect()`.
 */
export async function connectSocket(): Promise<Socket> {
  const s = getSocket();

  // Already connected — nothing to do
  if (s.connected) return s;

  // Fetch auth token before connecting
  try {
    const res = await fetch("/api/auth/socket-token");
    if (res.ok) {
      const { token } = await res.json();
      (s as any).auth = { token };
    }
  } catch {
    // Offline or server error — proceed without token.
    // The connect_error handler will retry with a fresh token on the next attempt.
  }

  s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectErrorCount = 0;
  }
}

export type { Socket };
