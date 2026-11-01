/**
 * R313 Google-signed service account OIDC validator.
 * No user Firebase ID tokens, service account keys, or caller-supplied JWKS.
 * Only the fixed Google OAuth JWKS origin is trusted.
 * Caller must bind audience and service account allowlist from deployment policy.
 */
import { createPublicKey, verify } from 'node:crypto';

const JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const B64 = /^[A-Za-z0-9_-]+$/;
type Claims = { iss?: string; aud?: string; exp?: number; iat?: number; nbf?: number;
  sub?: string; email?: string; email_verified?: boolean | string };
type WebFetch = (input: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean; json(): Promise<unknown>;
}>;

function decode(segment: string): Record<string, unknown> {
  if (!B64.test(segment) || segment.length > 8192) throw new Error('invalid service token encoding');
  const decoded: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error('invalid service claims');
  return decoded as Record<string, unknown>;
}

export function createGoogleServiceIdentityVerifier({
  audience, serviceAccountEmails, fetchImpl = fetch, clock = Date.now,
}: {
  audience: string; serviceAccountEmails: readonly string[];
  fetchImpl?: WebFetch; clock?: () => number;
}) {
  if (!audience?.startsWith('https://') || !Array.isArray(serviceAccountEmails) ||
      serviceAccountEmails.length === 0 || !serviceAccountEmails.every(email =>
        typeof email === 'string' && /^[a-z0-9._-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(email))) {
    throw new Error('pinned service audience and allowlist required');
  }
  const allowed = new Set(serviceAccountEmails);
  return async function verifyServiceIdentity(jwt: string): Promise<{ serviceId: string; email: string }> {
    if (typeof jwt !== 'string' || jwt.length > 16384) throw new Error('service OIDC token missing');
    const pieces = jwt.split('.');
    if (pieces.length !== 3 || !B64.test(pieces[2])) throw new Error('malformed service OIDC token');
    const h = decode(pieces[0]), claims = decode(pieces[1]) as Claims;
    if (h.alg !== 'RS256' || typeof h.kid !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(h.kid)) {
      throw new Error('unsupported service token signing algorithm');
    }
    const now = Number(clock()) / 1000;
    if (!Number.isFinite(now) || !ISSUERS.has(String(claims.iss)) || claims.aud !== audience ||
        !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) ||
        (claims.exp as number) <= now || (claims.iat as number) > now + 60 ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 60)) ||
        typeof claims.email !== 'string' || !allowed.has(claims.email) ||
        !/^[0-9]{5,32}$/.test(String(claims.sub || '')) ||
        (claims.email_verified !== true && claims.email_verified !== 'true')) {
      throw new Error('untrusted, expired, or out-of-scope service identity');
    }
    const response = await fetchImpl(JWKS, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Google issuer certificates unavailable');
    const keySet = await response.json() as { keys?: unknown };
    if (!Array.isArray(keySet?.keys) || keySet.keys.length > 32) throw new Error('invalid issuer key set');
    const jwk = keySet.keys.find((key: any) =>
      key && key.kid === h.kid && key.kty === 'RSA' && key.alg === 'RS256' && key.use === 'sig') as
      ({ kty: 'RSA'; n: string; e: string; kid: string } | undefined);
    if (!jwk || !B64.test(jwk.n) || !B64.test(jwk.e)) throw new Error('unrecognized Google signing key');
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    if (!verify('RSA-SHA256', Buffer.from(pieces[0] + '.' + pieces[1]), publicKey, Buffer.from(pieces[2], 'base64url'))) {
      throw new Error('invalid service token signature');
    }
    return { serviceId: String(claims.sub), email: claims.email };
  };
}
