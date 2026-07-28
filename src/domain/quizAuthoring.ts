export interface QuizOptionDraft { option_text: string; is_correct: boolean }
export interface QuizQuestionDraft { question_text: string; options: QuizOptionDraft[] }
export interface QuizDraft { title: string; pass_percentage: number; max_attempts: number; questions: QuizQuestionDraft[] }

export function validateQuizDraft(quiz: QuizDraft): string[] {
  const errors: string[] = [];
  if (quiz.title.trim().length < 2) errors.push('Add a quiz title.');
  if (!Number.isInteger(quiz.pass_percentage) || quiz.pass_percentage < 1 || quiz.pass_percentage > 100) errors.push('Pass score must be between 1 and 100.');
  if (!Number.isInteger(quiz.max_attempts) || quiz.max_attempts < 1 || quiz.max_attempts > 20) errors.push('Maximum attempts must be between 1 and 20.');
  if (quiz.questions.length === 0) errors.push('Add at least one question.');
  quiz.questions.forEach((question, index) => {
    if (question.question_text.trim().length < 3) errors.push(`Question ${index + 1} needs clear text.`);
    if (question.options.length < 2) errors.push(`Question ${index + 1} needs at least two answers.`);
    if (question.options.some(option => !option.option_text.trim())) errors.push(`Question ${index + 1} has an empty answer.`);
    if (question.options.filter(option => option.is_correct).length !== 1) errors.push(`Question ${index + 1} needs exactly one correct answer.`);
  });
  return errors;
}
