import 'server-only';
import type { AuthPermission, AuthRole, AuthSession, AuthorizationResult } from './roles';
import { AUTH_PERMISSIONS, AUTH_ROLES, isKnownAuthRole } from './roles';

const PUBLIC_PERMISSIONS: readonly AuthPermission[] = ['public:read', 'content:read:public', 'marketplace:read', 'system:health'];

const ADMIN_PERMISSIONS: readonly AuthPermission[] = [
  'public:read',
  'content:read:public',
  'content:read:private',
  'content:create',
  'content:update',
  'content:review',
  'content:approve',
  'content:publish',
  'content:archive',
  'creator:submit',
  'creator:readOwn',
  'creator:updateOwn',
  'marketplace:read',
  'marketplace:purchase',
  'marketplace:manage',
  'entitlements:readOwn',
  'entitlements:manage',
  'exports:create',
  'exports:readOwn',
  'exports:downloadOwn',
  'exports:manage',
  'admin:access',
  'moderation:manage',
  'releases:manage',
  'telemetry:create',
  'telemetry:read',
  'system:health',
  'system:seed',
  'system:admin'
];

const USER_PERMISSIONS: readonly AuthPermission[] = [
  'public:read',
  'content:read:public',
  'marketplace:read',
  'marketplace:purchase',
  'entitlements:readOwn',
  'exports:create',
  'exports:readOwn',
  'exports:downloadOwn',
  'telemetry:create',
  'system:health'
];

const CREATOR_PERMISSIONS: readonly AuthPermission[] = [
  ...USER_PERMISSIONS,
  'creator:submit',
  'creator:readOwn',
  'creator:updateOwn'
];

const STUDIO_PERMISSIONS: readonly AuthPermission[] = [
  ...CREATOR_PERMISSIONS,
  'content:create',
  'content:update'
];

const ROLE_PERMISSIONS: Record<AuthRole, ReadonlySet<AuthPermission>> = {
  anonymous: new Set<AuthPermission>(PUBLIC_PERMISSIONS),
  user: new Set<AuthPermission>(USER_PERMISSIONS),
  creator: new Set<AuthPermission>(CREATOR_PERMISSIONS),
  studio: new Set<AuthPermission>(STUDIO_PERMISSIONS),
  enterprise: new Set<AuthPermission>(USER_PERMISSIONS),
  licensingPartner: new Set<AuthPermission>(USER_PERMISSIONS),
  foundation: new Set<AuthPermission>(USER_PERMISSIONS),
  admin: new Set<AuthPermission>(ADMIN_PERMISSIONS),
  internalAdmin: new Set<AuthPermission>(ADMIN_PERMISSIONS)
};

export const uraiContentRoles = AUTH_ROLES;
export const uraiContentPermissions = AUTH_PERMISSIONS;
export type UraiContentRole = AuthRole;
export type UraiContentPermission = AuthPermission;
export type UraiContentPrincipal = {
  uid: string | null;
  roles: AuthRole[];
};

export function normalizeRoles(roles: readonly unknown[] | undefined): AuthRole[] {
  const normalized = (roles ?? []).filter(isKnownAuthRole);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ['anonymous'];
}

export function createPrincipal(uid: string | null, roles: readonly unknown[] = []): UraiContentPrincipal {
  return { uid, roles: normalizeRoles(roles) };
}

export function isSignedIn(session: AuthSession | null | undefined): session is AuthSession {
  return Boolean(session?.uid);
}

export function sessionRole(session: AuthSession | null | undefined): AuthRole {
  return isSignedIn(session) && isKnownAuthRole(session.role) ? session.role : 'anonymous';
}

export function hasPermission(session: AuthSession | UraiContentPrincipal | null | undefined, permission: AuthPermission): boolean {
  if (session && 'roles' in session) {
    return session.roles.some((role) => ROLE_PERMISSIONS[role]?.has(permission));
  }

  return ROLE_PERMISSIONS[sessionRole(session)].has(permission);
}

export function listPrincipalPermissions(principal: UraiContentPrincipal): AuthPermission[] {
  return Array.from(
    new Set(
      principal.roles.flatMap((role) => Array.from(ROLE_PERMISSIONS[role] ?? []))
    )
  );
}

export function isAdminSession(session: AuthSession | UraiContentPrincipal | null | undefined): boolean {
  if (session && 'roles' in session) {
    return session.roles.includes('admin') || session.roles.includes('internalAdmin');
  }

  const role = sessionRole(session);
  return role === 'admin' || role === 'internalAdmin';
}

export function isCreatorSession(session: AuthSession | UraiContentPrincipal | null | undefined): boolean {
  if (session && 'roles' in session) {
    return session.roles.some((role) => ['creator', 'studio', 'admin', 'internalAdmin'].includes(role));
  }

  return ['creator', 'studio', 'admin', 'internalAdmin'].includes(sessionRole(session));
}

export function requirePermissionResult(session: AuthSession | null | undefined, permission: AuthPermission): AuthorizationResult {
  if (!isSignedIn(session) && !PUBLIC_PERMISSIONS.includes(permission)) {
    return { ok: false, reason: 'unauthenticated' };
  }

  return hasPermission(session, permission) ? { ok: true } : { ok: false, reason: 'forbidden' };
}

export function requirePermission(principal: UraiContentPrincipal, permission: AuthPermission): void {
  if (!hasPermission(principal, permission)) {
    throw new Error(`Missing required URAI Content permission: ${permission}`);
  }
}

export function canAccessRoute(principal: UraiContentPrincipal, routeOrPermission: AuthPermission | string): boolean {
  if ((AUTH_PERMISSIONS as readonly string[]).includes(routeOrPermission)) {
    return hasPermission(principal, routeOrPermission as AuthPermission);
  }

  if (routeOrPermission === '/' || routeOrPermission === '/pricing' || routeOrPermission.startsWith('/content')) {
    return hasPermission(principal, 'public:read');
  }

  if (routeOrPermission.startsWith('/dashboard')) {
    return hasPermission(principal, 'entitlements:readOwn');
  }

  if (routeOrPermission.startsWith('/creator')) {
    return hasPermission(principal, 'creator:readOwn') || hasPermission(principal, 'creator:submit');
  }

  if (routeOrPermission.startsWith('/admin')) {
    return hasPermission(principal, 'admin:access');
  }

  return false;
}

export function canReadOwnedResource(session: AuthSession | null | undefined, ownerUserId: string | null | undefined): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (isAdminSession(session) || session.uid === ownerUserId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function canCreateOwnedResource(session: AuthSession | null | undefined, ownerUserId: string | null | undefined): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (session.uid === ownerUserId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function canCreateCreatorSubmission(session: AuthSession | null | undefined, creatorId: string | null | undefined): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  if (isCreatorSession(session) && session.uid === creatorId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

export function requireAdmin(session: AuthSession | null | undefined): AuthorizationResult {
  if (!isSignedIn(session)) return { ok: false, reason: 'unauthenticated' };
  return isAdminSession(session) ? { ok: true } : { ok: false, reason: 'forbidden' };
}
