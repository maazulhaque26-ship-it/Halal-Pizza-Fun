const fs = require("fs");
const path = require("path");

function fixTemplateLiterals(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixTemplateLiterals(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      
      let newContent = content.replace(/₹\{/g, "${");

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, "utf-8");
        console.log("Fixed:", fullPath);
      }
    }
  }
}

fixTemplateLiterals(path.join(__dirname, "..", "src"));
