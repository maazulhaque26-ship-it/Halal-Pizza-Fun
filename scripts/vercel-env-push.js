/**
 * One-shot: pushes all .env.local vars into the Vercel project via REST API.
 * Run: node scripts/vercel-env-push.js
 */
const fs = require("fs");
const path = require("path");

const TOKEN    = "vca_4g01I69MueSvSt71Dg06eYx1QbSLdGPfcE5d9Qkn3RnaGGRBTd11ymXB";
const PROJECT  = "prj_FcVDar9vZA1qv29Y9W7hB9AdyBo8";
const TEAM     = "team_vU4cTMgLj0VGFHlCeMW3wggt";
const ENV_FILE = path.join(__dirname, "..", ".env.local");
const TARGET   = ["production"];

// Public vars are baked at build time — use plain type
const PUBLIC_PREFIXES = ["NEXT_PUBLIC_", "NODE_ENV"];

function parseEnv(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const vars = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Skip masked placeholders
    if (value === "**********" || value === "") continue;
    vars[key] = value;
  }
  return vars;
}

async function upsertVar(key, value) {
  const type = PUBLIC_PREFIXES.some(p => key.startsWith(p)) ? "plain" : "encrypted";

  // First try to create; if conflict (409) update instead
  const createRes = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, type, target: TARGET }),
    }
  );

  if (createRes.ok) {
    console.log(`  ✓ created  ${key}`);
    return;
  }

  const createBody = await createRes.json();

  if (createRes.status === 400 && createBody.error?.code === "ENV_ALREADY_EXISTS") {
    // Fetch existing ID then patch
    const listRes = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const listBody = await listRes.json();
    const existing = (listBody.envs || []).find(
      e => e.key === key && e.target.includes("production")
    );
    if (!existing) { console.log(`  ? skipped  ${key} (not found after conflict)`); return; }

    const patchRes = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value, type, target: TARGET }),
      }
    );
    if (patchRes.ok) {
      console.log(`  ↺ updated  ${key}`);
    } else {
      const pb = await patchRes.json();
      console.log(`  ✗ failed   ${key}: ${JSON.stringify(pb.error)}`);
    }
    return;
  }

  console.log(`  ✗ failed   ${key}: ${JSON.stringify(createBody.error)}`);
}

async function main() {
  const vars = parseEnv(ENV_FILE);

  // Override localhost URLs with production placeholders (user will update after first deploy)
  vars["NEXTAUTH_URL"]           = "https://food-delivery-maazulhaque26-ship-its-projects.vercel.app";
  vars["NEXT_PUBLIC_APP_URL"]    = "https://food-delivery-maazulhaque26-ship-its-projects.vercel.app";
  vars["NEXT_PUBLIC_SOCKET_URL"] = "https://hpf-socket-server.onrender.com";
  vars["NODE_ENV"]               = "production";
  vars["VAPID_SUBJECT"]          = "mailto:maazulhaque26@gmail.com";

  console.log(`\nPushing ${Object.keys(vars).length} env vars to Vercel project [${PROJECT}]...\n`);

  for (const [key, value] of Object.entries(vars)) {
    await upsertVar(key, value);
  }

  console.log("\nDone. Remember to update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL after your first deploy.");
}

main().catch(console.error);
