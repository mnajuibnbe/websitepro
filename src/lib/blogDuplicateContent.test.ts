import assert from 'node:assert/strict';
import test from 'node:test';
import { findSimilarPosts, type DuplicateContentCandidate } from './blogDuplicateContent';

const originalArticle = '<p>Retinol is one of the most studied ingredients in cosmeceutical skincare. It works by increasing skin cell turnover, which helps fade dark spots and smooth fine lines over several months of consistent use. Most professionals recommend starting with a low concentration two or three nights a week before building up tolerance. Pairing retinol with a daily broad spectrum sunscreen is essential, since retinol can increase sun sensitivity. Clients with very reactive or compromised skin barriers should wait until their skin has calmed down before introducing it.</p>';

const nearDuplicateArticle = '<p>Retinol is one of the most researched ingredients in cosmeceutical skincare. It works by speeding up skin cell turnover, which helps fade dark spots and smooth fine lines over several months of regular use. Most professionals suggest starting with a low concentration two or three nights a week before building up tolerance. Pairing retinol with a daily broad spectrum sunscreen is essential, because retinol can increase sun sensitivity. Clients with very reactive or compromised skin barriers should wait until their skin has settled before starting it.</p>';

const distinctArticle = '<p>Choosing a professional micro-needling device means weighing needle depth, motor speed, and cartridge safety features against the treatment plan for each client. Shorter needles under half a millimeter are generally reserved for at-home maintenance, while clinical depths are used for scarring and stretch marks under a trained practitioner. Sterile, single-use cartridges are non-negotiable for cross-contamination control. A thorough client consultation should always screen for active acne, keloid history, and blood-clotting medications before any session is booked.</p>';

const candidates: DuplicateContentCandidate[] = [
  { id: 1, title: 'The Complete Guide to Retinol', contentHtml: originalArticle },
  { id: 2, title: 'Choosing a Micro-Needling Device', contentHtml: distinctArticle },
];

test('flags a near-duplicate (reworded) article as similar', () => {
  const matches = findSimilarPosts(nearDuplicateArticle, null, candidates);
  assert.ok(matches.some((m) => m.id === 1), 'expected the reworded retinol article to be flagged against the original');
  const match = matches.find((m) => m.id === 1)!;
  assert.ok(match.similarityPercent >= 30, `expected similarity >= 30, got ${match.similarityPercent}`);
});

test('does not flag a genuinely distinct article on a different topic', () => {
  const matches = findSimilarPosts(nearDuplicateArticle, null, candidates);
  assert.ok(!matches.some((m) => m.id === 2), 'unrelated micro-needling article should not be flagged');
});

test('excludes the post being edited from its own candidate list', () => {
  const matches = findSimilarPosts(originalArticle, 1, candidates);
  assert.ok(!matches.some((m) => m.id === 1));
});

test('returns no matches for empty content', () => {
  assert.deepEqual(findSimilarPosts('', null, candidates), []);
  assert.deepEqual(findSimilarPosts('<p></p>', null, candidates), []);
});

test('results are sorted by similarity, highest first', () => {
  const nearDuplicateOfDistinct = distinctArticle.replace('professional micro-needling device', 'clinical micro-needling tool');
  const extendedCandidates: DuplicateContentCandidate[] = [
    ...candidates,
    { id: 3, title: 'Micro-Needling Devices, Revisited', contentHtml: distinctArticle },
  ];
  const matches = findSimilarPosts(nearDuplicateOfDistinct, null, extendedCandidates);
  assert.ok(matches.length >= 1);
  for (let i = 1; i < matches.length; i += 1) {
    assert.ok(matches[i - 1].similarityPercent >= matches[i].similarityPercent);
  }
});
