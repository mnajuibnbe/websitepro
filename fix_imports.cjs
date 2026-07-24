const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let needsLink = content.includes('<Link ') && !content.includes('Link') && content.includes('react-router-dom');
    // Actually, a better check:
    let hasLinkImport = /import\s*\{[^}]*Link[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(content);
    let usesLink = content.includes('<Link ');
    
    if (usesLink && !hasLinkImport) {
       if (content.includes('react-router-dom')) {
         content = content.replace(/(import\s*\{[^}]*)(\}\s*from\s*['"]react-router-dom['"])/, '$1, Link $2');
       } else {
         content = content.replace(/(import React[^;]*;)/, `$1\nimport { Link } from 'react-router-dom';`);
       }
       fs.writeFileSync(file, content);
       console.log('Fixed Link in', file);
    }
  }
});
