import assert from 'node:assert/strict';
import test from 'node:test';
import { amountToMinorUnits, resolveServerPricingContext } from './pricing.service';
const req = (country?: string) => ({ headers: country ? { 'x-vercel-ip-country': country } : {} }) as any;
test('trusted profile country wins over Vercel header', () => assert.equal(resolveServerPricingContext(req('US'), { app_metadata: { billing_country: 'EG' } } as any).currency, 'EGP'));
test('Vercel country and safe default resolve correctly', () => {
  assert.equal(resolveServerPricingContext(req('EG')).currency, 'EGP');
  assert.equal(resolveServerPricingContext(req()).currency, 'USD');
});
test('decimal money converts without floating point arithmetic', () => assert.equal(amountToMinorUnits('45.50'), 4550n));
