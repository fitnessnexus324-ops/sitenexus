import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /dark:bg-zinc-100 dark:bg-\[\#1A1A1A\]/g, replacement: 'dark:bg-[#121212]' },
  { regex: /dark:bg-zinc-200 dark:bg-\[\#222222\]/g, replacement: 'dark:bg-[#1A1A1A]' },
  { regex: /dark:text-zinc-700 dark:text-zinc-300/g, replacement: 'dark:text-zinc-300' },
  { regex: /dark:border-zinc-200 dark:border-white\/10/g, replacement: 'dark:border-white/10' },
  { regex: /dark:border-zinc-200 dark:border-white\/5/g, replacement: 'dark:border-white/5' },
  { regex: /dark:border-zinc-300 dark:border-white\/20/g, replacement: 'dark:border-white/20' },
  { regex: /dark:border-zinc-300 dark:border-white\/30/g, replacement: 'dark:border-white/30' },
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
        content = content.replace(regex, replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
