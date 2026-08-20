type GtagArgs = [command: string, ...rest: unknown[]];

declare global {
  interface Window {
    dataLayer?: GtagArgs[];
    gtag?: (...args: GtagArgs) => void;
  }
}

const MEASUREMENT_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID as string | undefined;

export const isAnalyticsEnabled = Boolean(import.meta.env?.PROD && MEASUREMENT_ID);

// Query params that can carry auth/recovery secrets. Stripped from every
// outgoing page_location regardless of which route they show up on, since
// Supabase's recovery redirect lands on paths other than /update-password.
const SENSITIVE_SEARCH_PARAMS = ['token_hash', 'access_token', 'refresh_token', 'provider_token', 'provider_refresh_token', 'code'];

// Routes that exist only to consume a one-time secret from the URL: the
// entire query string is dropped rather than allow-listed, as defense in
// depth beyond the param-name strip above.
const SENSITIVE_PATHNAMES = new Set(['/update-password']);

let initialized = false;
let scriptLoaded = false;

// Sets up window.dataLayer/gtag immediately so every trackXxx() call below can
// queue events from the first render onward. Cheap and synchronous — no
// network request. The actual gtag.js download is deferred separately (see
// loadAnalyticsScript) since that's the part that costs bytes and main-thread
// time; queued dataLayer events are replayed once it lands, so no events are
// lost by delaying it.
export function initAnalytics(): void {
  if (!isAnalyticsEnabled || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  const gtag: NonNullable<Window['gtag']> = (...args) => { window.dataLayer!.push(args); };
  window.gtag = gtag;

  gtag('js', new Date());
  // send_page_view: false disables both gtag.js's automatic initial page_view
  // and its history-based (pushState/popstate) page_view tracking, so route
  // changes only produce a page_view via the explicit trackPageView calls below.
  gtag('config', MEASUREMENT_ID as string, { send_page_view: false });
}

// Injects the actual gtag.js <script>. Split out from initAnalytics so callers
// can delay this specifically until after first paint / idle time — it's the
// part that downloads and executes ~300KB of third-party JS.
export function loadAnalyticsScript(): void {
  if (!isAnalyticsEnabled || scriptLoaded) return;
  scriptLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function sanitizedPageLocation(pathname: string, search: string): string {
  if (SENSITIVE_PATHNAMES.has(pathname) || !search) {
    return `${window.location.origin}${pathname}`;
  }
  const params = new URLSearchParams(search);
  SENSITIVE_SEARCH_PARAMS.forEach(key => params.delete(key));
  const cleaned = params.toString();
  return `${window.location.origin}${pathname}${cleaned ? `?${cleaned}` : ''}`;
}

export function trackPageView(pathname: string, search: string): void {
  if (!isAnalyticsEnabled || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_location: sanitizedPageLocation(pathname, search),
    page_path: pathname,
    page_title: document.title,
  });
}

type EventParams = Record<string, string | number | boolean | undefined>;

function trackEvent(name: string, params?: EventParams): void {
  if (!isAnalyticsEnabled || !window.gtag) return;
  const cleaned = params && Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  window.gtag('event', name, cleaned);
}

export function trackCourseDetailViewed(courseId: string): void {
  trackEvent('course_detail_viewed', { course_id: courseId });
}

export function trackCheckoutStarted(courseId: string): void {
  trackEvent('checkout_started', { course_id: courseId });
}

export function trackOrderCreated(orderId: string, courseId?: string): void {
  trackEvent('order_created', { order_id: orderId, course_id: courseId });
}

export function trackPaymentProofSubmitted(orderId: string): void {
  trackEvent('payment_proof_submitted', { order_id: orderId });
}

export function trackEnrollmentActivated(courseId: string, orderId?: string): void {
  trackEvent('enrollment_activated', { course_id: courseId, order_id: orderId });
}

export function trackCoursePreviewStarted(courseId: string): void {
  trackEvent('course_preview_started', { course_id: courseId });
}

export function trackCourseContentViewed(courseId: string): void {
  trackEvent('course_content_viewed', { course_id: courseId });
}
