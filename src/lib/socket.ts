/**
 * Singleton Socket.IO client.
 * Uses cookie-based auth (NextAuth session cookie is forwarded automatically
 * because `withCredentials: true` — the socket server reads it via
 * its NextAuth `decode()` middleware on handshake).
 *
 * ONE instance per browser tab, shared across all components.
 */
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

    socket = io(url, {
      withCredentials: true,       // Sends the NextAuth session cookie on handshake
      autoConnect: false,          // Caller decides when to connect
      reconnection: true,
      reconnectionAttempts: 10,    // Stop after 10 attempts (~2 min) if server is offline
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 8000,
      transports: ["polling", "websocket"],
    });

    // ── Global debug logging ──────────────────────────────────────────────
    socket.on("connect", () => {
      connectErrorCount = 0; // reset on successful connect
      console.log(`[Socket] ✅ Connected  id=${socket!.id}`);
    });

    // Throttle connect_error: log first attempt, then every 5th to avoid spam
    let connectErrorCount = 0;
    socket.on("connect_error", (err) => {
      connectErrorCount++;
      if (connectErrorCount === 1) {
        console.warn(`[Socket] ⚠️ Real-time server unavailable (${url}). Retrying in background...`);
      } else if (connectErrorCount % 5 === 0) {
        console.warn(`[Socket] ⚠️ Still retrying... attempt ${connectErrorCount} (${err.message})`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Socket] 🔌 Disconnected: ${reason}`);
    });

    socket.on("error", (err) => {
      console.warn("[Socket] Server error:", err);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
