const fs = require('fs');
const file = 'src/app/menu/page.tsx';

let c = fs.readFileSync(file, 'utf8');

// Global backgrounds
c = c.replace(/bg-background/g, 'bg-[#fff4e4] text-[#2b160c]');
c = c.replace(/bg-linear-to-b from-\[#070f20\] to-background/g, 'bg-[#fffaf2]');
c = c.replace(/bg-\[radial-gradient\(ellipse_at_top,rgba\(212,175,55,0\.08\),transparent_60%\)\]/g, 'bg-[radial-gradient(ellipse_at_top,rgba(239,90,36,0.05),transparent_60%)]');
c = c.replace(/bg-primary\/10 blur-\[100px\]/g, 'bg-[#ef5a24]/5 blur-[100px]');

// Text colors
c = c.replace(/text-white\/70/g, 'text-[#6d5342]');
c = c.replace(/text-white\/60/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/50/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/40/g, 'text-[#8f6b52]');
c = c.replace(/text-white\/30/g, 'text-[#8f6b52]/80');
c = c.replace(/text-white/g, 'text-[#2b160c]');
c = c.replace(/text-gradient/g, 'text-[#ef5a24]');

// Primary colors
c = c.replace(/text-primary/g, 'text-[#ef5a24]');
c = c.replace(/bg-primary text-\[#2b160c\]/g, 'bg-[#ef5a24] text-white'); // It replaced text-black with text-[#2b160c] in previous pass if any, actually text-black was not replaced by global, wait: `text-black` was replaced? No.
c = c.replace(/bg-primary text-black/g, 'bg-[#ef5a24] text-white shadow-[0_6px_0_#9b3214]');
c = c.replace(/bg-primary/g, 'bg-[#ef5a24]');
c = c.replace(/border-primary\/30/g, 'border-[#ef5a24]/30');
c = c.replace(/border-primary\/40/g, 'border-[#ef5a24]/40');
c = c.replace(/border-primary/g, 'border-[#ef5a24]');
c = c.replace(/ring-primary\/20/g, 'ring-[#ef5a24]/20');
c = c.replace(/shadow-primary\/25/g, 'shadow-[#9b3214]');

// Inputs, cards, borders
c = c.replace(/bg-white\/5/g, 'bg-white');
c = c.replace(/border-white\/10/g, 'border-[#ead8c1]');
c = c.replace(/placeholder:text-\[#2b160c\]\/30/g, 'placeholder:text-[#8f6b52]');

// Fonts and Headings
c = c.replace(/text-3xl md:text-6xl font-black text-\[#2b160c\]/g, 'font-playfair text-4xl md:text-7xl font-black text-[#2b160c]');

// Fix duplicate shadow issue if any
c = c.replace(/shadow-lg shadow-\[#9b3214\]/g, 'shadow-[0_4px_0_#9b3214] translate-y-[-2px]');

fs.writeFileSync(file, c);
console.log('Menu UI updated!');
