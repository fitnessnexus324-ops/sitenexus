import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = [
  { regex: /hover:text-brand-blue dark:text-neon-blue/g, replacement: 'hover:text-brand-blue dark:hover:text-neon-blue' },
  { regex: /hover:bg-brand-green dark:bg-neon-blue/g, replacement: 'hover:bg-brand-green dark:hover:bg-neon-blue' },
  { regex: /hover:border-brand-blue dark:border-neon-blue/g, replacement: 'hover:border-brand-blue dark:hover:border-neon-blue' },
  { regex: /focus:text-brand-blue dark:text-neon-blue/g, replacement: 'focus:text-brand-blue dark:focus:text-neon-blue' },
  { regex: /focus:bg-brand-green dark:bg-neon-blue/g, replacement: 'focus:bg-brand-green dark:focus:bg-neon-blue' },
  { regex: /focus:border-brand-blue dark:border-neon-blue/g, replacement: 'focus:border-brand-blue dark:focus:border-neon-blue' },
  { regex: /group-hover:text-brand-blue dark:text-neon-blue/g, replacement: 'group-hover:text-brand-blue dark:group-hover:text-neon-blue' },
  { regex: /group-hover:bg-brand-green dark:bg-neon-blue/g, replacement: 'group-hover:bg-brand-green dark:group-hover:bg-neon-blue' },
  { regex: /group-hover:border-brand-blue dark:border-neon-blue/g, replacement: 'group-hover:border-brand-blue dark:group-hover:border-neon-blue' },
  { regex: /dark:hover:text-brand-blue dark:hover:text-neon-blue/g, replacement: 'dark:hover:text-neon-blue' },
  { regex: /dark:focus:border-brand-blue dark:focus:border-neon-blue/g, replacement: 'dark:focus:border-neon-blue' },
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
