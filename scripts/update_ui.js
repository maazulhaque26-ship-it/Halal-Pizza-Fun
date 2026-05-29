const fs = require('fs');

const files = [
  'src/app/checkout/page.tsx',
  'src/app/orders/page.tsx',
  'src/app/orders/[id]/page.tsx'
];

function transformContent(content) {
  // Global background
  content = content.replace(/bg-background/g, 'bg-[#fff4e4] text-[#2b160c]');
  
  // Text colors
  content = content.replace(/text-white\/90/g, 'text-[#2b160c]');
  content = content.replace(/text-white\/80/g, 'text-[#2b160c]/80');
  content = content.replace(/text-white\/55/g, 'text-[#8f6b52]');
  content = content.replace(/text-white\/50/g, 'text-[#8f6b52]');
  content = content.replace(/text-white\/40/g, 'text-[#8f6b52]');
  content = content.replace(/text-white\/30/g, 'text-[#8f6b52]/80');
  content = content.replace(/text-white\/25/g, 'text-[#8f6b52]/60');
  content = content.replace(/text-white\/20/g, 'text-[#8f6b52]/50');
  content = content.replace(/text-white\/10/g, 'text-[#8f6b52]/30');
  content = content.replace(/text-white/g, 'text-[#2b160c]');
  
  // Primary color
  content = content.replace(/text-primary/g, 'text-[#ef5a24]');
  content = content.replace(/bg-primary\/20/g, 'bg-[#ef5a24]/20');
  content = content.replace(/bg-primary\/30/g, 'bg-[#ef5a24]/30');
  content = content.replace(/bg-primary\/40/g, 'bg-[#ef5a24]/40');
  content = content.replace(/bg-primary\/5/g, 'bg-[#fff0dd]');
  content = content.replace(/bg-primary\/8/g, 'bg-[#fff0dd]');
  content = content.replace(/bg-primary/g, 'bg-[#ef5a24]');
  content = content.replace(/border-primary\/20/g, 'border-[#ef5a24]/20');
  content = content.replace(/border-primary\/30/g, 'border-[#ef5a24]/30');
  content = content.replace(/border-primary\/40/g, 'border-[#ef5a24]/40');
  content = content.replace(/border-primary/g, 'border-[#ef5a24]');
  content = content.replace(/ring-primary/g, 'ring-[#ef5a24]');
  content = content.replace(/shadow-primary/g, 'shadow-[#ef5a24]');
  content = content.replace(/hover:text-primary/g, 'hover:text-[#ef5a24]');

  // Secondary/Accent
  content = content.replace(/bg-accent/g, 'bg-[#dc4818]');
  content = content.replace(/text-black/g, 'text-white'); // For buttons that had text-black on primary
  
  // Cards and Panels
  content = content.replace(/style=\{\{\s*background:\s*"linear-gradient\(145deg,\s*rgba\(13,24,41,0\.9\),\s*rgba\(10,18,35,0\.95\)\)",\s*border:\s*"1px\s*solid\s*rgba\(255,255,255,0\.07\)"\s*\}\}/g, 'className="rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"');
  content = content.replace(/style=\{\{\s*background:\s*"linear-gradient\(145deg,\s*rgba\(13,24,41,0\.9\),\s*rgba\(10,18,35,0\.95\)\)",\s*border:\s*"1px\s*solid\s*rgba\(255,255,255,0\.06\)"\s*\}\}/g, 'className="rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"');

  // Fix other inline styles
  content = content.replace(/style=\{\{\s*background:\s*"rgba\(255,255,255,0\.04\)",\s*border:\s*"1px\s*solid\s*rgba\(255,255,255,0\.08\)"\s*\}\}/g, 'className="bg-white border border-[#ead8c1] focus:border-[#ef5a24]/40"');

  // Specific borders
  content = content.replace(/border-white\/10/g, 'border-[#ead8c1]');
  content = content.replace(/border-white\/8/g, 'border-[#ead8c1]');
  content = content.replace(/border-white\/5/g, 'border-[#ead8c1]');
  content = content.replace(/border-white\/20/g, 'border-[#ead8c1]');
  content = content.replace(/border-white\/15/g, 'border-[#ead8c1]');
  
  content = content.replace(/bg-white\/8/g, 'bg-[#ead8c1]/30');
  content = content.replace(/bg-white\/15/g, 'bg-[#ead8c1]/40');
  content = content.replace(/bg-white\/25/g, 'bg-[#ead8c1]/50');

  // Input background overrides
  content = content.replace(/bg-background border border-\[#ead8c1\]/g, 'bg-white border border-[#ead8c1]');

  return content;
}

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = transformContent(content);
    
    content = content.replace(/onMouseEnter=\{e\s*=>\s*\{\s*\(e\.currentTarget\s*as\s*HTMLDivElement\)\.style\.borderColor\s*=\s*"rgba\(212,175,55,0\.25\)";\s*\}\}/g, '');
    content = content.replace(/onMouseLeave=\{e\s*=>\s*\{\s*\(e\.currentTarget\s*as\s*HTMLDivElement\)\.style\.borderColor\s*=\s*"rgba\(255,255,255,0\.06\)";\s*\}\}/g, '');

    content = content.replace(/onFocus=\{e=>\(e\.currentTarget\.style\.borderColor="rgba\(212,175,55,0\.4\)"\)\}/g, '');
    content = content.replace(/onBlur=\{e=>\(e\.currentTarget\.style\.borderColor="rgba\(255,255,255,0\.08\)"\)\}/g, '');
    
    // Specific fix for font-playfair in headings
    content = content.replace(/text-3xl font-black text-\[#2b160c\]/g, 'font-playfair text-3xl font-black text-[#2b160c]');
    content = content.replace(/text-4xl font-black text-\[#2b160c\]/g, 'font-playfair text-4xl font-black text-[#2b160c]');
    
    // Fix button text colors for the primary buttons
    content = content.replace(/bg-\[#ef5a24\] text-\[#2b160c\]/g, 'bg-[#ef5a24] text-white');

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
