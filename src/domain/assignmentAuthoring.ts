export interface AssignmentDraft { instructions: string; max_points: number; allowed_submission: 'text' | 'link' | 'text_or_link' }

export function validateAssignmentDraft(value: AssignmentDraft): string[] {
  const errors: string[] = [];
  if (value.instructions.trim().length < 20) errors.push('Assignment instructions must contain at least 20 characters.');
  if (!Number.isInteger(value.max_points) || value.max_points < 1 || value.max_points > 10000) errors.push('Maximum points must be between 1 and 10,000.');
  if (!['text', 'link', 'text_or_link'].includes(value.allowed_submission)) errors.push('Choose a supported submission format.');
  return errors;
}
