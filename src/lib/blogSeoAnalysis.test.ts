import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeHeadingStructure, analyzeIntroduction, analyzeReadability, articleWordCount } from './blogSeoAnalysis';

const words = (n: number, word = 'word') => Array.from({ length: n }, () => word).join(' ');

test('heading structure: reports section counts and flags no H2 sections used', () => {
  const html = `<p>${words(20)}.</p>`;
  const analysis = analyzeHeadingStructure(html);
  assert.equal(analysis.h2Count, 0);
  assert.equal(analysis.usesH2Sections, false);
  assert.deepEqual(analysis.nestingIssues, []);
});

test('heading structure: flags an H3 with no H2 above it', () => {
  const html = '<h3>Orphan</h3><p>Text.</p>';
  const analysis = analyzeHeadingStructure(html);
  assert.equal(analysis.nestingIssues.length, 1);
  assert.match(analysis.nestingIssues[0], /Orphan/);
});

test('heading structure: flags a skipped level (H4 with no H3 in its section)', () => {
  const html = '<h2>Section</h2><h4>Too deep</h4>';
  const analysis = analyzeHeadingStructure(html);
  assert.equal(analysis.nestingIssues.length, 1);
  assert.match(analysis.nestingIssues[0], /Too deep/);
});

test('heading structure: does not flag properly nested H3 under H2', () => {
  const html = '<h2>Section</h2><h3>Sub</h3><h4>Sub sub</h4>';
  const analysis = analyzeHeadingStructure(html);
  assert.deepEqual(analysis.nestingIssues, []);
  assert.equal(analysis.h2Count, 1);
  assert.equal(analysis.h3Count, 1);
  assert.equal(analysis.h4Count, 1);
});

test('heading structure: flags a large section with no subheading', () => {
  const html = `<h2>Big section</h2><p>${words(310)}.</p>`;
  const analysis = analyzeHeadingStructure(html);
  assert.equal(analysis.largeSectionsWithoutSubheading.length, 1);
  assert.equal(analysis.largeSectionsWithoutSubheading[0].headingText, 'Big section');
});

test('heading structure: a large section WITH an H3 is not flagged', () => {
  const html = `<h2>Big section</h2><h3>Part one</h3><p>${words(310)}.</p>`;
  const analysis = analyzeHeadingStructure(html);
  assert.deepEqual(analysis.largeSectionsWithoutSubheading, []);
});

test('readability: flags a long paragraph', () => {
  const html = `<p>${words(160)}.</p>`;
  const findings = analyzeReadability(html);
  assert.ok(findings.some((f) => f.type === 'long-paragraph'));
});

test('readability: does not flag a short paragraph', () => {
  const html = `<p>${words(30)}.</p>`;
  assert.deepEqual(analyzeReadability(html), []);
});

test('readability: flags a long sentence', () => {
  const html = `<p>${words(45)}.</p>`;
  const findings = analyzeReadability(html);
  assert.ok(findings.some((f) => f.type === 'long-sentence'));
});

test('readability: flags a long uninterrupted run of paragraphs', () => {
  const html = Array.from({ length: 5 }, () => `<p>${words(60)}.</p>`).join('');
  const findings = analyzeReadability(html);
  assert.ok(findings.some((f) => f.type === 'large-block'));
});

test('readability: a run broken up by a heading is not flagged as one large block', () => {
  const html = `<p>${words(60)}.</p><p>${words(60)}.</p><h3>Break</h3><p>${words(60)}.</p><p>${words(60)}.</p>`;
  const findings = analyzeReadability(html);
  assert.ok(!findings.some((f) => f.type === 'large-block'));
});

test('introduction: measures word count before the first heading and detects a long intro', () => {
  const html = `<p>${words(210)}.</p><h2>Section</h2><p>More.</p>`;
  const analysis = analyzeIntroduction(html, null);
  assert.equal(analysis.wordCount, 210);
  assert.equal(analysis.isLong, true);
  assert.equal(analysis.mentionsPrimaryQuery, null);
});

test('introduction: detects an exact primary query phrase mention', () => {
  const html = '<p>This guide explains retinol for sensitive skin in practical terms.</p><h2>Section</h2>';
  const analysis = analyzeIntroduction(html, 'retinol for sensitive skin');
  assert.equal(analysis.mentionsPrimaryQuery, true);
});

test('introduction: flags a likely-missing primary query mention', () => {
  const html = '<p>This article covers something completely unrelated to gardening.</p>';
  const analysis = analyzeIntroduction(html, 'sourdough bread baking tips');
  assert.equal(analysis.mentionsPrimaryQuery, false);
});

test('articleWordCount counts visible text across all blocks including custom blocks', () => {
  const html = '<h2>Title</h2><p>One two three.</p><div data-block="faq"><div class="faq-item"><h4 class="faq-question">Q one two?</h4><div class="faq-answer"><p>Answer one two.</p></div></div></div>';
  assert.equal(articleWordCount(html), 10);
});
