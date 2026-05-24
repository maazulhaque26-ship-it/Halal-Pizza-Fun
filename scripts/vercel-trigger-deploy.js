/**
 * Triggers a Vercel production deployment from the latest GitHub commit.
 * Run: node scripts/vercel-trigger-deploy.js
 */
const { execSync } = require("child_process");

const TOKEN   = "vca_4g01I69MueSvSt71Dg06eYx1QbSLdGPfcE5d9Qkn3RnaGGRBTd11ymXB";
const PROJECT = "prj_FcVDar9vZA1qv29Y9W7hB9AdyBo8";
const TEAM    = "team_vU4cTMgLj0VGFHlCeMW3wggt";
const REPO_ID = "994416098";

async function main() {
  const sha = execSync("git rev-parse HEAD").toString().trim();
  console.log("Triggering production deploy for SHA:", sha);

  const res = await fetch(
    `https://api.vercel.com/v13/deployments?teamId=${TEAM}&projectId=${PROJECT}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "food-delivery",
        gitSource: {
          type: "github",
          repoId: REPO_ID,
          ref: "master",
          sha,
        },
        target: "production",
      }),
    }
  );

  const body = await res.json();

  if (!res.ok) {
    console.error("Deploy failed:", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("\nDeploy queued!");
  console.log("  ID     :", body.id);
  console.log("  URL    :", body.url ? `https://${body.url}` : "(pending)");
  console.log("  Status :", body.status);
  console.log("\nTrack it at: https://vercel.com/maazulhaque26-ship-its-projects/food-delivery");
}

main().catch(err => { console.error(err); process.exit(1); });
