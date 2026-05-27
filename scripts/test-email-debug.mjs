// Verbose SMTP debug — shows full server conversation
import nodemailer from "nodemailer";
import fs from "fs";
import net from "net";

// Read from local env file
let pass = "", user = "info@pizzafun.co.in";
const lines = fs.readFileSync(".vercel/.env.production.local", "utf8").split("\n");
for (const line of lines) {
  if (line.startsWith("EMAIL_PASS=")) {
    pass = line.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim();
  }
}
console.log("User:", user);
console.log("Pass length:", pass.length);
console.log("Pass value:", pass);  // print for verification
console.log("---\n");

// Step 1: raw TCP connectivity check
async function tcpCheck(host, port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(5000);
    sock.connect(port, host, () => { sock.destroy(); resolve(true); });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => { sock.destroy(); resolve(false); });
  });
}

console.log("Checking TCP connectivity to smtp.titan.email...");
const c465 = await tcpCheck("smtp.titan.email", 465);
const c587 = await tcpCheck("smtp.titan.email", 587);
console.log("  Port 465 reachable:", c465 ? "✅ YES" : "❌ NO");
console.log("  Port 587 reachable:", c587 ? "✅ YES" : "❌ NO");
console.log("");

if (!c465 && !c587) {
  console.log("❌ Cannot reach smtp.titan.email on any port.");
  console.log("   → Firewall or ISP is blocking outbound SMTP.");
  console.log("   → Vercel also blocks direct SMTP — you must use a relay.");
  process.exit(1);
}

// Step 2: verbose nodemailer test
const port = c465 ? 465 : 587;
const transporter = nodemailer.createTransport({
  host: "smtp.titan.email",
  port,
  secure: port === 465,
  auth: { user, pass },
  debug: true,
  logger: true,
});

console.log(`\nAttempting SMTP auth on port ${port}...\n`);
try {
  await transporter.verify();
  console.log("\n✅ SMTP AUTH SUCCESSFUL!\n");

  const info = await transporter.sendMail({
    from: `"Halal Pizza Fun" <${user}>`,
    to: user,
    subject: "✅ Titan Mail Working!",
    html: `<h2>Email works!</h2><p>${new Date().toISOString()}</p>`,
  });
  console.log("✅ Email sent! ID:", info.messageId);
} catch (err) {
  console.error("\n❌ AUTH FAILED:", err.message);
  if (err.responseCode) console.error("   Server response code:", err.responseCode);
  if (err.response) console.error("   Server response:", err.response);
}
