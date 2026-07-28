import assert from 'node:assert/strict';
import test from 'node:test';
import { validateQuizDraft } from './quizAuthoring';

test('accepts a complete quiz with a configured three-attempt limit', () => {
  assert.deepEqual(validateQuizDraft({ title: 'Final check', pass_percentage: 70, max_attempts: 3, questions: [{ question_text: 'Which answer is correct?', options: [{ option_text: 'First', is_correct: true }, { option_text: 'Second', is_correct: false }] }] }), []);
});

test('rejects unsafe assessment settings and ambiguous answer keys', () => {
  const errors = validateQuizDraft({ title: '', pass_percentage: 101, max_attempts: 0, questions: [{ question_text: '', options: [{ option_text: '', is_correct: true }, { option_text: 'Second', is_correct: true }] }] });
  assert.ok(errors.length >= 6);
  assert.ok(errors.some(error => error.includes('exactly one correct answer')));
});
