import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /(?<!dark:)text-neon-blue/g, replacement: 'text-brand-blue dark:text-neon-blue' },
  { regex: /(?<!dark:)bg-neon-blue/g, replacement: 'bg-brand-green dark:bg-neon-blue' },
  { regex: /(?<!dark:)border-neon-blue/g, replacement: 'border-brand-blue dark:border-neon-blue' },
  { regex: /text-black/g, replacement: 'text-white dark:text-black' },
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
      
      // Fix double dark:
      content = content.replace(/dark:text-brand-blue dark:text-neon-blue/g, 'dark:text-neon-blue');
      content = content.replace(/dark:bg-brand-green dark:bg-neon-blue/g, 'dark:bg-neon-blue');
      content = content.replace(/dark:border-brand-blue dark:border-neon-blue/g, 'dark:border-neon-blue');
      content = content.replace(/text-white dark:text-white dark:text-black/g, 'text-white dark:text-black');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
