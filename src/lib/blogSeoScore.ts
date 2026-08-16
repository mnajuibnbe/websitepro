import { genericTitleHint, textLikelyMentionsQuery } from './blogSeo';
import { splitProseBlocks } from './blogProseBlocks';
import { analyzeHeadingStructure, analyzeIntroduction, analyzeReadability } from './blogSeoAnalysis';
import { countInternalLinks } from './blogInternalLinks';
import { originalValueScore } from './blogOriginalValue';
import type { BlogSource, OriginalValueSignal } from '../services/blogPosts.service';

/**
 * Combines every signal built so far into one "Content SEO Score" panel. This is this
 * platform's own internal writing-readiness signal, explicitly not a Google ranking
 * score — Google has never published a formula like this, and the UI must say so
 * plainly (see the "not a Google score" disclaimer rendered by SeoSidebar). Topic
 * Coverage remains a stub — it needs real topical judgment (an LLM call), which isn't
 * available in this environment yet — and shows as "coming soon", excluded from the
 * weighted average rather than silently scored as 0. Internal Links and Trust & Sources
 * (Phase 3) are real, computed from the article's own links, the self-reported Original
 * Value checklist, and added sources — no external API needed for either.
 */

export interface ContentSeoScoreInput {
  title: string;
  effectiveSeoTitle: string;
  effectiveMetaDescription: string;
  contentHtml: string;
  primaryQuery: string | null;
  searchIntent: string | null;
  coverImageUrl: string | null;
  originalValueSignals: OriginalValueSignal[];
  sources: BlogSource[];
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

  const stub = (key: string, label: string): ScoreCategory => ({ key, label, weight: 0, status: 'stub', scorePercent: null, notes: ['Coming in a later phase — needs an AI API key that is not yet configured.'] });

  // --- Internal Links ---
  const internalLinkCounts = countInternalLinks(input.contentHtml);
  const internalLinksChecks = [
    { applicable: true, passed: internalLinkCounts.total > 0, label: 'Link to at least one other page on the site — see the Internal Linking Assistant for suggestions.' },
    { applicable: true, passed: internalLinkCounts.uniqueHrefs.length >= 2, label: 'Consider linking to a couple of different related pages, not just one.' },
  ];
  const internalLinks: ScoreCategory = {
    key: 'internal_links',
    label: 'Internal Links',
    weight: 10,
    status: 'scored',
    scorePercent: checkScore(internalLinksChecks),
    notes: internalLinksChecks.filter((c) => !c.passed).map((c) => c.label),
  };

  // --- Trust & Sources ---
  const originalValuePercent = originalValueScore(input.originalValueSignals);
  const sourcesPercent = Math.min(100, input.sources.length * 50);
  const trustNotes: string[] = [];
  if (input.originalValueSignals.length === 0) trustNotes.push('No original value flagged yet — check off what this article actually has in Original Value.');
  if (input.sources.length === 0) trustNotes.push('No sources added yet — cite at least one source backing up claims in the article.');
  if (trustNotes.length === 0) trustNotes.push('Original value and sourcing look good.');
  const trustSources: ScoreCategory = {
    key: 'trust_sources',
    label: 'Trust & Sources',
    weight: 5,
    status: 'scored',
    scorePercent: Math.round((originalValuePercent + sourcesPercent) / 2),
    notes: trustNotes,
  };

  const categories: ScoreCategory[] = [
    searchIntent,
    stub('topic_coverage', 'Topic Coverage'),
    contentQuality,
    onPageSeo,
    internalLinks,
    trustSources,
    technicalReadiness,
  ];

  const scored = categories.filter((c): c is ScoreCategory & { scorePercent: number } => c.status === 'scored' && c.scorePercent !== null);
  const totalWeight = scored.reduce((sum, c) => sum + c.weight, 0);
  const overallPercent = totalWeight > 0 ? Math.round(scored.reduce((sum, c) => sum + c.weight * c.scorePercent, 0) / totalWeight) : 0;

  return { overallPercent, categories };
}
