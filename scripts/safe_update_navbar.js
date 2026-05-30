const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

c = c.replace(
  /"bg-background\/95 backdrop-blur-md shadow-sm border-b border-white\/8 py-3"/g,
  'isLightPage ? "bg-[#fff4e4]/95 backdrop-blur-md shadow-sm border-b border-[#ead8c1] py-3" : "bg-background/95 backdrop-blur-md shadow-sm border-b border-white/8 py-3"'
);

c = c.replace(
  /"bg-background\/90 backdrop-blur-sm border-b border-white\/5"/g,
  'isLightPage ? "bg-[#fff4e4]/90 backdrop-blur-sm border-b border-[#ead8c1]" : "bg-background/90 backdrop-blur-sm border-b border-white/5"'
);

c = c.replace(
  /className=\{cn\(\n\s*"text-2xl font-black tracking-tight italic hidden sm:block",\n\s*"text-white"\n\s*\)\}/g,
  'className={cn("text-2xl font-black tracking-tight italic hidden sm:block", isLightPage ? "text-[#2b160c]" : "text-white")}'
);

c = c.replace(
  /className=\{cn\("text-sm font-semibold transition-colors hover:text-primary", "text-white\/90"\)\}/g,
  'className={cn("text-sm font-semibold transition-colors hover:text-primary", isLightPage ? "text-[#2b160c]/90" : "text-white/90")}'
);

c = c.replace(
  /<div className="flex items-center gap-3 border-l border-white\/20 pl-6">/g,
  '<div className={cn("flex items-center gap-3 border-l pl-6", isLightPage ? "border-[#ead8c1]" : "border-white/20")}>'
);

c = c.replace(
  /className=\{cn\("relative p-2 rounded-full transition-colors", "text-white hover:bg-white\/10"\)\}/g,
  'className={cn("relative p-2 rounded-full transition-colors", isLightPage ? "text-[#2b160c] hover:bg-black/5" : "text-white hover:bg-white/10")}'
);

c = c.replace(
  /className=\{cn\("flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all backdrop-blur-md", "bg-white\/10 text-white hover:bg-white\/20 border border-white\/5"\)\}/g,
  'className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all backdrop-blur-md", isLightPage ? "bg-white text-[#2b160c] hover:bg-[#fffaf2] border border-[#ead8c1]" : "bg-white/10 text-white hover:bg-white/20 border border-white/5")}'
);

c = c.replace(
  /className=\{cn\("relative p-2", "text-white"\)\}/g,
  'className={cn("relative p-2", isLightPage ? "text-[#2b160c]" : "text-white")}'
);

c = c.replace(
  /className=\{cn\("p-2 rounded-lg", "text-white"\)\}/g,
  'className={cn("p-2 rounded-lg", isLightPage ? "text-[#2b160c]" : "text-white")}'
);

fs.writeFileSync('src/components/Navbar.tsx', c);
