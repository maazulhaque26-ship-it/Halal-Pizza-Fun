// Tests ALL possible SMTP configs for GoDaddy Professional Email (Titan)
import nodemailer from "nodemailer";
import fs from "fs";
import net from "net";

let pass = "", user = "info@pizzafun.co.in";
const lines = fs.readFileSync(".vercel/.env.production.local", "utf8").split("\n");
for (const line of lines) {
  if (line.startsWith("EMAIL_PASS=")) {
    pass = line.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim();
  }
}
console.log("User:", user, "| Pass length:", pass.length, "\n");

async function tcpCheck(host, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(4000);
    s.connect(port, host, () => { s.destroy(); resolve(true); });
    s.on("error", () => resolve(false));
    s.on("timeout", () => { s.destroy(); resolve(false); });
  });
}

const configs = [
  // Titan (official)
  { label: "Titan  465 SSL",     host: "smtp.titan.email",          port: 465, secure: true,  authMethod: undefined },
  { label: "Titan  587 TLS",     host: "smtp.titan.email",          port: 587, secure: false, authMethod: undefined },
  { label: "Titan  465 LOGIN",   host: "smtp.titan.email",          port: 465, secure: true,  authMethod: "LOGIN"   },
  { label: "Titan  587 LOGIN",   host: "smtp.titan.email",          port: 587, secure: false, authMethod: "LOGIN"   },
  // GoDaddy legacy SMTP (secureserver)
  { label: "GoDaddy 465 SSL",    host: "smtpout.secureserver.net",  port: 465, secure: true,  authMethod: undefined },
  { label: "GoDaddy 587 TLS",    host: "smtpout.secureserver.net",  port: 587, secure: false, authMethod: undefined },
  { label: "GoDaddy 80",         host: "smtpout.secureserver.net",  port: 80,  secure: false, authMethod: undefined },
  // Flock (Titan parent)
  { label: "Flock  465 SSL",     host: "smtp.flockmail.com",        port: 465, secure: true,  authMethod: undefined },
  { label: "Flock  587 TLS",     host: "smtp.flockmail.com",        port: 587, secure: false, authMethod: undefined },
];

let success = false;
for (const cfg of configs) {
  const reachable = await tcpCheck(cfg.host, cfg.port);
  if (!reachable) {
    console.log(`⛔ ${cfg.label.padEnd(20)} — TCP unreachable`);
    continue;
  }
  process.stdout.write(`🔄 ${cfg.label.padEnd(20)} — `);
  try {
    const t = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user, pass },
      ...(cfg.authMethod ? { authMethod: cfg.authMethod } : {}),
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
    await t.verify();
    console.log("✅ AUTH SUCCESS!");

    const info = await t.sendMail({
      from: `"Halal Pizza Fun" <${user}>`,
      to: user,
      subject: "✅ Titan Mail Working! — " + cfg.label,
      html: `<h2>Email works via ${cfg.label}!</h2><p>${new Date().toISOString()}</p>`,
    });
    console.log(`✅ Email sent! ID: ${info.messageId}`);
    console.log(`\n🎯 USE THESE SETTINGS:\n   HOST: ${cfg.host}\n   PORT: ${cfg.port}\n   SECURE: ${cfg.secure}\n`);
    success = true;
    break;
  } catch (err) {
    console.log(`❌ ${err.message.slice(0, 80)}`);
  }
}

if (!success) {
  console.log("\n❌ No config worked. The SMTP password for info@pizzafun.co.in may need to be reset.");
  console.log("   Try: GoDaddy → Professional Email → Manage → Reset Password → set brand new password.");
}
