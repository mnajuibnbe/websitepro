import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { contextForCountry, DEFAULT_PRICING_CONTEXT, type PricingContext } from '../../lib/pricing.js';

const ISO_COUNTRY = /^[A-Z]{2}$/;

export function resolveServerPricingContext(req: Pick<Request, 'headers'>, user?: User | null): PricingContext {
  // app_metadata is set only by a trusted server/admin, unlike user_metadata.
  const profileCountry = user?.app_metadata?.billing_country || user?.app_metadata?.country;
  if (typeof profileCountry === 'string' && ISO_COUNTRY.test(profileCountry.toUpperCase())) {
    return contextForCountry(profileCountry, 'profile');
  }
  const header = req.headers['x-vercel-ip-country'];
  const country = Array.isArray(header) ? header[0] : header;
  if (typeof country === 'string' && ISO_COUNTRY.test(country.toUpperCase())) {
    return contextForCountry(country, 'vercel-header');
  }
  return DEFAULT_PRICING_CONTEXT;
}

export function amountToMinorUnits(amount: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Invalid authoritative amount');
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
