import 'server-only';
import type { AuthRole, AuthSession } from './roles';
import { isKnownAuthRole } from './roles';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';

const USER_ID_HEADER = 'x-urai-user-id';
const ROLE_HEADER = 'x-urai-role';

type DecodedIdTokenLike = {
  uid: string;
  role?: unknown;
  roles?: unknown;
  entitlements?: unknown;
};

function isHeaderAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return process.env.URAI_ENABLE_HEADER_AUTH === '1';
  return process.env.URAI_ENABLE_HEADER_AUTH !== '0';
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function getRoleFromToken(decodedToken: DecodedIdTokenLike): AuthRole | null {
  if (isKnownAuthRole(decodedToken.role)) return decodedToken.role;

  if (Array.isArray(decodedToken.roles)) {
    const role = decodedToken.roles.find(isKnownAuthRole);
    return role ?? null;
  }

  return null;
}

function getEntitlements(decodedToken: DecodedIdTokenLike): string[] {
  return Array.isArray(decodedToken.entitlements)
    ? decodedToken.entitlements.filter((value): value is string => typeof value === 'string')
    : [];
}

function getHeaderSession(request: Request): AuthSession | null {
  if (!isHeaderAuthEnabled()) return null;

  const uid = request.headers.get(USER_ID_HEADER)?.trim();
  if (!uid) return null;

  const rawRole = request.headers.get(ROLE_HEADER)?.trim();
  const role: AuthRole | null = isKnownAuthRole(rawRole) ? rawRole : null;

  return { uid, role };
}

export async function getRequestSession(request: Request): Promise<AuthSession | null> {
  const token = getBearerToken(request);

  if (token) {
    if (!isFirebaseAdminConfigured()) return null;

    try {
      const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        role: getRoleFromToken(decodedToken),
        entitlements: getEntitlements(decodedToken)
      };
    } catch {
      return null;
    }
  }

  return getHeaderSession(request);
}

export async function getRequiredRequestSession(request: Request): Promise<AuthSession> {
  const session = await getRequestSession(request);
  if (!session) throw new Error('Authentication is required.');
  return session;
}
