import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /dark:hover:text-neon-blue/g, replacement: 'dark:group-hover:text-neon-blue' },
  { regex: /dark:hover:bg-neon-blue/g, replacement: 'dark:group-hover:bg-neon-blue' },
  { regex: /dark:hover:border-neon-blue/g, replacement: 'dark:group-hover:border-neon-blue' },
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
      
      // Only do this if we see group-hover right before it
      content = content.replace(/group-hover:text-brand-blue dark:hover:text-neon-blue/g, 'group-hover:text-brand-blue dark:group-hover:text-neon-blue');
      content = content.replace(/group-hover:bg-brand-green dark:hover:bg-neon-blue/g, 'group-hover:bg-brand-green dark:group-hover:bg-neon-blue');
      content = content.replace(/group-hover:border-brand-blue dark:hover:border-neon-blue/g, 'group-hover:border-brand-blue dark:group-hover:border-neon-blue');
      
      content = content.replace(/group-hover:text-white dark:text-black/g, 'group-hover:text-white dark:group-hover:text-black');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
