import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /bg-zinc-50/g, replacement: 'bg-light-bg' },
  { regex: /bg-zinc-100/g, replacement: 'bg-light-surface' },
  { regex: /bg-zinc-200/g, replacement: 'bg-light-border' },
  { regex: /border-zinc-200/g, replacement: 'border-light-border' },
  { regex: /border-zinc-300/g, replacement: 'border-light-border' },
  { regex: /text-zinc-900/g, replacement: 'text-text-main' },
  { regex: /text-zinc-700/g, replacement: 'text-text-muted' },
  { regex: /text-zinc-600/g, replacement: 'text-text-muted' },
  { regex: /text-zinc-500/g, replacement: 'text-text-muted' },
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
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
