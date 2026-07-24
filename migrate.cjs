const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files = [];
walkDir('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    files.push(filePath);
  }
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix LessonPlayer.tsx special case
  content = content.replace(/onNavigate \? onNavigate\(['"]#\/([^'"]+)['"]\) : \(window\.location\.hash = ['"]#\/[^'"]+['"]\)/g, "navigate('/$1')");

  // 1. Replace <a href="#/path"> with <Link to="/path">
  content = content.replace(/<a\s+([^>]+)>([\s\S]*?)<\/a>/gi, (match, attrs, inner) => {
    if (attrs.includes('href="#/') || attrs.includes("href={'#/")) {
      let newAttrs = attrs.replace(/href=["']#\/([^"']*)["']/, 'to="/$1"');
      newAttrs = newAttrs.replace(/href=\{['"]#\/([^'"]*)['"]\}/, 'to="/$1"');
      return `<Link ${newAttrs}>${inner}</Link>`;
    }
    return match;
  });

  // 2. Replace window.location.hash = '#/path' -> navigate('/path')
  content = content.replace(/window\.location\.hash\s*=\s*['"]#\/([^'"]+)['"]/g, "navigate('/$1')");
  content = content.replace(/window\.location\.hash\s*=\s*`#\/([^`]+)`/g, "navigate(`/$1`)");

  // 3. Replace onNavigate('#/path') -> navigate('/path')
  content = content.replace(/onNavigate\(['"]#\/([^'"]+)['"]\)/g, "navigate('/$1')");
  content = content.replace(/onNavigate\(['"]\/([^'"]*)['"]\)/g, "navigate('/$1')");
  content = content.replace(/onNavigate\(['"]#\/?['"]\)/g, "navigate('/')");
  content = content.replace(/onNavigate\(([^)]+)\)/g, "navigate($1)"); // for variables

  // 4. Remove onNavigate from props
  content = content.replace(/\{\s*onNavigate\s*\}:\s*\{\s*onNavigate:\s*\(path:\s*string\)\s*=>\s*void\s*\}/g, "{}");
  content = content.replace(/\(\{\s*onNavigate\s*\}\)/g, "()");
  // For standard props
  content = content.replace(/,\s*onNavigate(?=[,}])/g, "");
  content = content.replace(/onNavigate,\s*/g, "");
  content = content.replace(/onNavigate:\s*\(path:\s*string\)\s*=>\s*void,?\s*/g, "");

  // 5. Remove onNavigate={onNavigate} from JSX
  content = content.replace(/\s*onNavigate=\{onNavigate\}/g, "");

  // Add useNavigate and Link if needed
  const needsNavigate = (content.includes('navigate(') || content.includes('navigate`')) && !content.includes('const navigate = ');
  const needsLink = content.includes('<Link ') && !content.includes('Link} from');
  
  if (needsNavigate || needsLink) {
    let importsToAdd = [];
    if (needsNavigate && !content.includes('useNavigate')) importsToAdd.push('useNavigate');
    if (needsLink && !content.includes('Link')) importsToAdd.push('Link');
    
    if (importsToAdd.length > 0) {
      if (content.includes("'react-router-dom'")) {
        content = content.replace(/(import\s*\{[^}]*)(\}\s*from\s*['"]react-router-dom['"])/, `$1, ${importsToAdd.join(', ')} $2`);
      } else {
        content = content.replace(/(import React[^;]*;)/, `$1\nimport { ${importsToAdd.join(', ')} } from 'react-router-dom';`);
      }
    }
    
    if (needsNavigate) {
      // Find the first component function and inject const navigate = useNavigate();
      content = content.replace(/(export\s+(?:default\s+)?(?:function|const)\s+[A-Za-z0-9_]+\s*(?:=\s*\([^)]*\)\s*=>\s*|\([^)]*\)\s*)\{)/, `$1\n  const navigate = useNavigate();\n`);
      if (!content.includes('const navigate = useNavigate();')) {
          content = content.replace(/(function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/, `$1\n  const navigate = useNavigate();\n`);
      }
    }
  }
  
  // Quick fix for empty destructuring
  content = content.replace(/function\s+([A-Za-z0-9_]+)\(\{\}\)/g, "function $1()");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
  }
});
