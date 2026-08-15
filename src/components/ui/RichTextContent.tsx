import React from 'react';
import { sanitizeRichText, RICH_TEXT_TYPOGRAPHY_CLASS } from '../../lib/richTextHtml';

interface RichTextContentProps {
  html: string | null | undefined;
  className?: string;
}

/** Renders sanitized rich text HTML with real paragraph/list typography (defense-in-depth: sanitizes again on read). */
export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const clean = sanitizeRichText(html);
  if (!clean) return null;
  return <div className={`${RICH_TEXT_TYPOGRAPHY_CLASS} ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
