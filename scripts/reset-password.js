/**
 * Emergency password reset script
 * Usage:  node scripts/reset-password.js <email> <newPassword>
 * Example: node scripts/reset-password.js info@pizzafun.co.in NewPass@123
 *
 * Reads MONGODB_URI from .env.local (or .env) automatically.
 */
const path = require("path");
const fs   = require("fs");

// ── Load .env.local / .env manually (no dotenv dependency needed) ──────────
function loadEnv(file) {
  const fullPath = path.join(__dirname, "..", file);
  if (!fs.existsSync(fullPath)) return;
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([\w]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(".env.local");
loadEnv(".env");

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

async function main() {
  const [,, email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error("Usage: node scripts/reset-password.js <email> <newPassword>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in environment. Check your .env.local file.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.");

  const db  = mongoose.connection.db;
  const col = db.collection("users");

  const user = await col.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.role})`);

  const hash = await bcrypt.hash(newPassword, 10);
  await col.updateOne({ _id: user._id }, { $set: { password: hash, updatedAt: new Date() } });

  console.log(`✓ Password for ${email} has been reset successfully.`);
  console.log(`  New password: ${newPassword}`);
  console.log("\nYou can now log in with the new password.");

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
