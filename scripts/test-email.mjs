// Quick SMTP connection test — run with: node scripts/test-email.mjs
import nodemailer from "nodemailer";
import fs from "fs";

// Read password from local env file
let pass = "";
const lines = fs.readFileSync(".vercel/.env.production.local", "utf8").split("\n");
for (const line of lines) {
  if (line.startsWith("EMAIL_PASS=")) {
    pass = line.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim();
  }
}

const user = "info@pizzafun.co.in";
console.log("User:", user);
console.log("Pass set:", !!pass, "(length:", pass.length, ")\n");

// Test both ports
const configs = [
  { label: "Port 465 (SSL)",     host: "smtp.titan.email", port: 465, secure: true  },
  { label: "Port 587 (STARTTLS)",host: "smtp.titan.email", port: 587, secure: false },
];

for (const cfg of configs) {
  process.stdout.write(`Testing ${cfg.label}... `);
  try {
    const t = nodemailer.createTransport({ ...cfg, auth: { user, pass } });
    await t.verify();
    console.log("✅ SUCCESS");

    const info = await t.sendMail({
      from: `"Halal Pizza Fun" <${user}>`,
      to: user,
      subject: "✅ Titan Mail Test — Production Ready",
      html: `<h2>Email working on ${cfg.label}!</h2><p>Time: ${new Date().toISOString()}</p>`,
    });
    console.log(`✅ Test email sent! Message ID: ${info.messageId}`);
    console.log(`\n👉 Use PORT=${cfg.port}, SECURE=${cfg.secure} in your env vars.\n`);
    process.exit(0);
  } catch (err) {
    console.log("❌ FAILED —", err.message.slice(0, 120));
  }
}

console.log("\n❌ All ports failed. Likely causes:");
console.log("  1. Wrong password — verify by logging into Titan webmail at https://mail.titan.email");
console.log("  2. Titan mailbox not activated yet — check GoDaddy email dashboard");
console.log("  3. SMTP not enabled on the Titan plan");
process.exit(1);
