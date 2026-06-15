import type { AuthRole, AuthSession } from './authorization';
import { isKnownAuthRole } from './authorization';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';

const USER_ID_HEADER = 'x-urai-user-id';
const ROLE_HEADER = 'x-urai-role';

type DecodedIdTokenLike = {
  uid: string;
  role?: unknown;
  roles?: unknown;
};

function isHeaderAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
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
        role: getRoleFromToken(decodedToken)
      };
    } catch {
      return null;
    }
  }

  return getHeaderSession(request);
}

export function getAuthFailureStatus(reason: 'unauthenticated' | 'forbidden'): 401 | 403 {
  return reason === 'unauthenticated' ? 401 : 403;
}

export function getAuthFailureBody(reason: 'unauthenticated' | 'forbidden'): {
  error: 'unauthenticated' | 'forbidden';
  message: string;
} {
  return reason === 'unauthenticated'
    ? { error: 'unauthenticated', message: 'Authentication is required.' }
    : { error: 'forbidden', message: 'You do not have permission to perform this action.' };
}
