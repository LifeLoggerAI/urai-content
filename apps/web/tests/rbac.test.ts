import { describe, expect, it } from 'vitest';

import {
  canAccessRoute,
  createPrincipal,
  hasPermission,
  listPrincipalPermissions,
  normalizeRoles,
  requirePermission
} from '../src/server/auth/rbac';

describe('URAI Content RBAC policy contracts', () => {
  it('normalizes unknown or empty roles to anonymous', () => {
    expect(normalizeRoles(undefined)).toEqual(['anonymous']);
    expect(normalizeRoles(['unknown'])).toEqual(['anonymous']);
    expect(normalizeRoles(['creator', 'creator', 'admin'])).toEqual(['creator', 'admin']);
  });

  it('grants public-only access to anonymous principals', () => {
    const principal = createPrincipal(null, undefined);

    expect(listPrincipalPermissions(principal)).toEqual(['public:read']);
    expect(canAccessRoute(principal, '/')).toBe(true);
    expect(canAccessRoute(principal, '/pricing')).toBe(true);
    expect(canAccessRoute(principal, '/dashboard')).toBe(false);
    expect(canAccessRoute(principal, '/creator/submit')).toBe(false);
    expect(canAccessRoute(principal, '/admin')).toBe(false);
  });

  it('allows members to access dashboard routes but not creator or admin routes', () => {
    const principal = createPrincipal('member-1', ['member']);

    expect(canAccessRoute(principal, '/dashboard')).toBe(true);
    expect(canAccessRoute(principal, '/dashboard/content')).toBe(true);
    expect(canAccessRoute(principal, '/creator/submit')).toBe(false);
    expect(canAccessRoute(principal, '/admin')).toBe(false);
  });

  it('allows creators to access creator submission and creator dashboard routes', () => {
    const principal = createPrincipal('creator-1', ['creator']);

    expect(hasPermission(principal, 'creator:submit')).toBe(true);
    expect(canAccessRoute(principal, '/creator/dashboard')).toBe(true);
    expect(canAccessRoute(principal, '/creator/submit')).toBe(true);
    expect(canAccessRoute(principal, '/admin')).toBe(false);
  });

  it('allows admins to access admin routes but reserves system permissions for internal admins', () => {
    const admin = createPrincipal('admin-1', ['admin']);
    const internalAdmin = createPrincipal('internal-admin-1', ['internal-admin']);

    expect(canAccessRoute(admin, '/admin')).toBe(true);
    expect(hasPermission(admin, 'system:seed')).toBe(false);
    expect(canAccessRoute(internalAdmin, '/admin/system-health')).toBe(true);
    expect(hasPermission(internalAdmin, 'system:seed')).toBe(true);
    expect(hasPermission(internalAdmin, 'system:manage')).toBe(true);
  });

  it('throws a readable error when a required permission is missing', () => {
    const principal = createPrincipal('member-1', ['member']);

    expect(() => requirePermission(principal, 'admin:write')).toThrow(
      'Missing required URAI Content permission: admin:write'
    );
  });
});
