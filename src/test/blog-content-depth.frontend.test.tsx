import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFrontend } from './renderFrontend';
import { InternalLinkingPanel } from '../components/blog/InternalLinkingPanel';
import { OriginalValuePanel } from '../components/blog/OriginalValuePanel';
import { SourcesPanel } from '../components/blog/SourcesPanel';
import { BlogSourcesList } from '../components/blog/BlogSourcesList';
import { TopicInsightsPanel } from '../components/blog/TopicInsightsPanel';

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
