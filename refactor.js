import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /bg-\[\#050505\]/g, replacement: 'bg-zinc-50 dark:bg-[#0B0B0B]' },
  { regex: /bg-\[\#0a0a0a\]/g, replacement: 'bg-white dark:bg-[#121212]' },
  { regex: /bg-\[\#121212\]/g, replacement: 'bg-zinc-100 dark:bg-[#1A1A1A]' },
  { regex: /bg-\[\#1a1a1a\]/g, replacement: 'bg-zinc-200 dark:bg-[#222222]' },
  { regex: /text-white/g, replacement: 'text-zinc-900 dark:text-white' },
  { regex: /text-zinc-400/g, replacement: 'text-zinc-600 dark:text-zinc-400' },
  { regex: /text-zinc-300/g, replacement: 'text-zinc-700 dark:text-zinc-300' },
  { regex: /border-white\/5/g, replacement: 'border-zinc-200 dark:border-white/5' },
  { regex: /border-white\/10/g, replacement: 'border-zinc-200 dark:border-white/10' },
  { regex: /border-white\/20/g, replacement: 'border-zinc-300 dark:border-white/20' },
  { regex: /border-white\/30/g, replacement: 'border-zinc-300 dark:border-white/30' },
  { regex: /bg-black\/60/g, replacement: 'bg-white/60 dark:bg-black/60' },
  { regex: /bg-black\/80/g, replacement: 'bg-white/80 dark:bg-black/80' },
  { regex: /bg-black\/50/g, replacement: 'bg-white/50 dark:bg-black/50' },
  { regex: /text-black/g, replacement: 'text-white dark:text-black' }, // For buttons that are neon-blue, text should be black in dark mode, but what about light mode? Neon blue is bright, so black text is good in both. Let's skip text-black.
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const { regex, replacement } of replacements) {
        if (regex.source === 'text-black') continue;
        content = content.replace(regex, replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
