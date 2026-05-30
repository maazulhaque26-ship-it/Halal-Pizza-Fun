const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

c = c.replace(/"text-white\/90"/g, 'isLightPage ? "text-[#2b160c]/90" : "text-white/90"');
c = c.replace(/"text-white hover:bg-white\/10"/g, 'isLightPage ? "text-[#2b160c] hover:bg-[#2b160c]/10" : "text-white hover:bg-white/10"');
c = c.replace(/"bg-white\/10 text-white hover:bg-white\/20 border border-white\/5"/g, 'isLightPage ? "bg-white text-[#2b160c] hover:bg-white/80 border border-[#ead8c1]" : "bg-white/10 text-white hover:bg-white/20 border border-white/5"');
c = c.replace(/border-white\/20/g, 'isLightPage ? "border-[#ead8c1]" : "border-white/20"');

// Specifically for the text-white string, avoid replacing it if it's already part of a conditional
// Instead of a global replace, I'll do a safe regex
c = c.replace(/,\s*"text-white"\)/g, ', isLightPage ? "text-[#2b160c]" : "text-white")');

fs.writeFileSync('src/components/Navbar.tsx', c);
console.log('Fixed Navbar colors for light mode');
