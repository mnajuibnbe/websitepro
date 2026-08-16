/**
 * Builds the HTML fragment for "+ Add to article" on a suggested reader question.
 * Inserted as an FAQ block (see tiptap/FaqExtension.tsx) rather than a bare H2 --
 * the editor already has a dedicated block for question/answer pairs, and reader
 * questions are exactly that shape. Matches FaqExtension's own parseHTML contract:
 * `div[data-block="faq"] > .faq-item > (.faq-question, .faq-answer)`.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildFaqBlockHtml(question: string): string {
  const escaped = escapeHtml(question.trim());
  return `<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">${escaped}</h4><div class="faq-answer"><p></p></div></div></div>`;
}
