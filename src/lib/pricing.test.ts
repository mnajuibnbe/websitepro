import assert from 'node:assert/strict';
import test from 'node:test';
import { contextForCountry, DEFAULT_PRICING_CONTEXT, resolveCoursePrice } from './pricing';
const course = { price_egp: '1500', price_usd: '45.50' };
test('Egypt resolves independent EGP price', () => assert.equal(resolveCoursePrice(course, contextForCountry('eg', 'vercel-header')).formatted, 'EGP 1,500'));
test('international and missing country resolve USD', () => {
  assert.equal(resolveCoursePrice(course, contextForCountry('US', 'vercel-header')).formatted, 'USD 45.50');
  assert.equal(resolveCoursePrice(course, DEFAULT_PRICING_CONTEXT).currency, 'USD');
});
test('free and missing regional prices are explicit', () => {
  assert.equal(resolveCoursePrice({ price_egp: 0 }, contextForCountry('EG', 'profile')).formatted, 'Free');
  assert.equal(resolveCoursePrice({ price_egp: 10, price_usd: null }).available, false);
});
