import { useDeferredValue, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, BookMarked, ChevronDown, CheckCircle2, Copy, Gauge, Heading2, Info, Link2, ListChecks, Plus, Sparkles, Target, Type, X } from 'lucide-react';
import type { BlogPost, BlogSearchIntent, BlogSource, OriginalValueSignal } from '../../services/blogPosts.service';
import { deriveCanonicalUrl, genericTitleHint, metaDescriptionHint, seoTitleHint, textLikelyMentionsQuery } from '../../lib/blogSeo';
import { sanitizeBlogContentHtml } from '../../lib/blogContentHtml';
import { analyzeHeadingStructure, analyzeIntroduction, analyzeReadability, articleWordCount } from '../../lib/blogSeoAnalysis';
import { computeContentSeoScore } from '../../lib/blogSeoScore';
import { DuplicateContentPanel } from './DuplicateContentPanel';
import { InternalLinkingPanel } from './InternalLinkingPanel';
import { OriginalValuePanel } from './OriginalValuePanel';
import { SourcesPanel } from './SourcesPanel';
import { TopicInsightsPanel } from './TopicInsightsPanel';

interface SeoSidebarProps {
  postId: number | null;
  title: string;
  slug: string;
  effectiveSeoTitle: string;
  effectiveMetaDescription: string;
  contentHtml: string;
  onContentChange: (html: string) => void;
  coverImageUrl: string | null;
  primaryQuery: string;
  onPrimaryQueryChange: (value: string) => void;
  secondaryQueries: string[];
  onSecondaryQueriesChange: (value: string[]) => void;
  searchIntent: BlogSearchIntent | null;
  onSearchIntentChange: (value: BlogSearchIntent | null) => void;
  originalValueSignals: OriginalValueSignal[];
  onOriginalValueSignalsChange: (value: OriginalValueSignal[]) => void;
  sources: BlogSource[];
  onSourcesChange: (value: BlogSource[]) => void;
  allPosts: BlogPost[];
}

const SEARCH_INTENT_OPTIONS: Array<{ value: BlogSearchIntent; label: string }> = [
  { value: 'informational', label: 'Informational — answering a question' },
  { value: 'how_to', label: 'How-to — a step-by-step task' },
  { value: 'comparison', label: 'Comparison — X vs Y' },
  { value: 'commercial_investigation', label: 'Commercial investigation — researching options' },
  { value: 'transactional', label: 'Transactional — ready to act' },
  { value: 'navigational', label: 'Navigational — looking for a specific page' },
];

function Panel({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-primary-200 bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-primary-900"><Icon className="h-4 w-4 text-accent-600" />{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-primary-700">{children}</div>
    </section>
  );
}

/** Groups sidebar panels under a small eyebrow label so the ordering reads as a workflow (plan → preview → check → strengthen), not a flat, equal-weight stack. */
function Tier({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="px-1 text-xs font-bold uppercase tracking-eyebrow text-primary-400">{label}</p>
      {children}
    </div>
  );
}

/** Read-only preview of what actually ships to Google -- replaces the old editable "SEO title & description" override fields (now automatic; see IMPLEMENTATION_LOG.md). */
function SnippetPreview({ url, title, description }: { url: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3">
      <p className="truncate text-xs text-primary-500">{url}</p>
      <p className="mt-0.5 truncate text-[15px] font-medium text-accent-700">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-primary-600">{description}</p>
    </div>
  );
}

function Suggestion({ tone = 'info', children }: { tone?: 'info' | 'good' | 'warn'; children: React.ReactNode }) {
  const icon = tone === 'good' ? <CheckCircle2 className="h-4 w-4 flex-none text-success-600" /> : tone === 'warn' ? <AlertTriangle className="h-4 w-4 flex-none text-warning-600" /> : <Info className="h-4 w-4 flex-none text-primary-400" />;
  return <p className="flex items-start gap-2 text-sm leading-relaxed text-primary-700">{icon}<span>{children}</span></p>;
}

function ScoreBar({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Coming soon</span>;
  const color = percent >= 80 ? 'bg-success-500' : percent >= 50 ? 'bg-warning-500' : 'bg-danger-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-primary-100"><div className={`h-full ${color}`} style={{ width: `${percent}%` }} /></div>
      <span className="w-9 text-right text-xs font-bold text-primary-700">{percent}%</span>
    </div>
  );
}

export function SeoSidebar({ postId, title, slug, effectiveSeoTitle, effectiveMetaDescription, contentHtml, onContentChange, coverImageUrl, primaryQuery, onPrimaryQueryChange, secondaryQueries = [], onSecondaryQueriesChange, searchIntent, onSearchIntentChange, originalValueSignals, onOriginalValueSignalsChange, sources, onSourcesChange, allPosts }: SeoSidebarProps) {
  const [secondaryDraft, setSecondaryDraft] = useState('');
  const deferredContent = useDeferredValue(contentHtml);
  // Content-depth tools (internal linking, sources, duplicate check, topic coverage) matter
  // once there's a real draft to work with, not on a blank page -- collapsed by default for
  // a fresh post, open by default when resuming one that already has content. Controlled
  // (not re-derived from wordCount on every render) so a manual toggle always sticks.
  const [strengthenOpen, setStrengthenOpen] = useState(() => articleWordCount(contentHtml) > 50);

  const heading = useMemo(() => analyzeHeadingStructure(deferredContent), [deferredContent]);
  const readability = useMemo(() => analyzeReadability(deferredContent), [deferredContent]);
  const intro = useMemo(() => analyzeIntroduction(deferredContent, primaryQuery), [deferredContent, primaryQuery]);
  const wordCount = useMemo(() => articleWordCount(deferredContent), [deferredContent]);
  const score = useMemo(
    () => computeContentSeoScore({ title, effectiveSeoTitle, effectiveMetaDescription, contentHtml: deferredContent, primaryQuery: primaryQuery || null, searchIntent, coverImageUrl, originalValueSignals, sources }),
    [title, effectiveSeoTitle, effectiveMetaDescription, deferredContent, primaryQuery, searchIntent, coverImageUrl, originalValueSignals, sources],
  );

  const titleMentionsQuery = textLikelyMentionsQuery(effectiveSeoTitle, primaryQuery);
  const descriptionMentionsQuery = textLikelyMentionsQuery(effectiveMetaDescription, primaryQuery);
  const titleGenericHint = genericTitleHint(title);
  const canonicalUrl = slug ? deriveCanonicalUrl(window.location.origin, slug) : `${window.location.origin}/blog/…`;
  const queryMatchesTitle = primaryQuery.trim().length > 0 && primaryQuery.trim().toLowerCase() === title.trim().toLowerCase();

  const addSecondaryQuery = () => {
    const value = secondaryDraft.trim();
    if (!value || secondaryQueries.includes(value)) { setSecondaryDraft(''); return; }
    onSecondaryQueriesChange([...secondaryQueries, value]);
    setSecondaryDraft('');
  };
  const removeSecondaryQuery = (value: string) => onSecondaryQueriesChange(secondaryQueries.filter((q) => q !== value));

  return (
    <aside className="space-y-5 lg:sticky lg:top-8 lg:h-fit">
      <Tier label="1. Plan">
        <Panel icon={Target} title="Search phrase readers would type">
          <label className="block text-xs font-bold text-primary-600">Search query
            <input value={primaryQuery} onChange={(e) => onPrimaryQueryChange(e.target.value)} placeholder="What should someone search to find this article?" className="mt-1 min-h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
          </label>
          <p className="text-xs text-primary-500">
            {queryMatchesTitle
              ? 'Auto-filled from your title. Readers often search something shorter and plainer than a headline — e.g. title "The Complete Guide to Retinol for Sensitive Skin" but query "retinol for sensitive skin". Edit it above if that\'s the case here; every check below (title/description match, topic coverage, internal linking) uses this, not the title.'
              : 'Customized — this drives the title/description match checks below, topic coverage analysis, and internal link suggestions.'}
          </p>
          <label className="block text-xs font-bold text-primary-600">Secondary queries (optional)
            <div className="mt-1 flex gap-2">
              <input
                value={secondaryDraft}
                onChange={(e) => setSecondaryDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSecondaryQuery(); } }}
                placeholder="Add a related query…"
                className="min-h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
              />
              <button type="button" onClick={addSecondaryQuery} aria-label="Add secondary query" className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50"><Plus className="h-4 w-4" /></button>
            </div>
          </label>
          {secondaryQueries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {secondaryQueries.map((q) => (
                <span key={q} className="flex items-center gap-1 rounded-full bg-primary-100 py-1 pl-3 pr-1.5 text-xs font-medium text-primary-700">
                  {q}
                  <button type="button" onClick={() => removeSecondaryQuery(q)} aria-label={`Remove ${q}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary-200"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel icon={ListChecks} title="Search intent">
          <select value={searchIntent || ''} onChange={(e) => onSearchIntentChange((e.target.value || null) as BlogSearchIntent | null)} className="min-h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500">
            <option value="">Not set</option>
            {SEARCH_INTENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <p className="text-xs text-primary-500">Helps you plan the article's structure and call to action — not analyzed automatically.</p>
        </Panel>
      </Tier>

      <Tier label="2. Check as you write">
        <Panel icon={Heading2} title="Heading structure">
          <Suggestion tone="good">Exactly one H1 — the post title itself.</Suggestion>
          {heading.usesH2Sections
            ? <Suggestion tone="good">{heading.h2Count} H2 section{heading.h2Count === 1 ? '' : 's'}{heading.h3Count > 0 ? `, ${heading.h3Count} H3 subsection${heading.h3Count === 1 ? '' : 's'}` : ''}.</Suggestion>
            : <Suggestion>No H2 sections yet — longer articles are often easier to scan with a few.</Suggestion>}
          {heading.nestingIssues.map((issue, i) => <Suggestion key={i} tone="warn">{issue}</Suggestion>)}
          {heading.largeSectionsWithoutSubheading.map((section, i) => <Suggestion key={i} tone="warn">{`"${section.headingText}" runs ${section.wordCount} words with no subheading — consider breaking it up with an H3.`}</Suggestion>)}
        </Panel>

        <Panel icon={AlertTriangle} title="Readability">
          {readability.length === 0
            ? <Suggestion tone="good">No readability suggestions right now.</Suggestion>
            : readability.map((finding, i) => <Suggestion key={i} tone="warn">{finding.message}</Suggestion>)}
        </Panel>

        <Panel icon={Info} title="Introduction">
          <Suggestion tone={intro.isLong ? 'warn' : 'good'}>{`About ${intro.wordCount} words before the first heading${intro.isLong ? ' — this reads long for an opening.' : '.'}`}</Suggestion>
          {intro.mentionsPrimaryQuery === true && <Suggestion tone="good">Your target query's topic appears early — good for both readers and search engines.</Suggestion>}
          {intro.mentionsPrimaryQuery === false && <Suggestion tone="warn">Your target query's topic doesn't clearly appear in the opening — consider stating the main subject early.</Suggestion>}
          {intro.mentionsPrimaryQuery === null && <Suggestion>Set a search query above to check whether it's covered early.</Suggestion>}
        </Panel>

        <Panel icon={Type} title="Word count">
          <p className="text-2xl font-bold text-primary-900">{wordCount.toLocaleString()}</p>
          <p className="text-xs text-primary-500">Shown for reference only — Google has stated word count is not a quality or ranking signal.</p>
        </Panel>
      </Tier>

      <Tier label="3. Search snippet preview">
        <Panel icon={Target} title="How this appears in Google">
          <SnippetPreview url={canonicalUrl} title={effectiveSeoTitle} description={effectiveMetaDescription} />
          <p className="text-xs text-primary-500">Title and canonical URL are derived from your title/slug automatically. The description is written by AI once you publish (or reused from the last time it was written) — nothing to fill in here.</p>
          <Suggestion tone={seoTitleHint(effectiveSeoTitle) ? 'warn' : 'good'}>{seoTitleHint(effectiveSeoTitle) || 'Title length looks fine.'}</Suggestion>
          {titleGenericHint && <Suggestion tone="warn">{titleGenericHint}</Suggestion>}
          {titleMentionsQuery === true && <Suggestion tone="good">The title reflects your target query.</Suggestion>}
          {titleMentionsQuery === false && <Suggestion tone="warn">The title doesn't clearly reflect your target query.</Suggestion>}
          <Suggestion tone={metaDescriptionHint(effectiveMetaDescription) ? 'warn' : 'good'}>{metaDescriptionHint(effectiveMetaDescription) || 'Description length looks fine.'}</Suggestion>
          {descriptionMentionsQuery === true && <Suggestion tone="good">The description reflects your target query.</Suggestion>}
          {descriptionMentionsQuery === false && <Suggestion tone="warn">The description doesn't clearly reflect your target query.</Suggestion>}
        </Panel>
      </Tier>

      <details className="group" open={strengthenOpen} onToggle={(e) => setStrengthenOpen(e.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-1 py-1 text-xs font-bold uppercase tracking-eyebrow text-primary-400 hover:text-primary-600">
          <span>4. Strengthen (once you have a draft)</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
          <Panel icon={Link2} title="Internal Linking Assistant">
            <InternalLinkingPanel postId={postId} title={title} primaryQuery={primaryQuery} secondaryQueries={secondaryQueries} contentHtml={deferredContent} onInsertContent={(html) => onContentChange(sanitizeBlogContentHtml(`${contentHtml}${html}`))} />
          </Panel>

          <Panel icon={BadgeCheck} title="Original Value Checker">
            <p className="text-xs text-primary-500">Self-reported — check off what this specific article actually has. Nothing here is auto-detected.</p>
            <OriginalValuePanel signals={originalValueSignals} onChange={onOriginalValueSignalsChange} />
          </Panel>

          <Panel icon={BookMarked} title="Sources & Citations">
            <SourcesPanel sources={sources} onChange={onSourcesChange} />
          </Panel>

          <Panel icon={Copy} title="Duplicate Content Checker">
            <DuplicateContentPanel currentId={postId} contentHtml={deferredContent} posts={allPosts} />
          </Panel>

          <Panel icon={Sparkles} title="Topic Coverage & Reader Questions">
            <TopicInsightsPanel title={title} primaryQuery={primaryQuery} contentHtml={deferredContent} onInsertContent={(html) => onContentChange(sanitizeBlogContentHtml(`${contentHtml}${html}`))} />
          </Panel>
        </div>
      </details>

      <section className="rounded-xl border border-accent-200 bg-accent-50/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary-900"><Gauge className="h-4 w-4 text-accent-600" />Content SEO Score</h3>
        <p className="mt-1 text-xs font-medium text-primary-600">Tutiba's own internal writing-readiness signal — <span className="font-bold">not a Google ranking score</span>. Google has never published a scoring formula like this one.</p>
        <p className="mt-3 text-3xl font-bold text-primary-900">{score.overallPercent}<span className="text-base font-semibold text-primary-500">/100</span></p>
        <div className="mt-3 space-y-2">
          {score.categories.map((category) => (
            <div key={category.key} className="flex items-center justify-between gap-3">
              <span className={`text-xs font-medium ${category.status === 'stub' ? 'text-primary-400' : 'text-primary-700'}`}>{category.label}</span>
              <ScoreBar percent={category.scorePercent} />
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
