import 'server-only';
import type { AuthPermission, AuthRole, AuthSession, AuthorizationResult } from './roles';
import { isKnownAuthRole } from './roles';

const ROLE_PERMISSIONS: Record<AuthRole, ReadonlySet<AuthPermission>> = {
  anonymous: new Set(['public:read', 'content:read:public', 'marketplace:read', 'system:health']),
  user: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'telemetry:create', 'system:health']),
  creator: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'creator:submit', 'creator:readOwn', 'creator:updateOwn', 'telemetry:create', 'system:health']),
  studio: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'creator:submit', 'creator:readOwn', 'creator:updateOwn', 'content:create', 'content:update', 'telemetry:create', 'system:health']),
  enterprise: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'telemetry:create', 'system:health']),
  licensingPartner: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'telemetry:create', 'system:health']),
  foundation: new Set(['public:read', 'content:read:public', 'marketplace:read', 'marketplace:purchase', 'entitlements:readOwn', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'telemetry:create', 'system:health']),
  admin: new Set(['public:read', 'content:read:public', 'content:read:private', 'content:create', 'content:update', 'content:review', 'content:approve', 'content:publish', 'content:archive', 'creator:submit', 'creator:readOwn', 'creator:updateOwn', 'marketplace:read', 'marketplace:purchase', 'marketplace:manage', 'entitlements:readOwn', 'entitlements:manage', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'exports:manage', 'admin:access', 'moderation:manage', 'releases:manage', 'telemetry:create', 'telemetry:read', 'system:health', 'system:seed', 'system:admin']),
  internalAdmin: new Set(['public:read', 'content:read:public', 'content:read:private', 'content:create', 'content:update', 'content:review', 'content:approve', 'content:publish', 'content:archive', 'creator:submit', 'creator:readOwn', 'creator:updateOwn', 'marketplace:read', 'marketplace:purchase', 'marketplace:manage', 'entitlements:readOwn', 'entitlements:manage', 'exports:create', 'exports:readOwn', 'exports:downloadOwn', 'exports:manage', 'admin:access', 'moderation:manage', 'releases:manage', 'telemetry:create', 'telemetry:read', 'system:health', 'system:seed', 'system:admin'])
};

export function isSignedIn(session: AuthSession | null | undefined): session is AuthSession {
  return Boolean(session?.uid);
}

export function sessionRole(session: AuthSession | null | undefined): AuthRole {
  return isSignedIn(session) && isKnownAuthRole(session.role) ? session.role : 'anonymous';
}

export function hasPermission(session: AuthSession | null | undefined, permission: AuthPermission): boolean {
  return ROLE_PERMISSIONS[sessionRole(session)].has(permission);
}

export function isAdminSession(session: AuthSession | null | undefined): boolean {
  const role = sessionRole(session);
  return role === 'admin' || role === 'internalAdmin';
}

export function isCreatorSession(session: AuthSession | null | undefined): boolean {
  return ['creator', 'studio', 'admin', 'internalAdmin'].includes(sessionRole(session));
}

export function requirePermissionResult(session: AuthSession | null | undefined, permission: AuthPermission): AuthorizationResult {
  if (!isSignedIn(session) && !['public:read', 'content:read:public', 'marketplace:read', 'system:health'].includes(permission)) {
    return { ok: false, reason: 'unauthenticated' };
  }

  return hasPermission(session, permission) ? { ok: true } : { ok: false, reason: 'forbidden' };
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
