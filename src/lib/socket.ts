/**
 * Singleton Socket.IO client.
 *
 * Auth strategy:
 *   Before calling connect(), the caller fetches /api/auth/socket-token and
 *   sets socket.auth = { token }. The NextAuth session cookie is SameSite=Lax
 *   and is NOT sent in cross-origin XHR/fetch requests, so we use a short-lived
 *   JWT instead.
 *
 * Transport strategy:
 *   ["websocket", "polling"] — WebSocket is tried first. Polling is a fallback
 *   for environments where WebSocket is blocked. Polling-first would cause the
 *   service worker to intercept /socket.io/ polling requests and corrupt the
 *   Socket.IO wire protocol.
 *
 * One instance per browser tab, shared across all components.
 */
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connectErrorCount = 0;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

    socket = io(url, {
      withCredentials: true,
      autoConnect: false,          // Caller decides when to connect
      transports: ["websocket", "polling"], // WebSocket first — polling is SW-safe fallback
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying — Render free tier wakes up in ~30s
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,    // Cap at 30s, not 15s, to survive Render cold starts
      timeout: 20000,                 // 20s handshake timeout (was 8s — too low for mobile)
      upgrade: true,                  // Allow upgrade from polling to websocket
    });

    socket.on("connect", () => {
      connectErrorCount = 0;
      console.log(`[Socket] Connected id=${socket!.id}`);
    });

    socket.on("connect_error", async (err) => {
      connectErrorCount++;

      // Log first error and every 5th after to avoid console spam
      if (connectErrorCount === 1) {
        console.warn(`[Socket] Real-time server unavailable. Retrying... (${err.message})`);
      } else if (connectErrorCount % 5 === 0) {
        console.warn(`[Socket] Still retrying — attempt ${connectErrorCount} (${err.message})`);
      }

      // Token expired or invalid → fetch a fresh JWT before the next reconnect
      if (
        err.message.includes("expired") ||
        err.message.includes("Invalid") ||
        err.message.includes("Token is required")
      ) {
        try {
          const res = await fetch("/api/auth/socket-token");
          if (res.ok) {
            const { token } = await res.json();
            (socket as any).auth = { token };
            console.log("[Socket] Token refreshed — will retry with new JWT");
          }
        } catch {
          // fetch failed (offline) — keep retrying; token will be refreshed on next attempt
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      // "io server disconnect" means the SERVER explicitly closed the connection
      // (e.g. auth failure after token expiry). Manually reconnect so the
      // reconnection loop (with fresh token from connect_error handler) fires.
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

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectErrorCount = 0;
  }
}
