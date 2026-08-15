// One-off content conversion (not a DB migration): reformats the plain-text
// course/lesson descriptions of "Skin and Hair Care Diploma Part 1" — which
// currently store hand-typed "- " bullet and "> " nested-step markers as
// literal characters — into the same restricted HTML the new rich text
// editor produces (<p>, <strong>, <em>, <ol>, <ul>, <li>). Zero wording
// changes: this only re-structures existing text into real lists.
//
// Usage:
//   node scripts/convert-diploma-part1-descriptions.mjs            (dry run: prints before/after, writes nothing)
//   node scripts/convert-diploma-part1-descriptions.mjs --apply    (writes the converted HTML to Supabase)

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnvFallback(filename) {
  const filePath = join(root, filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnvFallback('.env.local');
loadDotEnvFallback('.env');

const COURSE_ID = '5d1436b8-229c-4853-ba75-4756ce52ada0'; // Skin and Hair Care Diploma Part 1
const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'ol', 'ul', 'li']);
// Only bold lead-in phrases we can identify with confidence, per review instructions.
// Everything else stays unbolded rather than guessed.
const BOLD_LEAD_INS = ['The objective of this diploma', 'Firstly', 'Next', 'Finally'];

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyBold(text) {
  for (const phrase of BOLD_LEAD_INS) {
    if (text === phrase || text.startsWith(`${phrase}, `) || text.startsWith(`${phrase} `)) {
      return `<strong>${escapeHtml(phrase)}</strong>${escapeHtml(text.slice(phrase.length))}`;
    }
  }
  return escapeHtml(text);
}

/**
 * Conservative structural parse: a line starting with "- " is a new top-level
 * bullet; a line starting with "> " nests under the current bullet as a
 * sequential (numbered) sub-step; any other non-empty line is a standalone
 * closing paragraph. Blank lines are pure formatting and are dropped.
 */
function parseToBlocks(raw) {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  let currentList = null;
  let currentItem = null;
  for (const line of lines) {
    if (line.startsWith('>')) {
      if (!currentItem) throw new Error(`Nested "> " line has no preceding "- " bullet: "${line}"`);
      currentItem.sub.push(line.replace(/^>\s*/, ''));
    } else if (line.startsWith('-')) {
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
        blocks.push(currentList);
      }
      currentItem = { text: line.replace(/^-\s*/, ''), sub: [] };
      currentList.items.push(currentItem);
    } else {
      currentList = null;
      currentItem = null;
      blocks.push({ type: 'p', text: line });
    }
  }
  return blocks;
}

function renderBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === 'p') return `<p>${applyBold(block.text)}</p>`;
    const items = block.items.map((item) => {
      const sub = item.sub.length ? `<ol>${item.sub.map((s) => `<li>${applyBold(s)}</li>`).join('')}</ol>` : '';
      return `<li>${applyBold(item.text)}${sub}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
  }).join('');
}

function assertOnlyAllowedTags(html) {
  const tagPattern = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (!ALLOWED_TAGS.has(match[1].toLowerCase())) {
      throw new Error(`Generated HTML used a disallowed tag <${match[1]}>: ${html}`);
    }
  }
}

function convert(raw) {
  const html = renderBlocks(parseToBlocks(raw));
  assertOnlyAllowedTags(html);
  return html;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey);

const apply = process.argv.includes('--apply');

const { data: course, error: courseError } = await supabase
  .from('courses')
  .select('id, title, description')
  .eq('id', COURSE_ID)
  .single();
if (courseError) throw courseError;

const { data: lessons, error: lessonsError } = await supabase
  .from('lessons')
  .select('id, title, description')
  .eq('course_id', COURSE_ID)
  .not('description', 'is', null)
  .neq('description', '');
if (lessonsError) throw lessonsError;

const courseHtml = convert(course.description);

console.log('='.repeat(80));
console.log(`COURSE: ${course.title} (${course.id})`);
console.log('--- BEFORE ---');
console.log(course.description);
console.log('--- AFTER ---');
console.log(courseHtml);

const lessonConversions = lessons.map((lesson) => ({ lesson, html: convert(lesson.description) }));

for (const { lesson, html } of lessonConversions) {
  console.log('='.repeat(80));
  console.log(`LESSON: ${lesson.title} (${lesson.id})`);
  console.log('--- BEFORE ---');
  console.log(lesson.description);
  console.log('--- AFTER ---');
  console.log(html);
}

console.log('='.repeat(80));
console.log(`${apply ? 'APPLYING' : 'DRY RUN — pass --apply to write'}: 1 course + ${lessonConversions.length} lessons.`);

if (apply) {
  const { error: updateCourseError } = await supabase.from('courses').update({ description: courseHtml }).eq('id', COURSE_ID);
  if (updateCourseError) throw updateCourseError;

  for (const { lesson, html } of lessonConversions) {
    const { error: updateLessonError } = await supabase.from('lessons').update({ description: html }).eq('id', lesson.id);
    if (updateLessonError) throw updateLessonError;
  }
  console.log('Done.');
}
