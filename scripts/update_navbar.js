const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// The isLightPage classes
// "bg-background/95 backdrop-blur-md shadow-sm border-b border-white/8 py-3" -> "bg-[#fff4e4]/95 backdrop-blur-md shadow-sm border-b border-[#ead8c1] py-3 text-[#2b160c]"
c = c.replace(/"bg-background\/95 backdrop-blur-md shadow-sm border-b border-white\/8 py-3"/g, '"bg-[#fff4e4]/95 backdrop-blur-md shadow-sm border-b border-[#ead8c1] py-3"');

// "bg-background/90 backdrop-blur-sm border-b border-white/5" -> "bg-[#fff4e4]/90 backdrop-blur-sm border-b border-[#ead8c1]"
c = c.replace(/"bg-background\/90 backdrop-blur-sm border-b border-white\/5"/g, '"bg-[#fff4e4]/90 backdrop-blur-sm border-b border-[#ead8c1]"');

// The text colors in nav links
// isLightPage text might be hardcoded as text-white/90. Let's make it dynamic or just use the light theme for everything?
// Actually, if we use a light theme, we need the text to be dark.
c = c.replace(/text-white\/90/g, 'text-[#2b160c]/90');
c = c.replace(/"text-white"/g, 'isLightPage ? "text-[#2b160c]" : "text-white"');
c = c.replace(/"text-white hover:bg-white\/10"/g, 'isLightPage ? "text-[#2b160c] hover:bg-[#2b160c]/5" : "text-white hover:bg-white/10"');
c = c.replace(/"bg-white\/10 text-white hover:bg-white\/20 border border-white\/5"/g, 'isLightPage ? "bg-[#2b160c]/5 text-[#2b160c] hover:bg-[#2b160c]/10 border border-[#ead8c1]" : "bg-white/10 text-white hover:bg-white/20 border border-white/5"');

// User Menu modal
c = c.replace(/"absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl shadow-xl border border-white\/10 overflow-hidden z-50 animate-fade-in"/g, 'isLightPage ? "absolute right-0 top-full mt-2 w-52 bg-[#fffaf2] rounded-2xl shadow-[0_18px_46px_rgba(73,40,18,0.08)] border border-[#ead8c1] overflow-hidden z-50 animate-fade-in" : "absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50 animate-fade-in"');

// Text inside the user menu modal
c = c.replace(/text-gray-200/g, 'text-gray-500'); // make it readable in both? Or use template literal? Just let it be, it's mostly ok.

fs.writeFileSync('src/components/Navbar.tsx', c);
console.log('Navbar updated');
