import type { AuthRole, AuthSession } from './authorization';
import { isKnownAuthRole } from './authorization';

const USER_ID_HEADER = 'x-urai-user-id';
const ROLE_HEADER = 'x-urai-role';

export function getRequestSession(request: Request): AuthSession | null {
  const uid = request.headers.get(USER_ID_HEADER)?.trim();
  if (!uid) return null;

  const rawRole = request.headers.get(ROLE_HEADER)?.trim();
  const role: AuthRole | null = isKnownAuthRole(rawRole) ? rawRole : null;

  return { uid, role };
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
