const fs = require('fs');
const files = [
  'src/app/checkout/page.tsx',
  'src/app/orders/page.tsx',
  'src/app/orders/[id]/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // Use a regex to find adjacent className attributes and merge them
  c = c.replace(/className="([^"]+)"\s+className="([^"]+)"/g, 'className="$1 $2"');
  fs.writeFileSync(f, c);
  console.log('Fixed ' + f);
});
