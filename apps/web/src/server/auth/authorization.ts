export const AUTH_ROLES = ['user', 'creator', 'studio', 'admin', 'internalAdmin'] as const;

export type AuthRole = typeof AUTH_ROLES[number];

export type AuthSession = {
  uid: string;
  role?: AuthRole | null;
};

export type AuthorizationResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

const ADMIN_ROLES = new Set<AuthRole>(['admin', 'internalAdmin']);
const CREATOR_ROLES = new Set<AuthRole>(['creator', 'studio', 'admin', 'internalAdmin']);

export function isKnownAuthRole(role: unknown): role is AuthRole {
  return typeof role === 'string' && (AUTH_ROLES as readonly string[]).includes(role);
}

export function isSignedIn(session: AuthSession | null | undefined): session is AuthSession {
  return Boolean(session?.uid);
}

export function isAdminSession(session: AuthSession | null | undefined): boolean {
  return isSignedIn(session) && isKnownAuthRole(session.role) && ADMIN_ROLES.has(session.role);
}

export function isCreatorSession(session: AuthSession | null | undefined): boolean {
  return isSignedIn(session) && isKnownAuthRole(session.role) && CREATOR_ROLES.has(session.role);
}

export function canReadOwnedResource(
  session: AuthSession | null | undefined,
  ownerUserId: string | null | undefined
): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (isAdminSession(session) || session.uid === ownerUserId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function canCreateOwnedResource(
  session: AuthSession | null | undefined,
  ownerUserId: string | null | undefined
): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (session.uid === ownerUserId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function canCreateCreatorSubmission(
  session: AuthSession | null | undefined,
  creatorId: string | null | undefined
): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (isCreatorSession(session) && session.uid === creatorId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function requireAdmin(session: AuthSession | null | undefined): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (isAdminSession(session)) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}
