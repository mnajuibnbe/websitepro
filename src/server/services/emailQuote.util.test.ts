import assert from 'node:assert/strict';
import test from 'node:test';
import { stripQuotedReply } from './emailQuote.util.js';

test('strips Gmail/Apple Mail "On ... wrote:" quote blocks', () => {
  const body = 'Thanks, that fixed it!\n\nOn Mon, Jan 5, 2026 at 10:00 AM Support <support@tutiba.com> wrote:\n> Have you tried restarting?\n> Let us know.';
  assert.equal(stripQuotedReply(body), 'Thanks, that fixed it!');
});

test('strips Outlook-style "-----Original Message-----" blocks', () => {
  const body = 'Sounds good.\n\n-----Original Message-----\nFrom: Support <support@tutiba.com>\nSent: Monday\nTo: visitor@example.com\nSubject: Re: your message\n\nOriginal text here.';
  assert.equal(stripQuotedReply(body), 'Sounds good.');
});

test('strips Outlook plain-text header block reply (From/Sent/To/Subject)', () => {
  const body = 'Got it, thank you.\n\nFrom: Support <support@tutiba.com>\nSent: Tuesday, January 6, 2026\nTo: visitor@example.com\nSubject: Re: your message\n\nOriginal message body.';
  assert.equal(stripQuotedReply(body), 'Got it, thank you.');
});

test('strips leading ">" quoted lines', () => {
  const body = 'One more question.\n> Previous line one\n> Previous line two';
  assert.equal(stripQuotedReply(body), 'One more question.');
});

test('does not cut on a lone "From:" that is not part of a header block', () => {
  const body = 'From: now on I will check my email more often.';
  assert.equal(stripQuotedReply(body), 'From: now on I will check my email more often.');
});

test('falls back to the full trimmed text when no boundary is found', () => {
  const body = '  Just a normal reply with no quoting.  ';
  assert.equal(stripQuotedReply(body), 'Just a normal reply with no quoting.');
});

test('returns empty string when the entire body is quoted content', () => {
  const body = 'On Mon, Jan 5, 2026 at 10:00 AM Support <support@tutiba.com> wrote:\n> Everything is quoted';
  assert.equal(stripQuotedReply(body), '');
});
