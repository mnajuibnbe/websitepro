import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAssignmentDraft } from './assignmentAuthoring';

test('accepts a clear assignment definition', () => assert.deepEqual(validateAssignmentDraft({ instructions: 'Submit a documented practical analysis with supporting evidence.', max_points: 100, allowed_submission: 'text_or_link' }), []));
test('rejects incomplete instructions and unsafe grading ranges', () => assert.equal(validateAssignmentDraft({ instructions: 'Too short', max_points: 0, allowed_submission: 'text' }).length, 2));
