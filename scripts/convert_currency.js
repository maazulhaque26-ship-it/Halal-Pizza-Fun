const fs = require("fs");
const path = require("path");

function replaceDollarWithRupee(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceDollarWithRupee(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      
      // Specifically target dollar signs used as currency in UI strings.
      // Avoid replacing template literal $ like `${var}`
      // This regex replaces $ followed by { or numbers ONLY when it's meant to be currency.
      // Actually, since there are many hardcoded $, we can just do a precise replace for each file.
      let newContent = content;

      // For components
      newContent = newContent.replace(/>\$/g, ">₹"); // >$10
      newContent = newContent.replace(/ \$/g, " ₹"); //  $10
      newContent = newContent.replace(/"\$/g, "\"₹"); // "$10"
      newContent = newContent.replace(/:\s*\$/g, ": ₹"); // : $
      newContent = newContent.replace(/-\$/g, "-₹"); // -$10
      newContent = newContent.replace(/`\$\$\{/g, "`₹${"); // `$${val}` -> `₹${val}`
      newContent = newContent.replace(/\$\$\{/g, "₹${"); // $${val} -> ₹${val} (in TSX text)
      newContent = newContent.replace(/\$([0-9]+)/g, "₹$1"); // $10 -> ₹10

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, "utf-8");
        console.log("Updated:", fullPath);
      }
    }
  }
}

replaceDollarWithRupee(path.join(__dirname, "..", "src"));
