const fs = require('fs');
const path = require('path');

function fix(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      fix(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      let d = c.replace(/>\s*\$\{/g, '>₹{')
               .replace(/>\s*\-\$\{/g, '>-₹{')
               .replace(/:\s*`\$\{(.*?)\}`/g, ':`₹${$1}`')
               .replace(/"\$\{(.*?)\}"/g, '"₹{$1}"')
               .replace(/Place Order · \$\{/g, 'Place Order · ₹{');
      if (c !== d) {
        fs.writeFileSync(p, d);
        console.log('Fixed:', p);
      }
    }
  });
}

fix(path.join(__dirname, "..", "src"));
