/**
 * Pushes all .env.local vars into the linked Vercel project via REST API.
 * Run: node scripts/vercel-env-push.js
 */
const fs = require("fs");
const path = require("path");

// Read token from Vercel auth file
let TOKEN, PROJECT, TEAM;
try {
  const auth = JSON.parse(fs.readFileSync(
    path.join(process.env.APPDATA || process.env.HOME, "xdg.data/com.vercel.cli/auth.json"), "utf8"
  ));
  TOKEN = auth.token;
} catch {
  TOKEN = process.env.VERCEL_TOKEN;
}

try {
  const proj = JSON.parse(fs.readFileSync(
    path.join(__dirname, "..", ".vercel", "project.json"), "utf8"
  ));
  PROJECT = proj.projectId;
  TEAM    = proj.orgId;
} catch {
  console.error("No .vercel/project.json found"); process.exit(1);
}

const ENV_FILE = path.join(__dirname, "..", ".env.local");
const TARGET   = ["production", "preview"];
const PUBLIC   = ["NEXT_PUBLIC_", "NODE_ENV"];

function parseEnv(file) {
  const vars = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (val && val !== "**********") vars[key] = val;
  }
  return vars;
}

async function upsert(key, value) {
  const type = PUBLIC.some(p => key.startsWith(p)) ? "plain" : "encrypted";
  const r = await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, type, target: TARGET }),
  });
  const b = await r.json();
  if (r.ok) { console.log("  ✓", key); return; }
  if (b.error?.code === "ENV_ALREADY_EXISTS") {
    // patch existing
    const list = await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json());
    const ex = (list.envs || []).find(e => e.key === key && e.target.some(t => TARGET.includes(t)));
    if (!ex) { console.log("  ?", key, "(conflict but not found)"); return; }
    const p = await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env/${ex.id}?teamId=${TEAM}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value, type, target: TARGET }),
    });
    if (p.ok) console.log("  ↺", key); else console.log("  ✗", key, (await p.json()).error?.message);
    return;
  }
  console.log("  ✗", key, b.error?.message);
}

async function main() {
  const vars = parseEnv(ENV_FILE);

  // Production overrides
  const PROD_URL    = "https://halal-pizza-fun.vercel.app";
  const SOCKET_URL  = "https://hpf-socket-server.onrender.com";
  const SOCKET_KEY  = "N0GB3olCdF9WjrrecHLv8Aawr/bXn3Prss3HB/hN5L0=";

  vars["NODE_ENV"]               = "production";
  vars["NEXT_PUBLIC_APP_URL"]    = PROD_URL;
  vars["NEXTAUTH_URL"]           = PROD_URL;
  vars["NEXT_PUBLIC_SOCKET_URL"] = SOCKET_URL;
  vars["SOCKET_API_KEY"]         = SOCKET_KEY;
  vars["VAPID_SUBJECT"]          = "mailto:pizzafunindia@gmail.com";

  console.log(`\nPushing ${Object.keys(vars).length} env vars → ${PROJECT}\n`);
  for (const [k, v] of Object.entries(vars)) await upsert(k, v);
  console.log("\nDone.");
}

main().catch(console.error);
