// scripts/prerender.mjs sets this via Playwright's context.addInitScript()
// before crawling each route. Client code checks it to skip anything that
// should only happen for a real visitor — e.g. injecting the deferred GTM
// script tag or swapping the font link's rel — so a prerendered snapshot
// (served as static HTML to every visitor, not just crawlers) captures the
// same pristine, non-blocking initial markup a real browser would get,
// rather than whatever state the page happened to mutate into during the
// crawl's wait time.
declare global {
  interface Window { __PRERENDERING__?: boolean }
}

export function isPrerendering(): boolean {
  return typeof window !== 'undefined' && window.__PRERENDERING__ === true;
}
