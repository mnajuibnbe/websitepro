interface Env {
  ALLOWED_ORIGIN: string;
  TOKEN_ISSUER_BASE_URL: string;
  STREAMING_TOKEN_SECRET: string;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  VIDEO_EDGE_KV: KVNamespace;
}

interface StreamTokenPayload {
  fileId: string;
  resourceType: 'video' | 'pdf';
  iat?: number;
  exp?: number;
  nbf?: number;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface DriveMetadata {
  fileSize: number;
  mimeType: string;
  expiresAt: number;
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_METADATA_TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
// Isolate-local caches: instant on a warm isolate, but empty on every cold start.
// Backed by VIDEO_EDGE_KV below so a cold isolate reads KV (fast) instead of
// re-running the Google OAuth + Drive metadata round trips (slow).
const driveMetadataCache = new Map<string, DriveMetadata>();
let googleAccessTokenCache: CachedGoogleToken | null = null;

// Must match HOMEPAGE_INTRO_FILE_ID in src/server/controllers/video.controller.ts.
// This is the ONLY fileId ever served from the shared edge cache below — course and
// lesson videos never match it, so they can never be cached or shared cross-visitor.
const HOMEPAGE_INTRO_FILE_ID = '1Dbt6IIl0vLQYlXcuKE4_Vkkja-JYB9EC';
const PUBLIC_CACHE_TTL_SECONDS = 60 * 60;
// Google Drive's media endpoint is slow to start streaming when no Range header is
// sent at all. Requesting an explicit bounded range keeps it fast even when the
// client asked for the whole file, so a "no Range" request is served via two chained
// bounded upstream fetches instead of one unbounded one.
const INITIAL_RANGE_BYTES = 3 * 1024 * 1024;
const GOOGLE_TOKEN_KV_KEY = 'google:access-token';
const DRIVE_METADATA_KV_PREFIX = 'drive:metadata:';

interface CachedGoogleToken {
  token: string;
  expiresAt: number;
}

async function readKvJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    return (await kv.get(key, 'json')) as T | null;
  } catch {
    // KV is a latency optimization on top of the isolate-memory cache and the
    // origin round trip; treat any KV failure as a cache miss, never as a hard error.
    return null;
  }
}

async function writeKvJson(kv: KVNamespace, key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, Math.floor(ttlSeconds)) });
  } catch {
    // Best-effort warm of the next cold start; failures here must not fail the request.
  }
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function bytesToBase64Url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function utf8ToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function verifyStreamToken(token: string, secret: string): Promise<StreamTokenPayload> {
  const segments = token.split('.');
  if (segments.length !== 3) throw new Error('Malformed JWT');
  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = JSON.parse(decoder.decode(base64UrlToBytes(encodedHeader))) as { alg?: string; typ?: string };
  if (header.alg !== 'HS256') throw new Error('Unexpected JWT algorithm');

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${encodedHeader}.${encodedPayload}`)));
  const actual = base64UrlToBytes(encodedSignature);
  if (!timingSafeEqual(expected, actual)) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(decoder.decode(base64UrlToBytes(encodedPayload))) as StreamTokenPayload;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === 'number' && now < payload.nbf) throw new Error('JWT is not active');
  if (typeof payload.exp === 'number' && now >= payload.exp) throw new Error('JWT expired');
  if (!payload.fileId || payload.resourceType !== 'video') throw new Error('Token is not valid for video streaming');
  return payload;
}

function parseServiceAccount(value: string): ServiceAccountCredentials {
  try {
    return JSON.parse(value) as ServiceAccountCredentials;
  } catch {
    try {
      return JSON.parse(decoder.decode(Uint8Array.from(atob(value), character => character.charCodeAt(0)))) as ServiceAccountCredentials;
    } catch {
      throw new Error('Invalid Google Service Account configuration');
    }
  }
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0)).buffer;
}

async function getGoogleAccessToken(env: Env): Promise<string> {
  const safetyMarginMs = 60_000;
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > Date.now() + safetyMarginMs) return googleAccessTokenCache.token;

  const stored = await readKvJson<CachedGoogleToken>(env.VIDEO_EDGE_KV, GOOGLE_TOKEN_KV_KEY);
  if (stored && stored.expiresAt > Date.now() + safetyMarginMs) {
    googleAccessTokenCache = stored;
    return stored.token;
  }

  const credentials = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!credentials.client_email || !credentials.private_key) throw new Error('Invalid Google Service Account configuration');
  const tokenUrl = credentials.token_uri || GOOGLE_TOKEN_URL;
  const issuedAt = Math.floor(Date.now() / 1000);
  const encodedHeader = utf8ToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedClaim = utf8ToBase64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: DRIVE_SCOPE,
    aud: tokenUrl,
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const signingInput = `${encodedHeader}.${encodedClaim}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(signingInput)));
  const assertion = `${signingInput}.${bytesToBase64Url(signature)}`;
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!tokenResponse.ok) throw new Error(`Google OAuth request failed (${tokenResponse.status})`);
  const result = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!result.access_token) throw new Error('Google OAuth response did not include an access token');
  const expiresInSeconds = result.expires_in || 3600;
  const tokenRecord: CachedGoogleToken = { token: result.access_token, expiresAt: Date.now() + expiresInSeconds * 1000 };
  googleAccessTokenCache = tokenRecord;
  await writeKvJson(env.VIDEO_EDGE_KV, GOOGLE_TOKEN_KV_KEY, tokenRecord, expiresInSeconds - 60);
  return result.access_token;
}

async function driveFetch(env: Env, fileId: string, parameters: URLSearchParams, headers?: HeadersInit): Promise<Response> {
  const accessToken = await getGoogleAccessToken(env);
  const url = `${DRIVE_API_BASE_URL}/${encodeURIComponent(fileId)}?${parameters.toString()}`;
  return fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, ...headers } });
}

async function getDriveMetadata(env: Env, fileId: string): Promise<DriveMetadata> {
  const cached = driveMetadataCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const kvKey = `${DRIVE_METADATA_KV_PREFIX}${fileId}`;
  const stored = await readKvJson<DriveMetadata>(env.VIDEO_EDGE_KV, kvKey);
  if (stored && stored.expiresAt > Date.now()) {
    driveMetadataCache.set(fileId, stored);
    return stored;
  }

  const response = await driveFetch(env, fileId, new URLSearchParams({ fields: 'size,mimeType', supportsAllDrives: 'true' }));
  if (!response.ok) throw Object.assign(new Error(`Drive metadata request failed (${response.status})`), { status: response.status });
  const data = await response.json() as { size?: string; mimeType?: string };
  const fileSize = Number(data.size || 0);
  const mimeType = data.mimeType || '';
  if (!Number.isFinite(fileSize) || fileSize <= 0 || !mimeType.startsWith('video/')) throw new Error('Drive video metadata is invalid');
  const metadata = { fileSize, mimeType, expiresAt: Date.now() + DRIVE_METADATA_TTL_MS };
  driveMetadataCache.set(fileId, metadata);
  await writeKvJson(env.VIDEO_EDGE_KV, kvKey, metadata, DRIVE_METADATA_TTL_MS / 1000);
  return metadata;
}

async function pumpReaderIntoWriter(readable: ReadableStream<Uint8Array>, writer: WritableStreamDefaultWriter<Uint8Array>): Promise<void> {
  const reader = readable.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) await writer.write(value);
    }
  } finally {
    reader.releaseLock();
  }
}

// Always asks Drive for an explicit bounded range (see INITIAL_RANGE_BYTES above),
// chaining a second bounded fetch for the remainder when the file is larger, then
// exposes the two as a single continuous stream. Callers still see one 200 response
// with the correct total Content-Length, matching what a client that sent no Range
// header expects.
async function fetchFullMediaBody(env: Env, fileId: string, fileSize: number): Promise<ReadableStream<Uint8Array>> {
  const params = new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' });
  const lastByte = fileSize - 1;
  const initialEnd = Math.min(INITIAL_RANGE_BYTES - 1, lastByte);
  const first = await driveFetch(env, fileId, params, { Range: `bytes=0-${initialEnd}` });
  if (!first.ok || !first.body) throw Object.assign(new Error(`Drive media request failed (${first.status})`), { status: first.status });
  if (initialEnd >= lastByte) return first.body;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  (async () => {
    try {
      await pumpReaderIntoWriter(first.body!, writer);
      const rest = await driveFetch(env, fileId, params, { Range: `bytes=${initialEnd + 1}-${lastByte}` });
      if (!rest.ok || !rest.body) throw Object.assign(new Error(`Drive media request failed (${rest.status})`), { status: rest.status });
      await pumpReaderIntoWriter(rest.body, writer);
      await writer.close();
    } catch (error) {
      await writer.abort(error);
    }
  })();
  return readable;
}

function publicCacheKeyUrl(request: Request, fileId: string): string {
  const url = new URL(request.url);
  url.pathname = `/__edge-cache/public-video/${fileId}`;
  url.search = '';
  return url.toString();
}

// The Workers Cache API does not auto-slice a stored response against a Range header
// on the lookup request — cache.match() only ever returns the object as stored. So a
// cache hit for a ranged request is served by reading the (already edge-local, no
// origin round trip) cached bytes into memory and slicing them here. Safe for the
// homepage intro's size; never used for lesson videos.
async function serveRangeFromCachedResponse(cached: Response, rangeHeader: string): Promise<Response> {
  // Content-Length does not reliably survive a cache.put()/match() round trip for a
  // streamed body, so the real size comes from the buffered bytes, not the header.
  const buffer = await cached.arrayBuffer();
  const totalSize = buffer.byteLength;
  const mimeType = cached.headers.get('Content-Type') || 'application/octet-stream';
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = Number.parseInt(parts[0], 10);
  let end = totalSize - 1;
  if (parts[1]?.trim()) {
    const parsedEnd = Number.parseInt(parts[1], 10);
    if (!Number.isNaN(parsedEnd)) end = Math.min(parsedEnd, totalSize - 1);
  }
  if (Number.isNaN(start) || start >= totalSize || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${totalSize}` } });
  }
  const slice = buffer.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    headers: {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Content-Length': String(end - start + 1),
      'Cache-Control': `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}`,
    },
  });
}

// Populates the shared Cloudflare edge cache with the full homepage-intro object so
// future requests at this colo (any visitor, GET or HEAD, ranged or not) are served
// straight from cache with zero Drive/Google round trips. Never called for lesson or
// course-trailer fileIds — see the isPublicHomepageIntro gate in streamVideo.
async function warmPublicVideoCache(env: Env, fileId: string, metadata: DriveMetadata, cacheKeyUrl: string): Promise<void> {
  const cache = caches.default;
  const baseRequest = new Request(cacheKeyUrl);
  if (await cache.match(baseRequest)) return;
  const body = await fetchFullMediaBody(env, fileId, metadata.fileSize);
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': metadata.mimeType,
      'Content-Length': String(metadata.fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}`,
    },
  });
  await cache.put(baseRequest, response);
}

const PREVIEW_ORIGIN_PATTERN = /^https:\/\/websitepro-[a-z0-9-]+-mnajuibnbes-projects\.vercel\.app$/;

function isAllowedOrigin(origin: string, env: Env): boolean {
  return origin === env.ALLOWED_ORIGIN || PREVIEW_ORIGIN_PATTERN.test(origin);
}

function corsHeaders(env: Env, request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
  const origin = request.headers.get('Origin');
  if (origin && isAllowedOrigin(origin, env)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function withCors(response: Response, env: Env, request: Request): Response {
  const headers = new Headers(response.headers);
  corsHeaders(env, request).forEach((value, name) => headers.set(name, value));
  return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

async function proxyTokenRequest(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const issuerBase = origin && isAllowedOrigin(origin, env) ? origin : env.TOKEN_ISSUER_BASE_URL;
  const issuer = issuerBase.replace(/\/$/, '');
  if (!issuer) return jsonResponse({ error: 'TOKEN_ISSUER_BASE_URL is not configured' }, 500);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const authorization = request.headers.get('Authorization');
  if (authorization) headers.set('Authorization', authorization);
  const response = await fetch(`${issuer}/api/video/token`, { method: 'POST', headers, body: await request.arrayBuffer() });
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8' } });
}

function mapDriveError(error: unknown, metadataRequest: boolean): Response {
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 0;
  if (metadataRequest) return new Response(null, { status: [403, 404, 429].includes(status) ? status : 502 });
  if (status === 403 || status === 429) return jsonResponse({ error: 'Media source unavailable. Please try again later.' }, status);
  if (status === 404) return jsonResponse({ error: 'Media not found.' }, 404);
  return jsonResponse({ error: 'Failed to stream media.' }, 500);
}

async function streamVideo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return jsonResponse({ error: 'Missing streaming token' }, 401);
  let fileId: string;
  try {
    fileId = (await verifyStreamToken(token, env.STREAMING_TOKEN_SECRET)).fileId;
  } catch {
    return jsonResponse({ error: 'Invalid or expired streaming token' }, 401);
  }

  // The homepage intro is the only asset ever eligible for the shared edge cache.
  // Everything else (lesson videos, course trailers) always falls through to the
  // per-request authorised Drive fetch below and is always sent no-store.
  const isPublicHomepageIntro = fileId === HOMEPAGE_INTRO_FILE_ID;
  const range = request.headers.get('Range');

  if (isPublicHomepageIntro) {
    try {
      const cachedFull = await caches.default.match(new Request(publicCacheKeyUrl(request, fileId)));
      if (cachedFull) return range ? await serveRangeFromCachedResponse(cachedFull, range) : cachedFull;
    } catch {
      // Cache API failure: fall through to the normal authorised-fetch path below.
    }
  }

  let metadata: DriveMetadata;
  try {
    metadata = await getDriveMetadata(env, fileId);
  } catch (error) {
    return mapDriveError(error, request.method === 'HEAD');
  }
  const { fileSize, mimeType } = metadata;

  if (isPublicHomepageIntro) {
    ctx.waitUntil(warmPublicVideoCache(env, fileId, metadata, publicCacheKeyUrl(request, fileId)).catch(() => undefined));
  }

  if (request.method === 'HEAD') return new Response(null, { status: 200, headers: { 'Content-Length': String(fileSize), 'Content-Type': mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' } });

  let start: number | null = null;
  let end = fileSize - 1;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    start = Number.parseInt(parts[0], 10);
    if (parts[1]?.trim()) {
      const parsedEnd = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(parsedEnd)) end = parsedEnd;
    }
    if (Number.isNaN(start) || start >= fileSize || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
  }

  try {
    const headers = new Headers({ 'Content-Type': mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    if (start === null) {
      const body = await fetchFullMediaBody(env, fileId, fileSize);
      headers.set('Content-Length', String(fileSize));
      return new Response(body, { status: 200, headers });
    }

    const upstream = await driveFetch(env, fileId, new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' }), { Range: `bytes=${start}-${end}` });
    if (!upstream.ok) throw Object.assign(new Error(`Drive media request failed (${upstream.status})`), { status: upstream.status });
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(upstream.body, { status: 206, headers });
  } catch (error) {
    return mapDriveError(error, false);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (origin && !isAllowedOrigin(origin, env)) return withCors(jsonResponse({ error: 'Origin not allowed' }, 403), env, request);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }), env, request);
    const pathname = new URL(request.url).pathname.replace(/\/$/, '');
    let response: Response;
    if (pathname === '/api/video/token' && request.method === 'POST') response = await proxyTokenRequest(request, env);
    else if (pathname === '/api/video/stream' && (request.method === 'GET' || request.method === 'HEAD')) response = await streamVideo(request, env, ctx);
    else response = jsonResponse({ error: 'Not found' }, 404);
    return withCors(response, env, request);
  },
};
