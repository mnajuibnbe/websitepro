import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTopicInsightsPrompt, generateTopicInsights, parseTopicInsightsResponse } from './gemini.service.js';

test('prompt includes the topic and the trimmed article content', () => {
  const prompt = buildTopicInsightsPrompt('retinol for sensitive skin', 'Retinol needs a careful routine.');
  assert.match(prompt, /retinol for sensitive skin/);
  assert.match(prompt, /Retinol needs a careful routine\./);
  assert.match(prompt, /Topic Coverage/);
  assert.match(prompt, /Reader Questions/);
});

test('prompt notes when there is no article content yet, instead of an empty block', () => {
  const prompt = buildTopicInsightsPrompt('retinol', '');
  assert.match(prompt, /no content written yet/);
});

test('prompt truncates excessively long article content', () => {
  const longContent = 'word '.repeat(5000);
  const prompt = buildTopicInsightsPrompt('retinol', longContent);
  assert.ok(prompt.length < longContent.length);
});

test('parses a well-formed response', () => {
  const parsed = parseTopicInsightsResponse({
    subtopics: [{ topic: 'Patch testing', covered: true }, { topic: 'Purging vs. breakouts', covered: false }],
    questions: ['How long until I see results?', 'Can I use retinol with vitamin C?'],
  });
  assert.deepEqual(parsed, {
    subtopics: [{ topic: 'Patch testing', covered: true }, { topic: 'Purging vs. breakouts', covered: false }],
    questions: ['How long until I see results?', 'Can I use retinol with vitamin C?'],
  });
});

test('rejects a response missing required arrays', () => {
  assert.equal(parseTopicInsightsResponse({ subtopics: [] }), null);
  assert.equal(parseTopicInsightsResponse(null), null);
  assert.equal(parseTopicInsightsResponse('not an object'), null);
  assert.equal(parseTopicInsightsResponse({ subtopics: [], questions: [] }), null);
});

test('drops malformed individual items instead of failing the whole response', () => {
  const parsed = parseTopicInsightsResponse({
    subtopics: [{ topic: 'Valid one', covered: true }, { topic: '', covered: true }, { topic: 'Missing covered flag' }, 'not an object'],
    questions: ['Valid question', '', 42, '  '],
  });
  assert.deepEqual(parsed, { subtopics: [{ topic: 'Valid one', covered: true }], questions: ['Valid question'] });
});

test('generateTopicInsights returns a clear missing_key result without calling the API', async () => {
  const result = await generateTopicInsights('retinol', 'some content', undefined);
  assert.deepEqual(result, { ok: false, reason: 'missing_key', message: 'GEMINI_API_KEY is not configured.' });
});

test('generateTopicInsights treats a blank key the same as a missing one', async () => {
  const result = await generateTopicInsights('retinol', 'some content', '');
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'missing_key');
});
