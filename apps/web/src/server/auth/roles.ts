import 'server-only';

export const AUTH_ROLES = [
  'anonymous',
  'user',
  'creator',
  'studio',
  'admin',
  'internalAdmin',
  'enterprise',
  'licensingPartner',
  'foundation'
] as const;

export type AuthRole = typeof AUTH_ROLES[number];

export const AUTH_PERMISSIONS = [
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
] as const;

export type AuthPermission = typeof AUTH_PERMISSIONS[number];

export type AuthSession = {
  uid: string;
  role?: AuthRole | null;
  entitlements?: string[];
};

export type AuthorizationResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

export function isKnownAuthRole(role: unknown): role is AuthRole {
  return typeof role === 'string' && (AUTH_ROLES as readonly string[]).includes(role);
}
