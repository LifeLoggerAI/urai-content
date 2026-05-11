import 'server-only';

export const uraiContentRoles = [
  'anonymous',
  'member',
  'creator',
  'moderator',
  'admin',
  'internal-admin'
] as const;

export type UraiContentRole = (typeof uraiContentRoles)[number];

export const uraiContentPermissions = [
  'public:read',
  'dashboard:read',
  'content:purchase',
  'creator:read',
  'creator:submit',
  'creator:manage-own',
  'moderation:read',
  'moderation:review',
  'admin:read',
  'admin:write',
  'system:seed',
  'system:manage'
] as const;

export type UraiContentPermission = (typeof uraiContentPermissions)[number];

export type UraiContentPrincipal = {
  uid: string | null;
  roles: UraiContentRole[];
};

const rolePermissions = {
  anonymous: ['public:read'],
  member: ['public:read', 'dashboard:read', 'content:purchase'],
  creator: ['public:read', 'dashboard:read', 'content:purchase', 'creator:read', 'creator:submit', 'creator:manage-own'],
  moderator: ['public:read', 'dashboard:read', 'moderation:read', 'moderation:review'],
  admin: [
    'public:read',
    'dashboard:read',
    'content:purchase',
    'creator:read',
    'creator:submit',
    'creator:manage-own',
    'moderation:read',
    'moderation:review',
    'admin:read',
    'admin:write'
  ],
  'internal-admin': [
    'public:read',
    'dashboard:read',
    'content:purchase',
    'creator:read',
    'creator:submit',
    'creator:manage-own',
    'moderation:read',
    'moderation:review',
    'admin:read',
    'admin:write',
    'system:seed',
    'system:manage'
  ]
} satisfies Record<UraiContentRole, UraiContentPermission[]>;

export function normalizeRoles(input: readonly string[] | undefined): UraiContentRole[] {
  const roleSet = new Set<UraiContentRole>();

  for (const role of input ?? []) {
    if (uraiContentRoles.includes(role as UraiContentRole)) {
      roleSet.add(role as UraiContentRole);
    }
  }

  if (roleSet.size === 0) {
    roleSet.add('anonymous');
  }

  return [...roleSet];
}

export function createPrincipal(uid: string | null, roles: readonly string[] | undefined): UraiContentPrincipal {
  return {
    uid,
    roles: normalizeRoles(roles)
  };
}

export function listPrincipalPermissions(principal: UraiContentPrincipal): UraiContentPermission[] {
  const permissions = new Set<UraiContentPermission>();

  for (const role of principal.roles) {
    for (const permission of rolePermissions[role]) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

export function hasPermission(principal: UraiContentPrincipal, permission: UraiContentPermission): boolean {
  return listPrincipalPermissions(principal).includes(permission);
}

export function requirePermission(principal: UraiContentPrincipal, permission: UraiContentPermission): void {
  if (!hasPermission(principal, permission)) {
    throw new Error(`Missing required URAI Content permission: ${permission}`);
  }
}

export function canAccessRoute(principal: UraiContentPrincipal, route: string): boolean {
  if (route.startsWith('/admin')) return hasPermission(principal, 'admin:read');
  if (route.startsWith('/creator/dashboard')) return hasPermission(principal, 'creator:read');
  if (route.startsWith('/creator/submit')) return hasPermission(principal, 'creator:submit');
  if (route.startsWith('/dashboard')) return hasPermission(principal, 'dashboard:read');
  return hasPermission(principal, 'public:read');
}
