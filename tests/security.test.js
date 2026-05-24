const { io } = require("socket.io-client");
const jwt = require("jsonwebtoken");
const assert = require("assert");
require("dotenv").config({ path: ".env.local" });

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev_secret_key";
const SOCKET_API_KEY = process.env.SOCKET_API_KEY || "dev_socket_api_key_123";

// Generate Helper Tokens
const makeToken = (id, role, branchId) => {
  return jwt.sign({ id, role, branchId }, JWT_SECRET, { expiresIn: "1h" });
};

async function runTests() {
  console.log("🛡️ Starting Security Integration Tests for Realtime System...");
  let exitCode = 0;

  // Test 1: Reject connection without token
  try {
    await new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        reconnection: false,
        auth: {}
      });
      socket.on("connect", () => {
        socket.disconnect();
        reject(new Error("Allowed connection without token!"));
      });
      socket.on("connect_error", (err) => {
        assert.strictEqual(err.message, "Authentication error: Token is required");
        socket.disconnect();
        resolve();
      });
    });
    console.log("✅ Test 1 Passed: Connection rejected without token.");
  } catch (err) {
    console.error("❌ Test 1 Failed:", err.message);
    exitCode = 1;
  }

  // Test 2: Reject connection with invalid signature
  try {
    await new Promise((resolve, reject) => {
      const badToken = jwt.sign({ id: "123", role: "CUSTOMER" }, "wrong_secret");
      const socket = io(SOCKET_URL, {
        reconnection: false,
        auth: { token: badToken }
      });
      socket.on("connect", () => {
        socket.disconnect();
        reject(new Error("Allowed connection with invalid JWT signature!"));
      });
      socket.on("connect_error", (err) => {
        assert.ok(err.message.includes("Invalid or expired token"));
        socket.disconnect();
        resolve();
      });
    });
    console.log("✅ Test 2 Passed: Connection rejected with invalid JWT signature.");
  } catch (err) {
    console.error("❌ Test 2 Failed:", err.message);
    exitCode = 1;
  }

  // Test 3: Customer cannot join admin room
  try {
    await new Promise((resolve, reject) => {
      const customerToken = makeToken("cust_01", "CUSTOMER", null);
      const socket = io(SOCKET_URL, {
        reconnection: false,
        auth: { token: customerToken }
      });

      socket.on("connect", () => {
        socket.emit("join_admin");
        socket.on("error", (err) => {
          assert.strictEqual(err.message, "Unauthorized room access");
          socket.disconnect();
          resolve();
        });
        setTimeout(() => {
          socket.disconnect();
          reject(new Error("Customer joined admin room without restriction!"));
        }, 1500);
      });
    });
    console.log("✅ Test 3 Passed: Customer blocked from joining admin room.");
  } catch (err) {
    console.error("❌ Test 3 Failed:", err.message);
    exitCode = 1;
  }

  // Test 4: Branch Manager cannot join another branch room
  try {
    await new Promise((resolve, reject) => {
      const managerToken = makeToken("mgr_01", "BRANCH_MANAGER", "branch_west");
      const socket = io(SOCKET_URL, {
        reconnection: false,
        auth: { token: managerToken }
      });

      socket.on("connect", () => {
        // Attempt to join branch_east instead of branch_west
        socket.emit("join_branch", "branch_east");
        socket.on("error", (err) => {
          assert.strictEqual(err.message, "Unauthorized room access");
          socket.disconnect();
          resolve();
        });
        setTimeout(() => {
          socket.disconnect();
          reject(new Error("Manager allowed to join arbitrary branch room!"));
        }, 1500);
      });
    });
    console.log("✅ Test 4 Passed: Manager blocked from joining other branch room.");
  } catch (err) {
    console.error("❌ Test 4 Failed:", err.message);
    exitCode = 1;
  }

  // Test 5: Super Admin can join admin global
  try {
    await new Promise((resolve, reject) => {
      const adminToken = makeToken("admin_01", "SUPER_ADMIN", null);
      const socket = io(SOCKET_URL, {
        reconnection: false,
        auth: { token: adminToken }
      });

      socket.on("connect", () => {
        socket.emit("join_admin");
        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 1000);
      });
    });
    console.log("✅ Test 5 Passed: Super Admin authorized to join admin room.");
  } catch (err) {
    console.error("❌ Test 5 Failed:", err.message);
    exitCode = 1;
  }

  // Test 6: REST API Key protection
  try {
    const res = await fetch(`${SOCKET_URL}/api/notify/new-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId: "b1", orderId: "o1" })
    });
    assert.strictEqual(res.status, 401);
    console.log("✅ Test 6 Passed: REST API reject call without API Key.");
  } catch (err) {
    console.error("❌ Test 6 Failed:", err.message);
    exitCode = 1;
  }

  // Test 7: REST API authorization with valid key
  try {
    const res = await fetch(`${SOCKET_URL}/api/notify/new-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SOCKET_API_KEY
      },
      body: JSON.stringify({ branchId: "b1", orderId: "o1" })
    });
    assert.strictEqual(res.status, 200);
    console.log("✅ Test 7 Passed: REST API accepts call with valid API Key.");
  } catch (err) {
    console.error("❌ Test 7 Failed:", err.message);
    exitCode = 1;
  }

  console.log(`\n🏁 Test Run Finished. Exit code: ${exitCode}`);
  process.exit(exitCode);
}

// Only execute tests if the socket server is running
fetch(SOCKET_URL)
  .then(() => runTests())
  .catch((err) => {
    console.error(`❌ Socket server at ${SOCKET_URL} is offline. Start it via 'npm run socket' first!`);
    process.exit(1);
  });
