const fs = require('fs');
let c = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// Global Background
c = c.replace(/bg-background/g, 'bg-[#fff4e4]');

// Inputs
c = c.replace(/bg-\[#0d1117\] border border-white\/10/g, 'bg-white border border-[#ead8c1]');
c = c.replace(/text-white placeholder:text-white\/25/g, 'text-[#2b160c] placeholder:text-[#8f6b52]');
c = c.replace(/focus:ring-primary\/20 focus:border-primary\/50/g, 'focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/50');

// Typography
c = c.replace(/text-2xl sm:text-3xl font-black text-white/g, 'font-playfair text-3xl sm:text-4xl font-black text-[#2b160c]');
c = c.replace(/text-white\/40/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/60/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/80/g, 'text-[#2b160c]/80');
c = c.replace(/text-white\/30/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/6/g, 'text-[#ead8c1]');
c = c.replace(/border-white\/6/g, 'border-[#ead8c1]');
c = c.replace(/border-white\/10/g, 'border-[#ead8c1]');
c = c.replace(/bg-white\/5/g, 'bg-[#fffaf2]');
c = c.replace(/bg-white\/10/g, 'bg-[#ead8c1]/30');
c = c.replace(/bg-white\/3/g, 'bg-black/5');
c = c.replace(/text-white/g, 'text-[#2b160c]');

// Primary colors
c = c.replace(/text-primary/g, 'text-[#ef5a24]');
c = c.replace(/bg-primary text-black/g, 'bg-[#ef5a24] text-white shadow-md');
c = c.replace(/bg-primary/g, 'bg-[#ef5a24]');
c = c.replace(/border-primary\/40/g, 'border-[#ef5a24]/40');
c = c.replace(/border-primary\/25/g, 'border-[#ef5a24]/25');
c = c.replace(/border-primary/g, 'border-[#ef5a24]');

// Remove dark styles and add light classes to the motion.div components
c = c.replace(/className="rounded-2xl p-6"\s*style=\{\{ background: "#111827", border: "1px solid rgba\(255,255,255,0\.08\)" \}\}/g, 'className="rounded-2xl p-6 bg-[#fffaf2] border border-[#ead8c1] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"');
c = c.replace(/className="rounded-2xl overflow-hidden"\s*style=\{\{ background: "#111827", border: "1px solid rgba\(255,255,255,0\.08\)" \}\}/g, 'className="rounded-2xl overflow-hidden bg-[#fffaf2] border border-[#ead8c1] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"');

fs.writeFileSync('src/app/profile/page.tsx', c);
console.log('Profile UI updated');
