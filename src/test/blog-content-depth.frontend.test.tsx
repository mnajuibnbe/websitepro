import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFrontend } from './renderFrontend';
import { InternalLinkingPanel } from '../components/blog/InternalLinkingPanel';
import { OriginalValuePanel } from '../components/blog/OriginalValuePanel';
import { SourcesPanel } from '../components/blog/SourcesPanel';
import { BlogSourcesList } from '../components/blog/BlogSourcesList';
import { TopicInsightsPanel } from '../components/blog/TopicInsightsPanel';
import { DuplicateContentPanel } from '../components/blog/DuplicateContentPanel';
import { GooglePerformancePanel } from '../components/blog/GooglePerformancePanel';
import type { BlogPost } from '../services/blogPosts.service';

test('internal linking assistant shows a loading state before its Supabase fetch resolves', () => {
  const markup = renderFrontend(<InternalLinkingPanel postId={null} title="Retinol Guide" primaryQuery="retinol" secondaryQueries={[]} contentHtml="" onInsertContent={() => {}} />);
  assert.match(markup, /Loading suggestions/);
});

test('original value checker lists every self-reported signal as a checkbox', () => {
  const markup = renderFrontend(<OriginalValuePanel signals={['data']} onChange={() => {}} />);
  assert.match(markup, /Personal experience/);
  assert.match(markup, /Testing results/);
  assert.match(markup, /Unique process/);
  assert.match(markup, /type="checkbox"/);
});

test('sources panel renders existing sources and an add-source form', () => {
  const markup = renderFrontend(<SourcesPanel sources={[{ name: 'Dermatology Study', url: 'https://example.com/study', accessedDate: '2026-08-16' }]} onChange={() => {}} />);
  assert.match(markup, /Dermatology Study/);
  assert.match(markup, /example\.com/);
  assert.match(markup, /Add source/);
});

test('sources panel renders no list when there are no sources yet', () => {
  const markup = renderFrontend(<SourcesPanel sources={[]} onChange={() => {}} />);
  assert.doesNotMatch(markup, /<ul/);
  assert.match(markup, /Add source/);
});

test('public blog sources list renders numbered citation links, or nothing when empty', () => {
  const withSources = renderFrontend(<BlogSourcesList sources={[{ name: 'Dermatology Study', url: 'https://example.com/study', accessedDate: '2026-08-16' }]} />);
  assert.match(withSources, /Sources/);
  assert.match(withSources, /Dermatology Study/);
  assert.match(withSources, /rel="noopener noreferrer nofollow"/);

  const empty = renderFrontend(<BlogSourcesList sources={[]} />);
  assert.doesNotMatch(empty, /Sources/);
});

test('topic insights panel prompts for a topic instead of offering to analyze when none is set', () => {
  const markup = renderFrontend(<TopicInsightsPanel title="" primaryQuery="" contentHtml="" onInsertContent={() => {}} />);
  assert.match(markup, /Set a title or target query/);
  assert.doesNotMatch(markup, />Analyze</);
});

test('topic insights panel offers an explicit Analyze trigger once a topic exists, not an automatic call', () => {
  const markup = renderFrontend(<TopicInsightsPanel title="Retinol Guide" primaryQuery="" contentHtml="" onInsertContent={() => {}} />);
  assert.match(markup, />Analyze</);
  assert.doesNotMatch(markup, /Analyzing…/);
  assert.doesNotMatch(markup, /Questions readers may have/);
});

test('Google performance panel asks the admin to save first when the post has never been saved, even if a slug has already been auto-filled from the title', () => {
  // Regression: SeoSidebar auto-fills `slug` from `title` before the post is ever saved
  // (see AdminBlogPosts.tsx's Title onChange), so a non-empty slug alone does not mean a
  // real, indexed post exists yet -- only `postId !== null` does.
  const markup = renderFrontend(<GooglePerformancePanel postId={null} slug="draft-title-not-saved-yet" />);
  assert.match(markup, /Save this post to see its live Google Search Console performance/);
  assert.doesNotMatch(markup, /Loading Search Console data/);
});

test('Google performance panel asks the admin to save first when there is no slug yet either', () => {
  const markup = renderFrontend(<GooglePerformancePanel postId={null} slug="" />);
  assert.match(markup, /Save this post to see its live Google Search Console performance/);
});

test('Google performance panel starts loading once the post has a real id and slug', () => {
  const markup = renderFrontend(<GooglePerformancePanel postId={42} slug="retinol-guide" />);
  assert.match(markup, /Loading Search Console data/);
  assert.doesNotMatch(markup, /Save this post/);
});

const makePost = (overrides: Partial<BlogPost>): BlogPost => ({
  id: 1, slug: 'post', title: 'Post', excerpt: 'Excerpt', content: '', cover_image_url: null,
  status: 'published', published_at: null, created_at: '2026-01-01', updated_at: '2026-01-01',
  seo_title: null, meta_description: null, primary_keyword: null, secondary_keywords: [],
  search_intent: null, original_value_signals: [], sources: [], ...overrides,
});

const retinolArticle = '<p>Retinol is one of the most studied ingredients in cosmeceutical skincare. It works by increasing skin cell turnover, which helps fade dark spots and smooth fine lines over several months of consistent use. Most professionals recommend starting with a low concentration two or three nights a week before building up tolerance.</p>';
const rewordedRetinolArticle = '<p>Retinol is one of the most researched ingredients in cosmeceutical skincare. It works by speeding up skin cell turnover, which helps fade dark spots and smooth fine lines over several months of regular use. Most professionals suggest starting with a low concentration two or three nights a week before building up tolerance.</p>';

test('duplicate content checker shows a clean state when nothing else is similar', () => {
  const posts = [makePost({ id: 2, title: 'Choosing a Micro-Needling Device', content: '<p>Needle depth, motor speed, and cartridge safety all matter when selecting a device for clinical use.</p>' })];
  const markup = renderFrontend(<DuplicateContentPanel currentId={null} contentHtml={retinolArticle} posts={posts} />);
  assert.match(markup, /No highly similar existing articles found/);
});

test('duplicate content checker flags a near-duplicate existing post by title and similarity percent', () => {
  const posts = [makePost({ id: 2, title: 'The Complete Guide to Retinol', content: retinolArticle })];
  const markup = renderFrontend(<DuplicateContentPanel currentId={null} contentHtml={rewordedRetinolArticle} posts={posts} />);
  assert.match(markup, /reads similar to an existing article/);
  assert.match(markup, /The Complete Guide to Retinol/);
  assert.match(markup, /\d+% similar/);
});

test('duplicate content checker excludes the post currently being edited', () => {
  const posts = [makePost({ id: 1, title: 'The Complete Guide to Retinol', content: retinolArticle })];
  const markup = renderFrontend(<DuplicateContentPanel currentId={1} contentHtml={retinolArticle} posts={posts} />);
  assert.match(markup, /No highly similar existing articles found/);
});
