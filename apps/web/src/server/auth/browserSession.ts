import 'server-only';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';
import { getCurrentAccountSession } from './session';
import type { AuthSession } from './roles';

export const CONTENT_SESSION_COOKIE = '__Host-urai-content-session';
const SESSION_SECONDS = 3600;
const MAX_BODY_BYTES = 16384;

function reply(status: number, body: Record<string, unknown>, cookie?: string): Response {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store, private', pragma: 'no-cache' });
  if (cookie) headers.set('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function sameOrigin(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    if (!origin || origin !== url.origin || (site && site !== 'same-origin')) return false;
    if (process.env.NODE_ENV === 'production') {
      return url.protocol === 'https:' && url.origin === new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uraicontent.com').origin;
    }
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  } catch { return false; }
}

async function readToken(request: Request): Promise<string> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' || !request.body) throw new Error('Invalid body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      if (request.signal.aborted) throw new Error('Cancelled request');
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error('Body exceeds limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).join(',') !== 'idToken') throw new Error('Invalid body');
  const token = (body as { idToken?: unknown }).idToken;
  if (typeof token !== 'string' || !token.trim() || token.length > 8192) throw new Error('Invalid token');
  return token;
}

export async function getBrowserSession(cookie: string | undefined): Promise<AuthSession | null> {
  if (!cookie || cookie.length > 8192 || !isFirebaseAdminConfigured()) return null;
  try {
    const auth = getFirebaseAdminAuth();
    return await getCurrentAccountSession(await auth.verifySessionCookie(cookie, true), auth);
  } catch { return null; }
}

export async function createBrowserSession(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return reply(403, { error: 'forbidden_origin' });
  let token: string;
  try { token = await readToken(request); }
  catch { return reply(400, { error: 'invalid_request' }); }
  if (!isFirebaseAdminConfigured()) return reply(503, { error: 'authentication_unavailable' });
  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(token, true);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(decoded.auth_time) || decoded.auth_time > now + 30 || now - decoded.auth_time > 300) {
      return reply(401, { error: 'recent_sign_in_required' });
    }
    const admitted = await getCurrentAccountSession(decoded, auth);
    if (!admitted) return reply(401, { error: 'unauthenticated' });
    const cookie = await auth.createSessionCookie(token, { expiresIn: SESSION_SECONDS * 1000 });
    const current = await getBrowserSession(cookie);
    if (request.signal.aborted || !current || current.uid !== admitted.uid || current.role !== admitted.role) {
      return reply(401, { error: 'unauthenticated' });
    }
    return reply(200, { authenticated: true }, CONTENT_SESSION_COOKIE + '=' + cookie + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + SESSION_SECONDS);
  } catch { return reply(401, { error: 'unauthenticated' }); }
}

export async function clearBrowserSession(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return reply(403, { error: 'forbidden_origin' });
  return reply(200, { authenticated: false }, CONTENT_SESSION_COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}

