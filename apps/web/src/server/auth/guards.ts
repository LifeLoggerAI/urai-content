import 'server-only';
import type { AuthPermission, AuthRole, AuthSession, AuthorizationResult } from './roles';
import { hasPermission, isSignedIn, requireAdmin, requirePermissionResult } from './rbac';
import { getRequestSession } from './session';

export async function requireAuth(request: Request): Promise<AuthSession | AuthorizationResult> {
  const session = await getRequestSession(request);
  return isSignedIn(session) ? session : { ok: false, reason: 'unauthenticated' };
}

export async function requireRole(request: Request, roles: AuthRole[]): Promise<AuthSession | AuthorizationResult> {
  const session = await getRequestSession(request);
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  return session.role && roles.includes(session.role) ? session : { ok: false, reason: 'forbidden' };
}

export async function requirePermission(request: Request, permission: AuthPermission): Promise<AuthSession | AuthorizationResult> {
  const session = await getRequestSession(request);
  const result = requirePermissionResult(session, permission);
  return result.ok ? session! : result;
}

export async function requireOwnerOrAdmin(request: Request, ownerUserId: string | null | undefined): Promise<AuthSession | AuthorizationResult> {
  const session = await getRequestSession(request);
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (requireAdmin(session).ok || session.uid === ownerUserId) return session;
  return { ok: false, reason: 'forbidden' };
}

export async function requireCreatorOwnerOrAdmin(request: Request, creatorId: string | null | undefined): Promise<AuthSession | AuthorizationResult> {
  const session = await getRequestSession(request);
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (requireAdmin(session).ok || (session.uid === creatorId && hasPermission(session, 'creator:readOwn'))) return session;
  return { ok: false, reason: 'forbidden' };
}
