import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(directory) {
  return readdirSync(directory).flatMap(name => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
}
const index = readFileSync('index.html', 'utf8');
const failures = [];
if (!/<html[^>]+lang="en"[^>]+dir="ltr"/.test(index)) failures.push('index.html must declare English LTR');
if (!/<meta name="viewport"/.test(index)) failures.push('index.html must include a responsive viewport');
if (!/<meta name="description"/.test(index)) failures.push('index.html must include a description');
const sources = walk('src').filter(file => /\.(tsx|ts)$/.test(file));
for (const file of sources) {
  const content = readFileSync(file, 'utf8');
  if (/window\.confirm\(/.test(content)) failures.push(`${file} uses inaccessible window.confirm`);
  if (/<img(?:\s|>)/.test(content) && !file.endsWith('OptimizedImage.tsx')) failures.push(`${file} contains a raw img; use OptimizedImage`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Quality audit passed across ${sources.length} TypeScript source files`);
