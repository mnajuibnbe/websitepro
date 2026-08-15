/**
 * Boundary lines that mark the start of quoted original-message content in
 * a plain-text email reply, across the major clients (Gmail, Apple Mail,
 * Outlook desktop/web, Yahoo). Matched against each line's trimmed text;
 * the earliest match in the body wins and everything from that line on is
 * dropped. Not exhaustive -- there is no universal standard -- but this
 * covers the large majority of real replies.
 */
const QUOTE_BOUNDARY_PATTERNS: RegExp[] = [
  /^On .{0,250}wrote:$/,
  /^-{2,}\s?Original Message\s?-{2,}$/i,
  /^-{2,}\s?Forwarded Message\s?-{2,}$/i,
  /^_{8,}$/,
  /^From:\s?.+$/i,
  /^>/,
];

const MAX_LOOKAHEAD_FOR_HEADER_BLOCK = 4;

/** True if this "From:" line is followed shortly by Outlook-style Sent:/Date:/To:/Subject: header lines. */
function isOutlookHeaderBlock(lines: string[], fromIndex: number): boolean {
  const window = lines.slice(fromIndex + 1, fromIndex + 1 + MAX_LOOKAHEAD_FOR_HEADER_BLOCK);
  return window.some((line) => /^(Sent|Date|To|Subject):\s?/i.test(line.trim()));
}

/**
 * Strips quoted original-message content from a plain-text email reply so
 * only the visitor's new text is stored/displayed. Operates on plain text
 * only (never HTML) -- see the migration comment on
 * contact_submission_replies for why inbound content is never rendered as HTML.
 */
export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let cutIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (/^From:\s?.+$/i.test(trimmed)) {
      if (isOutlookHeaderBlock(lines, i)) { cutIndex = i; break; }
      continue;
    }
    if (QUOTE_BOUNDARY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      cutIndex = i;
      break;
    }
  }

  return lines.slice(0, cutIndex).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
