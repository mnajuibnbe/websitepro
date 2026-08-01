interface Env {
  ALLOWED_ORIGIN: string;
  TOKEN_ISSUER_BASE_URL: string;
  STREAMING_TOKEN_SECRET: string;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
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
const driveMetadataCache = new Map<string, DriveMetadata>();
let googleAccessTokenCache: { token: string; expiresAt: number } | null = null;

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
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > Date.now() + 60_000) return googleAccessTokenCache.token;
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
  googleAccessTokenCache = { token: result.access_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000 };
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
  const response = await driveFetch(env, fileId, new URLSearchParams({ fields: 'size,mimeType', supportsAllDrives: 'true' }));
  if (!response.ok) throw Object.assign(new Error(`Drive metadata request failed (${response.status})`), { status: response.status });
  const data = await response.json() as { size?: string; mimeType?: string };
  const fileSize = Number(data.size || 0);
  const mimeType = data.mimeType || '';
  if (!Number.isFinite(fileSize) || fileSize <= 0 || !mimeType.startsWith('video/')) throw new Error('Drive video metadata is invalid');
  const metadata = { fileSize, mimeType, expiresAt: Date.now() + DRIVE_METADATA_TTL_MS };
  driveMetadataCache.set(fileId, metadata);
  return metadata;
}

function corsHeaders(env: Env, request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
  if (request.headers.get('Origin') === env.ALLOWED_ORIGIN) headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN);
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
  const issuer = env.TOKEN_ISSUER_BASE_URL.replace(/\/$/, '');
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

async function streamVideo(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return jsonResponse({ error: 'Missing streaming token' }, 401);
  let fileId: string;
  try {
    fileId = (await verifyStreamToken(token, env.STREAMING_TOKEN_SECRET)).fileId;
  } catch {
    return jsonResponse({ error: 'Invalid or expired streaming token' }, 401);
  }

  let metadata: DriveMetadata;
  try {
    metadata = await getDriveMetadata(env, fileId);
  } catch (error) {
    return mapDriveError(error, request.method === 'HEAD');
  }
  const { fileSize, mimeType } = metadata;
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers: { 'Content-Length': String(fileSize), 'Content-Type': mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' } });

  const range = request.headers.get('Range');
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
    const upstream = await driveFetch(
      env,
      fileId,
      new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' }),
      start === null ? undefined : { Range: `bytes=${start}-${end}` },
    );
    if (!upstream.ok) throw Object.assign(new Error(`Drive media request failed (${upstream.status})`), { status: upstream.status });
    const headers = new Headers({ 'Content-Type': mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    if (start === null) headers.set('Content-Length', String(fileSize));
    else {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', String(end - start + 1));
    }
    return new Response(upstream.body, { status: start === null ? 200 : 206, headers });
  } catch (error) {
    return mapDriveError(error, false);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (origin && origin !== env.ALLOWED_ORIGIN) return withCors(jsonResponse({ error: 'Origin not allowed' }, 403), env, request);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }), env, request);
    const pathname = new URL(request.url).pathname.replace(/\/$/, '');
    let response: Response;
    if (pathname === '/api/video/token' && request.method === 'POST') response = await proxyTokenRequest(request, env);
    else if (pathname === '/api/video/stream' && (request.method === 'GET' || request.method === 'HEAD')) response = await streamVideo(request, env);
    else response = jsonResponse({ error: 'Not found' }, 404);
    return withCors(response, env, request);
  },
};
