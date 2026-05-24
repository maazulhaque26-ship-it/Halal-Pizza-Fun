/**
 * Creates the hpf-socket-server Web Service on Render and sets all env vars.
 * Run: node scripts/render-deploy.js
 */
const fs = require("fs");
const path = require("path");

const RENDER_TOKEN = "rnd_9CHWWePPzNOxNjK7wyYKifpjZkbr";
const OWNER_ID     = "tea-d89k649kh4rs738m76b0";
const REPO_URL     = "https://github.com/maazulhaque26-ship-it/Halal-Pizza-Fun";
const FRONTEND_URL = "https://food-delivery-five-virid.vercel.app";

const H = {
  Authorization: `Bearer ${RENDER_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

function parseEnv(filePath) {
  const vars = {};
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    if (value && value !== "**********") vars[key] = value;
  }
  return vars;
}

function generateKey(len = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function main() {
  const localEnv = parseEnv(path.join(__dirname, "..", ".env.local"));
  const socketApiKey = generateKey(48);

  const envVars = [
    { key: "NODE_ENV",         value: "production" },
    { key: "FRONTEND_URL",     value: FRONTEND_URL },
    { key: "NEXTAUTH_SECRET",  value: localEnv.NEXTAUTH_SECRET },
    { key: "JWT_SECRET",       value: localEnv.JWT_SECRET },
    { key: "SOCKET_API_KEY",   value: socketApiKey },
  ];

  console.log("Creating hpf-socket-server on Render...\n");

  const res = await fetch("https://api.render.com/v1/services", {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      type: "web_service",
      name: "hpf-socket-server",
      ownerId: OWNER_ID,
      repo: REPO_URL,
      branch: "master",
      autoDeploy: "yes",
      serviceDetails: {
        runtime: "node",
        plan: "free",
        region: "singapore",
        buildCommand: "npm install --omit=dev",
        startCommand: "node socket-server.js",
        healthCheckPath: "/health",
        envSpecificDetails: {
          buildCommand: "npm install --omit=dev",
          startCommand: "node socket-server.js",
        },
        envVars,
      },
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error("Failed to create service:", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const svc = body.service || body;
  console.log("Service created!");
  console.log("  ID  :", svc.id);
  console.log("  Name:", svc.name);
  console.log("  URL :", svc.serviceDetails?.url || "(deploying...)");
  console.log("\nSOCKET_API_KEY (copy to Vercel env vars):", socketApiKey);
  console.log("\nDashboard: https://dashboard.render.com/web/" + svc.id);
  console.log("\nOnce Render finishes deploying, add to Vercel env:");
  console.log("  NEXT_PUBLIC_SOCKET_URL = https://" + svc.name + ".onrender.com");
  console.log("  SOCKET_API_KEY         =", socketApiKey);
}

main().catch(err => { console.error(err); process.exit(1); });
