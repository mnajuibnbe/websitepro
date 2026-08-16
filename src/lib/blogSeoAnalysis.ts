import { blogContentPlainText } from './blogContentHtml';
import { countWords, splitProseBlocks, type ProseBlock } from './blogProseBlocks';
import { textLikelyMentionsQuery } from './blogSeo';

/**
 * Real-time, informational content analysis for the SEO sidebar. Every threshold here
 * is a soft, editorial heuristic ("this commonly reads as long"), never a rule Google
 * itself enforces — Google explicitly does not have fixed word-count, keyword-density,
 * or paragraph-length requirements. Findings are phrased as suggestions, not errors.
 */

const LONG_PARAGRAPH_WORDS = 150;
const LONG_SENTENCE_WORDS = 40;
const LARGE_SECTION_WORDS = 300;
const LARGE_RUN_WORDS = 250;
const LARGE_RUN_MIN_BLOCKS = 4;
const LONG_INTRO_WORDS = 200;

// ---- Heading structure ----------------------------------------------------

export interface HeadingStructureAnalysis {
  h2Count: number;
  h3Count: number;
  h4Count: number;
  usesH2Sections: boolean;
  nestingIssues: string[];
  largeSectionsWithoutSubheading: Array<{ headingText: string | null; wordCount: number }>;
}

export function analyzeHeadingStructure(html: string): HeadingStructureAnalysis {
  const blocks = splitProseBlocks(html);
  let h2Count = 0;
  let h3Count = 0;
  let h4Count = 0;
  let sawH2 = false;
  let sawH3SinceH2 = false;
  const nestingIssues: string[] = [];
  const largeSectionsWithoutSubheading: Array<{ headingText: string | null; wordCount: number }> = [];

  let sectionHeading: string | null = null;
  let sectionWordCount = 0;
  let sectionHasH3 = false;

  const flushSection = () => {
    if (sawH2 && sectionWordCount > LARGE_SECTION_WORDS && !sectionHasH3) {
      largeSectionsWithoutSubheading.push({ headingText: sectionHeading, wordCount: sectionWordCount });
    }
  };

  for (const block of blocks) {
    if (block.tag === 'h2') {
      flushSection();
      h2Count += 1;
      sawH2 = true;
      sawH3SinceH2 = false;
      sectionHeading = block.text;
      sectionWordCount = 0;
      sectionHasH3 = false;
    } else if (block.tag === 'h3') {
      h3Count += 1;
      if (!sawH2) nestingIssues.push(`"${block.text}" is an H3 with no H2 section above it yet.`);
      sawH3SinceH2 = true;
      sectionHasH3 = true;
    } else if (block.tag === 'h4') {
      h4Count += 1;
      if (!sawH3SinceH2) nestingIssues.push(`"${block.text}" is an H4 that isn't nested under an H3 in its section — consider adding an H3 above it, or using H3 instead.`);
    } else {
      sectionWordCount += block.wordCount;
    }
  }
  flushSection();

  return { h2Count, h3Count, h4Count, usesH2Sections: h2Count > 0, nestingIssues, largeSectionsWithoutSubheading };
}

// ---- Readability ------------------------------------------------------------

export type ReadabilityFindingType = 'long-paragraph' | 'long-sentence' | 'large-block';

export interface ReadabilityFinding {
  type: ReadabilityFindingType;
  message: string;
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [];
}

export function analyzeReadability(html: string): ReadabilityFinding[] {
  const blocks = splitProseBlocks(html);
  const findings: ReadabilityFinding[] = [];

  let runBlocks: ProseBlock[] = [];
  let runWords = 0;

  const flushRun = () => {
    if (runBlocks.length >= LARGE_RUN_MIN_BLOCKS && runWords > LARGE_RUN_WORDS) {
      findings.push({ type: 'large-block', message: `${runBlocks.length} paragraphs in a row (${runWords} words) with no heading, list, or quote to break them up.` });
    }
    runBlocks = [];
    runWords = 0;
  };

  for (const block of blocks) {
    if (block.tag === 'h2' || block.tag === 'h3' || block.tag === 'h4' || block.tag === 'ul' || block.tag === 'ol' || block.tag === 'blockquote') {
      flushRun();
      continue;
    }
    if (block.tag !== 'p') continue;

    runBlocks.push(block);
    runWords += block.wordCount;

    if (block.wordCount > LONG_PARAGRAPH_WORDS) {
      findings.push({ type: 'long-paragraph', message: `A paragraph runs ${block.wordCount} words — consider splitting it up for easier reading.` });
    }
    for (const sentence of splitSentences(block.text)) {
      const words = countWords(sentence);
      if (words > LONG_SENTENCE_WORDS) {
        findings.push({ type: 'long-sentence', message: `A sentence runs about ${words} words — consider breaking it into shorter sentences.` });
      }
    }
  }
  flushRun();

  return findings;
}

// ---- Introduction -----------------------------------------------------------

export interface IntroductionAnalysis {
  wordCount: number;
  isLong: boolean;
  /** null when there's no primary query set to check against. */
  mentionsPrimaryQuery: boolean | null;
}

export function analyzeIntroduction(html: string, primaryQuery?: string | null): IntroductionAnalysis {
  const blocks = splitProseBlocks(html);
  const introBlocks: ProseBlock[] = [];
  for (const block of blocks) {
    if (block.tag === 'h2' || block.tag === 'h3' || block.tag === 'h4') break;
    introBlocks.push(block);
  }
  const introText = introBlocks.map((b) => b.text).join(' ');
  const wordCount = countWords(introText);

  return { wordCount, isLong: wordCount > LONG_INTRO_WORDS, mentionsPrimaryQuery: textLikelyMentionsQuery(introText, primaryQuery) };
}

// ---- Word count (plain information, never a requirement) --------------------

export function articleWordCount(html: string): number {
  return countWords(blogContentPlainText(html));
}
