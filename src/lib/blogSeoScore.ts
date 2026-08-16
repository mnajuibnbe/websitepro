import { genericTitleHint, textLikelyMentionsQuery } from './blogSeo';
import { splitProseBlocks } from './blogProseBlocks';
import { analyzeHeadingStructure, analyzeIntroduction, analyzeReadability } from './blogSeoAnalysis';

/**
 * Combines every Phase 1/2 signal into one "Content SEO Score" panel. This is this
 * platform's own internal writing-readiness signal, explicitly not a Google ranking
 * score — Google has never published a formula like this, and the UI must say so
 * plainly (see the "not a Google score" disclaimer rendered by SeoSidebar). Three
 * categories are stubs until later phases add real analysis for them (Topic Coverage,
 * Internal Links, Trust/Sources — Phase 3): they show as "coming soon" and are excluded
 * from the weighted average rather than silently scored as 0.
 */

export interface ContentSeoScoreInput {
  title: string;
  effectiveSeoTitle: string;
  effectiveMetaDescription: string;
  contentHtml: string;
  primaryQuery: string | null;
  searchIntent: string | null;
  coverImageUrl: string | null;
}

export interface ScoreCategory {
  key: string;
  label: string;
  weight: number;
  status: 'scored' | 'stub';
  scorePercent: number | null;
  notes: string[];
}

export interface ContentSeoScore {
  overallPercent: number;
  categories: ScoreCategory[];
}

function checkScore(checks: Array<{ applicable: boolean; passed: boolean }>): number {
  const applicable = checks.filter((c) => c.applicable);
  if (applicable.length === 0) return 100;
  return Math.round((applicable.filter((c) => c.passed).length / applicable.length) * 100);
}

function hasAltText(imgHtml: string): boolean {
  const match = imgHtml.match(/\balt="([^"]*)"/i);
  return Boolean(match && match[1].trim());
}

export function computeContentSeoScore(input: ContentSeoScoreInput): ContentSeoScore {
  const heading = analyzeHeadingStructure(input.contentHtml);
  const readability = analyzeReadability(input.contentHtml);
  const intro = analyzeIntroduction(input.contentHtml, input.primaryQuery);
  const blocks = splitProseBlocks(input.contentHtml);
  const hasQuery = Boolean(input.primaryQuery?.trim());

  // --- Search Intent ---
  const searchIntent: ScoreCategory = {
    key: 'search_intent',
    label: 'Search Intent',
    weight: 10,
    status: 'scored',
    scorePercent: input.searchIntent ? 100 : 0,
    notes: input.searchIntent ? ['An intent is set — use it to guide the article\'s structure and call to action.'] : ['No search intent selected yet. This is for your own planning; it isn\'t analyzed automatically.'],
  };

  // --- Content Quality ---
  let qualityScore = 100;
  const qualityNotes: string[] = [];
  if (readability.length > 0) {
    qualityScore -= Math.min(60, readability.length * 8);
    qualityNotes.push(`${readability.length} readability suggestion${readability.length === 1 ? '' : 's'} (long paragraphs/sentences or dense blocks).`);
  }
  if (heading.largeSectionsWithoutSubheading.length > 0) {
    qualityScore -= Math.min(30, heading.largeSectionsWithoutSubheading.length * 10);
    qualityNotes.push(`${heading.largeSectionsWithoutSubheading.length} section${heading.largeSectionsWithoutSubheading.length === 1 ? '' : 's'} could use a subheading to break up a long stretch of text.`);
  }
  if (intro.isLong) {
    qualityScore -= 15;
    qualityNotes.push('The introduction runs long before getting to a heading.');
  }
  if (qualityNotes.length === 0) qualityNotes.push('No readability suggestions right now.');
  const contentQuality: ScoreCategory = {
    key: 'content_quality',
    label: 'Content Quality',
    weight: 30,
    status: 'scored',
    scorePercent: Math.max(0, Math.round(qualityScore)),
    notes: qualityNotes,
  };

  // --- On-page SEO ---
  const onPageChecks = [
    { applicable: true, passed: hasQuery, label: 'A target search query is set.' },
    { applicable: hasQuery, passed: textLikelyMentionsQuery(input.effectiveSeoTitle, input.primaryQuery) === true, label: 'The SEO title reflects the target query.' },
    { applicable: hasQuery, passed: textLikelyMentionsQuery(input.effectiveMetaDescription, input.primaryQuery) === true, label: 'The meta description reflects the target query.' },
    { applicable: true, passed: genericTitleHint(input.title) === null, label: 'The title is specific, not generic.' },
    { applicable: hasQuery, passed: intro.mentionsPrimaryQuery === true, label: 'The target query (or its topic) appears early in the article.' },
  ];
  const onPageSeo: ScoreCategory = {
    key: 'on_page_seo',
    label: 'On-page SEO',
    weight: 30,
    status: 'scored',
    scorePercent: checkScore(onPageChecks),
    notes: onPageChecks.filter((c) => c.applicable && !c.passed).map((c) => c.label).concat(hasQuery ? [] : ['Set a target search query above to unlock the rest of these checks.']),
  };

  // --- Technical Readiness ---
  const images = blocks.filter((b) => b.tag === 'img');
  const imagesMissingAlt = images.filter((img) => !hasAltText(img.html)).length;
  const technicalChecks = [
    { applicable: true, passed: heading.nestingIssues.length === 0, label: 'Heading levels are properly nested (no skipped levels).' },
    { applicable: images.length > 0, passed: imagesMissingAlt === 0, label: 'Every image has alt text.' },
    { applicable: true, passed: Boolean(input.coverImageUrl), label: 'A cover image is set.' },
    { applicable: true, passed: blocks.length > 0, label: 'The article has content.' },
  ];
  const technicalReadiness: ScoreCategory = {
    key: 'technical_readiness',
    label: 'Technical Readiness',
    weight: 15,
    status: 'scored',
    scorePercent: checkScore(technicalChecks),
    notes: technicalChecks.filter((c) => c.applicable && !c.passed).map((c) => c.label),
  };

  const stub = (key: string, label: string): ScoreCategory => ({ key, label, weight: 0, status: 'stub', scorePercent: null, notes: ['Coming in a later phase.'] });

  const categories: ScoreCategory[] = [
    searchIntent,
    stub('topic_coverage', 'Topic Coverage'),
    contentQuality,
    onPageSeo,
    stub('internal_links', 'Internal Links'),
    stub('trust_sources', 'Trust & Sources'),
    technicalReadiness,
  ];

  const scored = categories.filter((c): c is ScoreCategory & { scorePercent: number } => c.status === 'scored' && c.scorePercent !== null);
  const totalWeight = scored.reduce((sum, c) => sum + c.weight, 0);
  const overallPercent = totalWeight > 0 ? Math.round(scored.reduce((sum, c) => sum + c.weight * c.scorePercent, 0) / totalWeight) : 0;

  return { overallPercent, categories };
}
