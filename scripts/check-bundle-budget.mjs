import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const html = readFileSync('dist/index.html', 'utf8');
const entryMatch = html.match(/<script[^>]+src="([^"]+\.js)"/);
if (!entryMatch) throw new Error('Could not identify the production entry script');
const entryPath = join('dist', entryMatch[1].replace(/^\//, ''));
const entryGzip = gzipSync(readFileSync(entryPath)).byteLength;
const files = readdirSync('dist/assets').filter(file => file.endsWith('.js'));
const largest = files.map(file => ({ file, bytes: statSync(join('dist/assets', file)).size })).sort((a, b) => b.bytes - a.bytes)[0];
const limits = { entryGzip: 180 * 1024, largestChunk: 700 * 1024 };
if (entryGzip > limits.entryGzip) throw new Error(`Entry gzip budget exceeded: ${entryGzip} > ${limits.entryGzip} bytes`);
if (largest.bytes > limits.largestChunk) throw new Error(`Chunk budget exceeded: ${largest.file} is ${largest.bytes} bytes`);
console.log(`Bundle budgets passed: entry gzip ${entryGzip} bytes; largest chunk ${largest.file} ${largest.bytes} bytes`);
