import fs from 'fs';
import path from 'path';
import { globSync } from 'glob'; // Assuming glob is installed, if not we'll just write a basic recursive read

// Quick custom recursive read if glob isn't available
function getFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.resolve(__dirname, '../src');
const testDir = path.resolve(__dirname, '../test');

const allFiles = [...getFiles(srcDir)];
if (fs.existsSync(testDir)) {
    allFiles.push(...getFiles(testDir));
}

let modifiedFiles = 0;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Match import statements: import ... from '../something' or import ... from './something'
  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  
  newContent = newContent.replace(importRegex, (match, importPath) => {
    const fileDir = path.dirname(file);
    const absoluteImportPath = path.resolve(fileDir, importPath);

    // If the imported module is within the src directory
    if (absoluteImportPath.startsWith(srcDir)) {
      // Calculate the relative path from srcDir
      let relativeToSrc = path.relative(srcDir, absoluteImportPath);
      // Ensure forward slashes for imports
      relativeToSrc = relativeToSrc.replace(/\\/g, '/');
      
      // We do not change imports that are in the exact same directory if it's just a sibling,
      // but the rule says `@/` is universally accepted. Let's just enforce @/ everywhere except 
      // if they prefer siblings. Let's replace all to be safe and clean.
      return `from '@/${relativeToSrc}'`;
    }
    
    return match;
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedFiles++;
  }
});

console.log(`Updated aliases in ${modifiedFiles} files.`);
