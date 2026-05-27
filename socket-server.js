const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { decode } = require("next-auth/jwt");

// In production, env vars are injected by Render. Only load .env.local locally.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

const app = express();

// Build allowed origins list: ALLOWED_ORIGINS takes precedence (comma-separated),
// then FRONTEND_URL, then localhost fallback for dev.
const buildAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  }
  if (process.env.FRONTEND_URL) return [process.env.FRONTEND_URL.trim()];
  return ["http://localhost:3000"];
};

const ALLOWED_ORIGINS = buildAllowedOrigins();

const corsOriginFn = (origin, callback) => {
  // Allow requests with no origin (server-to-server, Render health checks)
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  callback(new Error(`CORS: origin '${origin}' not allowed`));
};

const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? corsOriginFn : (o, cb) => cb(null, true),
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Health check for Render uptime monitoring
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Set up rate limiter for REST API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? corsOriginFn : (o, cb) => cb(null, true),
    methods: ["GET", "POST"],
    credentials: true,
  },
  // connectTimeout: time allowed for handshake completion.
  // 10s was too low for mobile networks + Render cold starts (~30s wake time).
  connectTimeout: 45000,
  // pingTimeout: how long to wait for a pong after sending a ping.
  // Increased from 20s → 60s to tolerate mobile network interruptions and
  // Render's occasional latency spikes without spurious disconnects.
  pingTimeout: 60000,
  pingInterval: 25000,
  // Allow both WebSocket and polling. Clients prefer WebSocket first.
  transports: ["websocket", "polling"],
});

// Helper to parse cookies
const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, cookieStr) => {
    const [key, value] = cookieStr.split("=").map((c) => c.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};

// Handshake Token Authentication Middleware
io.use(async (socket, next) => {
  try {
    let token = null;

    // 1. Try to extract NextAuth token from cookies (for browser connections)
    const cookies = parseCookies(socket.handshake.headers.cookie);
    token = cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"];

    // 2. Try to extract from Authorization header
    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Try to extract from handshake auth object
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error("Authentication error: Token is required"));
    }

    let decoded = null;

    // Attempt to decode as NextAuth JWE
    try {
      decoded = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET,
      });
    } catch (e) {
      // Not a NextAuth token, will try jsonwebtoken fallback
    }

    // Fallback: decode as a standard JWT.
    // The socket-token route (/api/auth/socket-token) signs with NEXTAUTH_SECRET.
    // We MUST verify with the same key — NOT JWT_SECRET, which is a separate
    // internal secret used elsewhere and may differ between Vercel and Render.
    if (!decoded) {
      const verifySecret = process.env.NEXTAUTH_SECRET;
      if (!verifySecret) {
        return next(new Error("Authentication error: NEXTAUTH_SECRET not configured on socket server"));
      }
      try {
        decoded = jwt.verify(token, verifySecret);
      } catch (e) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }
    }

    if (!decoded) {
      return next(new Error("Authentication error: Decryption failed"));
    }

    // Bind validated claims to socket — coerce to strings so room comparisons
    // work correctly regardless of whether the JWT carries a string or ObjectId.
    socket.userId = String(decoded.id || decoded.sub || "");
    socket.role = decoded.role;
    socket.branchId = decoded.branchId ? String(decoded.branchId) : null;

    if (!socket.userId || !socket.role) {
      return next(new Error("Authentication error: Invalid token payload"));
    }

    next();
  } catch (err) {
    console.error("Socket authentication middleware error:", err);
    return next(new Error("Authentication error: Server error"));
  }
});

// TTL-based event deduplication — prevents replay without the nuclear Set.clear() at 5000.
// Each key expires after 5 minutes, keeping memory bounded without dropping recent duplicates.
const eventDeduplicator = new Map(); // key → expiresAt timestamp
const DEDUP_TTL_MS = 5 * 60 * 1000;

const isDuplicate = (key) => {
  const expiresAt = eventDeduplicator.get(key);
  if (expiresAt && Date.now() < expiresAt) return true;
  eventDeduplicator.set(key, Date.now() + DEDUP_TTL_MS);
  return false;
};

// Sweep expired entries every 10 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [k, exp] of eventDeduplicator) {
    if (now >= exp) eventDeduplicator.delete(k);
  }
}, 10 * 60 * 1000);

io.on("connection", (socket) => {
  console.log(`🔌 Secured Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.role})`);

  // Secure Auto-join rooms based on verified JWT claims
  if (socket.role === "BRANCH_MANAGER" && socket.branchId) {
    const roomName = `branch_${socket.branchId}`;
    socket.join(roomName);
    console.log(`🏢 Manager auto-joined room: ${roomName}`);
  }

  if (socket.role === "SUPER_ADMIN") {
    socket.join("admin_global");
    console.log(`👑 Super Admin auto-joined room: admin_global`);
  }

  if (socket.userId) {
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    console.log(`👤 User auto-joined room: ${userRoom}`);
  }

  // ─── Explicit Room Join Requests (With RBAC validation) ──────────────────
  socket.on("join_branch", (branchId) => {
    // Only super admins or managers assigned to this branch can join this room
    if (socket.role === "SUPER_ADMIN" || (socket.role === "BRANCH_MANAGER" && socket.branchId === branchId)) {
      const roomName = `branch_${branchId}`;
      socket.join(roomName);
      console.log(`🏢 Client ${socket.userId} joined room: ${roomName}`);
    } else {
      socket.emit("error", { message: "Unauthorized room access" });
      console.warn(`⚠️ Client ${socket.userId} blocked from joining branch_${branchId}`);
    }
  });

  socket.on("join_admin", () => {
    // Only super admins can join admin_global room
    if (socket.role === "SUPER_ADMIN") {
      socket.join("admin_global");
      console.log(`👑 Client ${socket.userId} joined room: admin_global`);
    } else {
      socket.emit("error", { message: "Unauthorized room access" });
      console.warn(`⚠️ Client ${socket.userId} blocked from joining admin_global`);
    }
  });

  // ─── Realtime Order Flow Validation (Prevent client-side spoofing) ──────
  socket.on("NEW_ORDER_CREATED", (data) => {
    const { branchId, orderId } = data;
    
    // Only Super Admins or Branch Managers from that branch can emit order broadcasts
    if (socket.role !== "SUPER_ADMIN" && !(socket.role === "BRANCH_MANAGER" && socket.branchId === branchId)) {
      socket.emit("error", { message: "Unauthorized order event emission" });
      return;
    }

    if (isDuplicate(`new_order_${orderId}`)) return;

    // Broadcast to specific branch and global admin
    io.to(`branch_${branchId}`).to("admin_global").emit("NEW_ORDER", data);
    console.log(`🚀 Secured Order ${orderId} broadcasted to branch_${branchId} & admin_global`);
  });

  socket.on("UPDATE_ORDER_STATUS", (data) => {
    const { userId, orderId, status, branchId } = data;

    // Validate role and branch ownership before broadcasting updates
    if (socket.role !== "SUPER_ADMIN" && !(socket.role === "BRANCH_MANAGER" && socket.branchId === branchId)) {
      socket.emit("error", { message: "Unauthorized status update emission" });
      return;
    }

    if (isDuplicate(`status_update_${orderId}_${status}`)) return;

    // Notify customer
    if (userId) io.to(`user_${userId}`).emit("ORDER_STATUS_CHANGED", data);
    // Sync with Super Admin
    io.to("admin_global").emit("ORDER_STATUS_CHANGED", data);
    console.log(`✅ Secured Order ${orderId} status updated to ${status}`);
  });

  // ─── ORDER TRANSFER EVENTS (Hyperlocal System) ──────────────────────────
  socket.on("ORDER_TRANSFER_INITIATED", (data) => {
    const { orderId, fromBranchId, toBranchId, customerId } = data;

    // Validate: Only managers from source branch can initiate
    if (socket.role !== "SUPER_ADMIN" && !(socket.role === "BRANCH_MANAGER" && socket.branchId === fromBranchId)) {
      socket.emit("error", { message: "Unauthorized transfer emission" });
      return;
    }

    if (isDuplicate(`transfer_${orderId}_${toBranchId}`)) return;

    // Notify source branch
    io.to(`branch_${fromBranchId}`).emit("ORDER_TRANSFERRED_OUT", {
      orderId,
      toBranchId,
      reason: data.reason,
      timestamp: new Date(),
    });

    // Notify destination branch (IMPORTANT: real-time popup alert)
    io.to(`branch_${toBranchId}`).emit("ORDER_TRANSFERRED_IN", {
      orderId,
      fromBranchId,
      customerId,
      reason: data.reason,
      customerDetails: data.customerDetails,
      items: data.items,
      timestamp: new Date(),
    });

    // Notify customer
    if (customerId) {
      io.to(`user_${customerId}`).emit("ORDER_REASSIGNED", {
        orderId,
        newBranchId: toBranchId,
        message: "Your order has been reassigned to a nearby branch for faster service.",
        timestamp: new Date(),
      });
    }

    // Admin notification
    io.to("admin_global").emit("ORDER_TRANSFER_LOG", {
      orderId,
      fromBranchId,
      toBranchId,
      transferredBy: socket.userId,
      timestamp: new Date(),
    });

    console.log(`🔄 Order ${orderId} transferred from branch_${fromBranchId} to branch_${toBranchId}`);
  });

  socket.on("ORDER_TRANSFER_REJECTED", (data) => {
    const { orderId, rejectionBranchId, fromBranchId, reason } = data;

    // Validate: Only managers from receiving branch can reject
    if (socket.role !== "SUPER_ADMIN" && !(socket.role === "BRANCH_MANAGER" && socket.branchId === rejectionBranchId)) {
      socket.emit("error", { message: "Unauthorized rejection emission" });
      return;
    }

    // Notify source branch that transfer was rejected
    io.to(`branch_${fromBranchId}`).emit("TRANSFER_REJECTED", {
      orderId,
      rejectedBy: rejectionBranchId,
      reason,
      timestamp: new Date(),
    });

    // Admin notification
    io.to("admin_global").emit("TRANSFER_REJECTION_LOG", {
      orderId,
      rejectionBranchId,
      fromBranchId,
      reason,
      timestamp: new Date(),
    });

    console.log(`❌ Transfer rejected for order ${orderId}`);
  });

  // ─── REFUND EVENTS ────────────────────────────────────────────────────
  socket.on("REFUND_INITIATED", (data) => {
    const { orderId, customerId, amount, reason } = data;

    // Validate: Only managers or admins
    if (!["BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(socket.role)) {
      socket.emit("error", { message: "Unauthorized refund emission" });
      return;
    }

    if (isDuplicate(`refund_${orderId}`)) return;

    // Notify customer
    if (customerId) {
      io.to(`user_${customerId}`).emit("REFUND_INITIATED", {
        orderId,
        amount,
        reason,
        message: "Refund initiated successfully. Check your account.",
        timestamp: new Date(),
      });
    }

    // Admin notification
    io.to("admin_global").emit("REFUND_LOG", {
      orderId,
      customerId,
      amount,
      reason,
      initiatedBy: socket.userId,
      timestamp: new Date(),
    });

    console.log(`💰 Refund initiated for order ${orderId}: ${amount}`);
  });

  // ─── INVENTORY EVENTS ─────────────────────────────────────────────────
  socket.on("INVENTORY_UPDATED", (data) => {
    const { branchId, productId, quantity, status } = data;

    // Validate: Only managers or admins from that branch
    if (socket.role !== "SUPER_ADMIN" && !(socket.role === "BRANCH_MANAGER" && socket.branchId === branchId)) {
      socket.emit("error", { message: "Unauthorized inventory update" });
      return;
    }

    // Notify branch managers
    io.to(`branch_${branchId}`).emit("INVENTORY_CHANGED", {
      productId,
      quantity,
      status,
      timestamp: new Date(),
    });

    // Admin notification for out-of-stock items
    if (status === "OUT_OF_STOCK") {
      io.to("admin_global").emit("LOW_STOCK_ALERT", {
        branchId,
        productId,
        quantity,
        timestamp: new Date(),
      });
    }

    console.log(`📦 Inventory updated: Branch ${branchId}, Product ${productId}, Qty: ${quantity}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// REST API key validation middleware for server-to-socket messages
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const expectedApiKey = process.env.SOCKET_API_KEY;
  if (!expectedApiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: SOCKET_API_KEY is not defined in production environment!");
      return res.status(500).json({ success: false, message: "Internal Server Error: Key Configuration Missing" });
    }
    console.warn("WARNING: SOCKET_API_KEY is missing. Using insecure development key fallback.");
  }
  const keyToCompare = expectedApiKey || "dev_socket_api_key_123";
  const valid =
    apiKey &&
    apiKey.length === keyToCompare.length &&
    crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(keyToCompare));
  if (!valid) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid API Key" });
  }
  next();
};

// Secured REST API endpoints for Next.js server to emit events
app.post("/api/notify/new-order", validateApiKey, (req, res) => {
  const { branchId, orderId, order } = req.body || {};

  if (!branchId || !orderId) {
    return res.status(400).json({ success: false, message: "branchId and orderId are required" });
  }

  if (isDuplicate(`new_order_${orderId}`)) return res.json({ success: true, cached: true });

  const payload = { branchId, orderId, order, timestamp: new Date() };

  // Emit to branch and super admins
  io.to(`branch_${branchId}`).to("admin_global").emit("NEW_ORDER", payload);
  console.log(`🔔 Secure API Trigger: Broadcasted Order ${orderId} to branch_${branchId} & admin_global`);

  return res.json({ success: true });
});

app.post("/api/notify/update-status", validateApiKey, (req, res) => {
  const { userId, orderId, status, branchId } = req.body || {};

  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: "orderId and status are required" });
  }

  if (isDuplicate(`status_update_${orderId}_${status}`)) return res.json({ success: true, cached: true });

  const payload = { userId, orderId, status, branchId, timestamp: new Date() };

  if (userId) io.to(`user_${userId}`).emit("ORDER_STATUS_CHANGED", payload);
  io.to("admin_global").emit("ORDER_STATUS_CHANGED", payload);
  
  console.log(`🔔 Secure API Trigger: Broadcasted Status ${status} for Order ${orderId}`);

  return res.json({ success: true });
});

// ─── TRANSFER NOTIFICATION ENDPOINTS ──────────────────────────────────────
app.post("/api/notify/order-transfer", validateApiKey, (req, res) => {
  const { orderId, fromBranchId, toBranchId, customerId, reason, customerDetails, items } = req.body || {};

  if (!orderId || !fromBranchId || !toBranchId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (isDuplicate(`transfer_${orderId}_${toBranchId}`)) return res.json({ success: true, cached: true });

  // Notify source branch (order disappears)
  io.to(`branch_${fromBranchId}`).emit("ORDER_TRANSFERRED_OUT", {
    orderId,
    toBranchId,
    reason,
    timestamp: new Date(),
  });

  // Notify destination branch (order appears with popup)
  io.to(`branch_${toBranchId}`).emit("ORDER_TRANSFERRED_IN", {
    orderId,
    fromBranchId,
    customerId,
    reason,
    customerDetails,
    items,
    timestamp: new Date(),
  });

  // Notify customer
  if (customerId) {
    io.to(`user_${customerId}`).emit("ORDER_REASSIGNED", {
      orderId,
      newBranchId: toBranchId,
      message: "Your order has been reassigned to a nearby branch for faster service.",
      timestamp: new Date(),
    });
  }

  // Admin notification
  io.to("admin_global").emit("ORDER_TRANSFER_LOG", {
    orderId,
    fromBranchId,
    toBranchId,
    timestamp: new Date(),
  });

  console.log(`🔔 Transfer Notification: Order ${orderId} transferred to branch_${toBranchId}`);
  return res.json({ success: true });
});

app.post("/api/notify/transfer-rejected", validateApiKey, (req, res) => {
  const { orderId, fromBranchId, rejectionBranchId, reason } = req.body || {};

  if (!orderId || !fromBranchId || !rejectionBranchId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Notify source branch
  io.to(`branch_${fromBranchId}`).emit("TRANSFER_REJECTED", {
    orderId,
    rejectedBy: rejectionBranchId,
    reason,
    timestamp: new Date(),
  });

  // Admin notification
  io.to("admin_global").emit("TRANSFER_REJECTION_LOG", {
    orderId,
    rejectionBranchId,
    fromBranchId,
    reason,
    timestamp: new Date(),
  });

  console.log(`🔔 Transfer Rejection: Order ${orderId} rejected by branch_${rejectionBranchId}`);
  return res.json({ success: true });
});

// ─── REFUND NOTIFICATION ENDPOINTS ────────────────────────────────────────
app.post("/api/notify/refund", validateApiKey, (req, res) => {
  const { orderId, customerId, amount, reason } = req.body || {};

  if (!orderId || !customerId) {
    return res.status(400).json({ success: false, message: "orderId and customerId are required" });
  }

  if (isDuplicate(`refund_${orderId}`)) return res.json({ success: true, cached: true });

  // Notify customer
  io.to(`user_${customerId}`).emit("REFUND_INITIATED", {
    orderId,
    amount,
    reason,
    message: "Refund initiated successfully. Check your account.",
    timestamp: new Date(),
  });

  // Admin notification
  io.to("admin_global").emit("REFUND_LOG", {
    orderId,
    customerId,
    amount,
    reason,
    timestamp: new Date(),
  });

  console.log(`🔔 Refund Notification: Refund initiated for order ${orderId}`);
  return res.json({ success: true });
});

// ─── INVENTORY NOTIFICATION ENDPOINTS ─────────────────────────────────────
app.post("/api/notify/inventory", validateApiKey, (req, res) => {
  const { branchId, productId, quantity, status } = req.body || {};

  if (!branchId || !productId) {
    return res.status(400).json({ success: false, message: "branchId and productId are required" });
  }

  // Notify branch managers
  io.to(`branch_${branchId}`).emit("INVENTORY_CHANGED", {
    productId,
    quantity,
    status,
    timestamp: new Date(),
  });

  // Alert admins for critical stock issues
  if (status === "OUT_OF_STOCK") {
    io.to("admin_global").emit("LOW_STOCK_ALERT", {
      branchId,
      productId,
      quantity,
      timestamp: new Date(),
    });
  }

  console.log(`🔔 Inventory Notification: Branch ${branchId}, Product ${productId}`);
  return res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`⚡ Secured Socket.IO server running on port ${PORT}`);
});
