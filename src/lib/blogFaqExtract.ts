import { blogContentPlainText } from './blogContentHtml';

/**
 * Extracts question/answer pairs from FAQ blocks already present in an article's
 * content HTML, for the FAQPage structured data on the public article page (see
 * BlogPost.tsx). Reuses the exact markup contract FaqExtension.tsx renders and
 * blogQuestionInsert.ts documents: `div[data-block="faq"] > .faq-item > (h4.faq-question,
 * div.faq-answer)`. Matches on the `faq-question`/`faq-answer` classes directly rather
 * than first locating the outer block (those two classes never appear outside a FAQ
 * block), so no depth-tracking is needed — same pragmatic regex approach as
 * blogContentSegments.ts, and it keeps this module DOM-free and testable under `npm test`.
 */

export interface FaqQaEntry { question: string; answer: string }

const FAQ_ITEM_RE = /<h4[^>]*\bclass="faq-question"[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<div[^>]*\bclass="faq-answer"[^>]*>([\s\S]*?)<\/div>/g;

/** Only pairs with both a question and a non-empty answer are returned — an unanswered FAQ item isn't usable structured data. */
export function extractFaqEntries(html: string | null | undefined): FaqQaEntry[] {
  if (!html || !html.includes('data-block="faq"')) return [];

  const entries: FaqQaEntry[] = [];
  let match: RegExpExecArray | null;
  FAQ_ITEM_RE.lastIndex = 0;
  while ((match = FAQ_ITEM_RE.exec(html))) {
    const question = blogContentPlainText(match[1]).trim();
    const answer = blogContentPlainText(match[2]).trim();
    if (question && answer) entries.push({ question, answer });
  }
  return entries;
}
