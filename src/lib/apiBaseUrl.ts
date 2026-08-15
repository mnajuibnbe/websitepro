// Video and PDF file bytes are served from the Cloudflare Worker in production
// (token issuance stays same-origin on Vercel); local/dev defaults to same-origin
// unless VITE_API_BASE_URL is set explicitly.
export const API_BASE_URL = String(
  import.meta.env?.VITE_API_BASE_URL || (import.meta.env?.PROD ? 'https://tutiba-video-stream.tutiba.workers.dev' : ''),
).replace(/\/$/, '');
