export type PricingCurrency = 'EGP' | 'USD';
export type PricingCountryGroup = 'egypt' | 'international';
export type PricingSource = 'profile' | 'vercel-header' | 'persisted-choice' | 'default';
export interface PricingContext { countryCode: string | null; countryGroup: PricingCountryGroup; currency: PricingCurrency; source: PricingSource; }
export interface LocalizedCoursePrice extends PricingContext { amount: string | null; formatted: string; available: boolean; isFree: boolean; }
export interface CoursePriceFields { price_egp?: number | string | null; price_usd?: number | string | null; }
// Tutiba is Egypt-first: unknown locations consistently see EGP rather than a
// temporary USD value while regional pricing is resolving.
export const DEFAULT_PRICING_CONTEXT: PricingContext = { countryCode: 'EG', countryGroup: 'egypt', currency: 'EGP', source: 'default' };

export function contextForCountry(countryCode: string | null | undefined, source: PricingSource): PricingContext {
  const normalized = countryCode?.trim().toUpperCase() || null;
  const egypt = normalized === 'EG';
  return { countryCode: normalized, countryGroup: egypt ? 'egypt' : 'international', currency: egypt ? 'EGP' : 'USD', source };
}

function normalizeAmount(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text) || Number(text) < 0) return null;
  return text;
}

export function formatCourseAmount(amount: string, currency: PricingCurrency): string {
  const numeric = Number(amount);
  const decimals = Number.isInteger(numeric) ? 0 : 2;
  const formatted = new Intl.NumberFormat(currency === 'EGP' ? 'en-EG' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: 2 }).format(numeric);
  return `${currency} ${formatted}`;
}

export function resolveCoursePrice(course: CoursePriceFields, context: PricingContext = DEFAULT_PRICING_CONTEXT): LocalizedCoursePrice {
  const amount = normalizeAmount(context.currency === 'EGP' ? course.price_egp : course.price_usd);
  const isFree = amount !== null && Number(amount) === 0;
  return { ...context, amount, available: amount !== null, isFree, formatted: amount === null ? 'Price unavailable — contact support' : isFree ? 'Free' : formatCourseAmount(amount, context.currency) };
}
