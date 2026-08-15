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

export async function verifyStreamToken(token: string, secret: string, expectedResourceType: 'video' | 'pdf'): Promise<StreamTokenPayload> {
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
  // Scoped so a document token cannot be replayed against the video endpoint (or vice versa).
  if (!payload.fileId || payload.resourceType !== expectedResourceType) throw new Error(`Token is not valid for ${expectedResourceType} streaming`);
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
  if (!response.ok) {
    // Temporary diagnostic: surfaces Google's actual error reason in wrangler tail,
    // since mapDriveError only forwards the bare status code to the client.
    const body = await response.text().catch(() => '');
    console.error(`Drive metadata request failed (${response.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
    throw Object.assign(new Error(`Drive metadata request failed (${response.status})`), { status: response.status });
  }
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
// chaining a second bounded fetch for the remainder when the requested span is
// larger, then exposes the two as a single continuous stream. Callers still see one
// response with the correct Content-Length, matching what a client that asked for
// [start, end] expects regardless of how many upstream fetches it took.
async function fetchDriveRangeStream(env: Env, fileId: string, start: number, end: number): Promise<ReadableStream<Uint8Array>> {
  const params = new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' });
  const initialEnd = Math.min(start + INITIAL_RANGE_BYTES - 1, end);
  const first = await driveFetch(env, fileId, params, { Range: `bytes=${start}-${initialEnd}` });
  if (!first.ok || !first.body) {
    // Temporary diagnostic: surfaces Google's actual error reason in wrangler tail.
    const body = await first.text().catch(() => '');
    console.error(`Drive media request failed (${first.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
    throw Object.assign(new Error(`Drive media request failed (${first.status})`), { status: first.status });
  }
  if (initialEnd >= end) return first.body;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  (async () => {
    try {
      await pumpReaderIntoWriter(first.body!, writer);
      const rest = await driveFetch(env, fileId, params, { Range: `bytes=${initialEnd + 1}-${end}` });
      if (!rest.ok || !rest.body) throw Object.assign(new Error(`Drive media request failed (${rest.status})`), { status: rest.status });
      await pumpReaderIntoWriter(rest.body, writer);
      await writer.close();
    } catch (error) {
      await writer.abort(error);
    }
  })();
  return readable;
}

// A "no Range" request wants the whole file as one continuous stream starting at 0.
async function fetchFullMediaBody(env: Env, fileId: string, fileSize: number): Promise<ReadableStream<Uint8Array>> {
  return fetchDriveRangeStream(env, fileId, 0, fileSize - 1);
}

// Concatenates in-memory bytes (already fetched/cached) with a lazily-streamed
// continuation, exposed as a single stream. Used to stitch the cached faststart
// prefix (ftyp + relocated moov) onto the Drive-streamed mdat continuation below.
function concatBytesWithStream(prefix: Uint8Array, rest: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  (async () => {
    try {
      await writer.write(prefix);
      await pumpReaderIntoWriter(rest, writer);
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

async function proxyTokenRequest(request: Request, env: Env, path: string): Promise<Response> {
  const origin = request.headers.get('Origin');
  const issuerBase = origin && isAllowedOrigin(origin, env) ? origin : env.TOKEN_ISSUER_BASE_URL;
  const issuer = issuerBase.replace(/\/$/, '');
  if (!issuer) return jsonResponse({ error: 'TOKEN_ISSUER_BASE_URL is not configured' }, 500);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const authorization = request.headers.get('Authorization');
  if (authorization) headers.set('Authorization', authorization);
  const response = await fetch(`${issuer}${path}`, { method: 'POST', headers, body: await request.arrayBuffer() });
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8' } });
}

function mapDriveError(error: unknown, metadataRequest: boolean): Response {
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 0;
  if (metadataRequest) return new Response(null, { status: [403, 404, 429].includes(status) ? status : 502 });
  if (status === 403 || status === 429) return jsonResponse({ error: 'Media source unavailable. Please try again later.' }, status);
  if (status === 404) return jsonResponse({ error: 'Media not found.' }, 404);
  return jsonResponse({ error: 'Failed to stream media.' }, 500);
}

// ---- MP4 "moov faststart" relocation ----------------------------------------
//
// Lesson videos are exported/recorded with the moov atom (the sample/chunk index)
// written AFTER mdat (the media payload) — standard output for many simple muxers,
// but it forces browsers to seek to the end of a 100MB+ file before they can start
// decoding anything, which is the ~40s start-of-playback delay this fixes.
// Re-encoding every existing video with `ffmpeg -movflags +faststart` isn't
// practical, so this relocates moov in front of mdat on the fly:
//   - mdat's bytes are never touched (media payload stays bit-for-bit identical,
//     always streamed straight from Drive, same as before this change).
//   - moov is fetched once per fileId, its stco/co64 chunk-offset tables are
//     patched by the exact number of bytes mdat shifts forward by, and the small
//     relocated prefix (ftyp + any leading boxes + rewritten moov) is cached in KV
//     so it's computed at most once per lesson, ever, across every viewer/colo.
// This is a from-scratch reimplementation of the qt-faststart algorithm rather
// than the `moov-faststart` npm package: that package's API relocates moov by
// operating on a single in-memory Buffer of the whole file, which doesn't fit a
// Worker's per-isolate memory budget for 100MB+ lesson videos, and this worker
// deliberately has no package.json / dependency graph (see cloudflare-types.d.ts).

interface Mp4BoxHeader {
  type: string;
  headerSize: number;
  boxSize: number;
}

const MAX_UINT32 = 0xffffffff;

export function readBoxHeader(view: DataView, offset: number): Mp4BoxHeader | null {
  if (offset + 8 > view.byteLength) return null;
  const size32 = view.getUint32(offset);
  const type = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7));
  if (size32 === 1) {
    if (offset + 16 > view.byteLength) return null;
    const high = view.getUint32(offset + 8);
    const low = view.getUint32(offset + 12);
    return { type, headerSize: 16, boxSize: high * 2 ** 32 + low };
  }
  // size32 === 0 ("extends to end of file") is legal MP4 but leaves no room for a
  // trailing moov box to relocate, so it is treated the same as "not found" below.
  return { type, headerSize: 8, boxSize: size32 };
}

interface LeadingBoxLayout {
  mdatStart: number;
  mdatDeclaredSize: number;
  alreadyFastStart: boolean;
}

// Scans top-level boxes from the start of the file looking for mdat. If moov is
// found first, the file is already faststart (or never needed it) and nothing
// should be relocated. headBytes only needs to cover ftyp/free/etc. — never mdat's
// payload — so FASTSTART_HEAD_SCAN_BYTES is generous by a wide margin.
export function scanLeadingBoxes(headBytes: Uint8Array): LeadingBoxLayout | null {
  const view = new DataView(headBytes.buffer, headBytes.byteOffset, headBytes.byteLength);
  let offset = 0;
  while (offset + 8 <= headBytes.byteLength) {
    const header = readBoxHeader(view, offset);
    if (!header || header.boxSize < header.headerSize) return null;
    if (header.type === 'moov') return { mdatStart: offset, mdatDeclaredSize: header.boxSize, alreadyFastStart: true };
    if (header.type === 'mdat') return { mdatStart: offset, mdatDeclaredSize: header.boxSize, alreadyFastStart: false };
    offset += header.boxSize;
  }
  return null;
}

// Only these box types can contain stco/co64 further down the tree
// (moov > trak > mdia > minf > stbl > {stco|co64}), per ISO/IEC 14496-12.
const MOOV_CONTAINER_TYPES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

function patchStco(view: DataView, contentStart: number, contentEnd: number, delta: number): boolean {
  if (contentStart + 8 > contentEnd) return false;
  const entryCount = view.getUint32(contentStart + 4);
  const entriesStart = contentStart + 8;
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = entriesStart + index * 4;
    if (entryOffset + 4 > contentEnd) return false;
    const newValue = view.getUint32(entryOffset) + delta;
    if (newValue > MAX_UINT32) return false; // would need co64 upgrade; bail to passthrough instead
    view.setUint32(entryOffset, newValue);
  }
  return true;
}

function patchCo64(view: DataView, contentStart: number, contentEnd: number, delta: number): boolean {
  if (contentStart + 8 > contentEnd) return false;
  const entryCount = view.getUint32(contentStart + 4);
  const entriesStart = contentStart + 8;
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = entriesStart + index * 8;
    if (entryOffset + 8 > contentEnd) return false;
    const high = view.getUint32(entryOffset);
    const low = view.getUint32(entryOffset + 4);
    const combined = high * 2 ** 32 + low + delta;
    view.setUint32(entryOffset, Math.floor(combined / 2 ** 32));
    view.setUint32(entryOffset + 4, combined % 2 ** 32);
  }
  return true;
}

// Walks a standalone buffer containing exactly one top-level moov box and adds
// `delta` to every absolute chunk offset in every stco/co64 table at any depth.
// Returns false if relocation cannot be safely applied (malformed box, or a
// patched offset would overflow a 32-bit stco entry), signalling the caller to
// fall back to unmodified passthrough for this file rather than risk a corrupt index.
export function patchChunkOffsets(moovBytes: Uint8Array, delta: number): boolean {
  const view = new DataView(moovBytes.buffer, moovBytes.byteOffset, moovBytes.byteLength);

  function walk(start: number, end: number): boolean {
    let offset = start;
    while (offset + 8 <= end) {
      const header = readBoxHeader(view, offset);
      if (!header || header.boxSize < header.headerSize || offset + header.boxSize > end) return false;
      const contentStart = offset + header.headerSize;
      const contentEnd = offset + header.boxSize;
      if (header.type === 'stco') {
        if (!patchStco(view, contentStart, contentEnd, delta)) return false;
      } else if (header.type === 'co64') {
        if (!patchCo64(view, contentStart, contentEnd, delta)) return false;
      } else if (MOOV_CONTAINER_TYPES.has(header.type)) {
        if (!walk(contentStart, contentEnd)) return false;
      }
      offset += header.boxSize;
    }
    return true;
  }

  return walk(0, moovBytes.byteLength);
}

interface FaststartActive {
  status: 'active';
  prefixBytes: Uint8Array; // ftyp + any leading boxes (unchanged) + rewritten moov
  mdatStart: number; // offset where mdat begins, in both the original file and prefixBytes
  fileSize: number;
}
interface FaststartPassthrough {
  status: 'passthrough';
  fileSize: number;
}
type FaststartResult = FaststartActive | FaststartPassthrough;

// Isolate-local cache backed by KV, same warm/cold-start pattern as
// driveMetadataCache above: instant on a warm isolate, KV read (no Drive round
// trip) on a cold one, full recompute only on a true first-ever view.
const faststartCache = new Map<string, FaststartResult>();
const FASTSTART_KV_PREFIX = 'video:faststart:';
const FASTSTART_HEAD_SCAN_BYTES = 262_144;
const FASTSTART_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

interface FaststartKvMetadata {
  fileSize: number;
  mdatStart?: number;
  passthrough?: boolean;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function fetchDriveRangeBytes(env: Env, fileId: string, start: number, end: number): Promise<Uint8Array> {
  const response = await driveFetch(env, fileId, new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' }), { Range: `bytes=${start}-${end}` });
  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '');
    console.error(`Drive media request failed (${response.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
    throw Object.assign(new Error(`Drive media request failed (${response.status})`), { status: response.status });
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function readFaststartFromKv(kv: KVNamespace, fileId: string): Promise<FaststartResult | null> {
  try {
    const { value, metadata } = await kv.getWithMetadata<FaststartKvMetadata>(`${FASTSTART_KV_PREFIX}${fileId}`, 'arrayBuffer');
    if (!metadata) return null;
    if (metadata.passthrough) return { status: 'passthrough', fileSize: metadata.fileSize };
    if (!value || typeof metadata.mdatStart !== 'number') return null;
    return { status: 'active', prefixBytes: new Uint8Array(value), mdatStart: metadata.mdatStart, fileSize: metadata.fileSize };
  } catch {
    return null;
  }
}

async function writeFaststartToKv(kv: KVNamespace, fileId: string, result: FaststartResult): Promise<void> {
  try {
    const key = `${FASTSTART_KV_PREFIX}${fileId}`;
    const value = result.status === 'active' ? toArrayBuffer(result.prefixBytes) : new ArrayBuffer(0);
    const metadata: FaststartKvMetadata = result.status === 'active'
      ? { fileSize: result.fileSize, mdatStart: result.mdatStart }
      : { fileSize: result.fileSize, passthrough: true };
    await kv.put(key, value, { expirationTtl: FASTSTART_CACHE_TTL_SECONDS, metadata });
  } catch {
    // Best-effort: a KV write failure just means the next request recomputes.
  }
}

// Builds the relocated prefix for a fileId never seen before (isolate- or KV-cold).
// Only ftyp/leading-box bytes and the moov atom itself are ever fetched or cached
// here — mdat (the actual audio/video payload) is never read into memory or stored.
async function buildFaststartPrefix(env: Env, fileId: string, fileSize: number): Promise<FaststartResult> {
  const headBytes = await fetchDriveRangeBytes(env, fileId, 0, Math.min(FASTSTART_HEAD_SCAN_BYTES, fileSize) - 1);
  const layout = scanLeadingBoxes(headBytes);
  if (!layout || layout.alreadyFastStart) return { status: 'passthrough', fileSize };

  const moovStart = layout.mdatStart + layout.mdatDeclaredSize;
  if (moovStart >= fileSize) return { status: 'passthrough', fileSize };
  const moovSize = fileSize - moovStart;

  const moovBytes = await fetchDriveRangeBytes(env, fileId, moovStart, fileSize - 1);
  const moovView = new DataView(moovBytes.buffer, moovBytes.byteOffset, moovBytes.byteLength);
  const moovHeader = readBoxHeader(moovView, 0);
  if (!moovHeader || moovHeader.type !== 'moov' || moovHeader.boxSize !== moovBytes.byteLength) return { status: 'passthrough', fileSize };

  const delta = moovSize; // mdat shifts forward by exactly the relocated moov's size
  if (!patchChunkOffsets(moovBytes, delta)) return { status: 'passthrough', fileSize };

  const prefixBytes = new Uint8Array(layout.mdatStart + moovSize);
  prefixBytes.set(headBytes.subarray(0, layout.mdatStart), 0);
  prefixBytes.set(moovBytes, layout.mdatStart);
  return { status: 'active', prefixBytes, mdatStart: layout.mdatStart, fileSize };
}

async function getFaststartPrefix(env: Env, ctx: ExecutionContext, fileId: string, fileSize: number): Promise<FaststartResult> {
  const cached = faststartCache.get(fileId);
  if (cached && cached.fileSize === fileSize) return cached;

  const stored = await readFaststartFromKv(env.VIDEO_EDGE_KV, fileId);
  if (stored && stored.fileSize === fileSize) {
    faststartCache.set(fileId, stored);
    return stored;
  }

  const result = await buildFaststartPrefix(env, fileId, fileSize);
  faststartCache.set(fileId, result);
  ctx.waitUntil(writeFaststartToKv(env.VIDEO_EDGE_KV, fileId, result));
  return result;
}

async function streamVideo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return jsonResponse({ error: 'Missing streaming token' }, 401);
  let fileId: string;
  try {
    fileId = (await verifyStreamToken(token, env.STREAMING_TOKEN_SECRET, 'video')).fileId;
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
      if (!Number.isNaN(parsedEnd)) end = Math.min(parsedEnd, fileSize - 1);
    }
    if (Number.isNaN(start) || start >= fileSize || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
  }

  // The homepage intro never reaches this: it's small and already served from the
  // shared edge cache above whenever warm. Faststart relocation is scoped to the
  // large (100MB+) lesson/course-trailer videos that actually suffer the trailing-
  // moov delay. A failure here (e.g. a transient Drive error) must never break
  // playback, so it degrades to the unmodified passthrough path below.
  const faststart = isPublicHomepageIntro ? null : await getFaststartPrefix(env, ctx, fileId, fileSize).catch(() => null);

  try {
    const headers = new Headers({ 'Content-Type': mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });

    if (faststart && faststart.status === 'active') {
      const prefixBytes = faststart.prefixBytes;
      const prefixLen = prefixBytes.byteLength;
      const moovSize = prefixLen - faststart.mdatStart;
      const mdatByteCount = fileSize - prefixLen; // original mdat box size; total size is unchanged by relocation
      const mdatEnd = faststart.mdatStart + mdatByteCount - 1;

      if (start === null) {
        const mdatStream = await fetchDriveRangeStream(env, fileId, faststart.mdatStart, mdatEnd);
        headers.set('Content-Length', String(fileSize));
        return new Response(concatBytesWithStream(prefixBytes, mdatStream), { status: 200, headers });
      }

      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', String(end - start + 1));

      if (end < prefixLen) {
        // Entirely inside the cached ftyp+moov prefix: no Drive round trip at all.
        return new Response(prefixBytes.slice(start, end + 1), { status: 206, headers });
      }

      const driveStart = Math.max(start, prefixLen) - moovSize;
      const driveEnd = end - moovSize;
      const mdatStream = await fetchDriveRangeStream(env, fileId, driveStart, driveEnd);

      if (start >= prefixLen) return new Response(mdatStream, { status: 206, headers });
      // Spans the prefix/mdat boundary: stitch the cached tail of the prefix onto
      // the Drive-streamed mdat continuation.
      return new Response(concatBytesWithStream(prefixBytes.slice(start), mdatStream), { status: 206, headers });
    }

    if (start === null) {
      const body = await fetchFullMediaBody(env, fileId, fileSize);
      headers.set('Content-Length', String(fileSize));
      return new Response(body, { status: 200, headers });
    }

    const upstream = await driveFetch(env, fileId, new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' }), { Range: `bytes=${start}-${end}` });
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      console.error(`Drive media request failed (${upstream.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
      throw Object.assign(new Error(`Drive media request failed (${upstream.status})`), { status: upstream.status });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(upstream.body, { status: 206, headers });
  } catch (error) {
    return mapDriveError(error, false);
  }
}

// ---- PDF document streaming ---------------------------------------------------
//
// Mirrors the video token/stream split above (token issuance stays on Vercel via
// proxyTokenRequest; only the file bytes are served from here), but PDFs are
// small enough (course lesson documents, not 100MB+ video) that none of the
// faststart relocation or chained-range machinery above is needed — a single
// direct Drive fetch, optionally range-scoped, is sufficient.

interface DriveDocumentMetadata {
  fileSize: number;
  mimeType: string;
  name: string;
  expiresAt: number;
}

const driveDocumentMetadataCache = new Map<string, DriveDocumentMetadata>();
const DRIVE_DOCUMENT_METADATA_KV_PREFIX = 'drive:document-metadata:';

async function getDriveDocumentMetadata(env: Env, fileId: string): Promise<DriveDocumentMetadata> {
  const cached = driveDocumentMetadataCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const kvKey = `${DRIVE_DOCUMENT_METADATA_KV_PREFIX}${fileId}`;
  const stored = await readKvJson<DriveDocumentMetadata>(env.VIDEO_EDGE_KV, kvKey);
  if (stored && stored.expiresAt > Date.now()) {
    driveDocumentMetadataCache.set(fileId, stored);
    return stored;
  }

  const response = await driveFetch(env, fileId, new URLSearchParams({ fields: 'size,mimeType,name', supportsAllDrives: 'true' }));
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`Drive document metadata request failed (${response.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
    throw Object.assign(new Error(`Drive document metadata request failed (${response.status})`), { status: response.status });
  }
  const data = await response.json() as { size?: string; mimeType?: string; name?: string };
  const fileSize = Number(data.size || 0);
  const mimeType = data.mimeType || '';
  if (!Number.isFinite(fileSize) || fileSize <= 0 || mimeType !== 'application/pdf') throw new Error('Drive document metadata is invalid');
  const metadata = { fileSize, mimeType, name: data.name || 'lesson.pdf', expiresAt: Date.now() + DRIVE_METADATA_TTL_MS };
  driveDocumentMetadataCache.set(fileId, metadata);
  await writeKvJson(env.VIDEO_EDGE_KV, kvKey, metadata, DRIVE_METADATA_TTL_MS / 1000);
  return metadata;
}

function safeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, '_').slice(0, 180) || 'lesson.pdf';
}

async function streamDocument(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return jsonResponse({ error: 'Missing document token' }, 401);
  let fileId: string;
  try {
    fileId = (await verifyStreamToken(token, env.STREAMING_TOKEN_SECRET, 'pdf')).fileId;
  } catch {
    return jsonResponse({ error: 'Invalid or expired document token' }, 401);
  }

  let metadata: DriveDocumentMetadata;
  try {
    metadata = await getDriveDocumentMetadata(env, fileId);
  } catch (error) {
    return mapDriveError(error, request.method === 'HEAD');
  }
  const { fileSize, mimeType, name } = metadata;
  const disposition = `inline; filename="${safeFilename(name)}"`;

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': mimeType,
        'Content-Disposition': disposition,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const range = request.headers.get('Range');
  let start = 0;
  let end = fileSize - 1;
  let isRanged = false;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    start = Number.parseInt(parts[0], 10);
    if (parts[1]?.trim()) {
      const parsedEnd = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(parsedEnd)) end = Math.min(parsedEnd, fileSize - 1);
    }
    if (Number.isNaN(start) || start >= fileSize || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
    isRanged = true;
  }

  try {
    const upstream = await driveFetch(env, fileId, new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' }), isRanged ? { Range: `bytes=${start}-${end}` } : undefined);
    if (!upstream.ok || !upstream.body) {
      const body = await upstream.text().catch(() => '');
      console.error(`Drive document media request failed (${upstream.status}) fileId=${fileId}: ${body.slice(0, 1000)}`);
      throw Object.assign(new Error(`Drive document media request failed (${upstream.status})`), { status: upstream.status });
    }
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Disposition': disposition,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (isRanged) {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', String(end - start + 1));
      return new Response(upstream.body, { status: 206, headers });
    }
    headers.set('Content-Length', String(fileSize));
    return new Response(upstream.body, { status: 200, headers });
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
    if (pathname === '/api/video/token' && request.method === 'POST') response = await proxyTokenRequest(request, env, '/api/video/token');
    else if (pathname === '/api/video/stream' && (request.method === 'GET' || request.method === 'HEAD')) response = await streamVideo(request, env, ctx);
    else if (pathname === '/api/documents/token' && request.method === 'POST') response = await proxyTokenRequest(request, env, '/api/documents/token');
    else if (pathname === '/api/documents/file' && (request.method === 'GET' || request.method === 'HEAD')) response = await streamDocument(request, env);
    else response = jsonResponse({ error: 'Not found' }, 404);
    return withCors(response, env, request);
  },
};
