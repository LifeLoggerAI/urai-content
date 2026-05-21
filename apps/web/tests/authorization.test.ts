import { describe, expect, it } from 'vitest';
import {
  canCreateCreatorSubmission,
  canCreateOwnedResource,
  canReadOwnedResource,
  isAdminSession,
  isCreatorSession,
  isKnownAuthRole,
  requireAdmin,
  type AuthSession
} from '../src/server/auth/authorization';

const user: AuthSession = { uid: 'user-1', role: 'user' };
const creator: AuthSession = { uid: 'creator-1', role: 'creator' };
const studio: AuthSession = { uid: 'studio-1', role: 'studio' };
const admin: AuthSession = { uid: 'admin-1', role: 'admin' };
const internalAdmin: AuthSession = { uid: 'internal-1', role: 'internalAdmin' };

describe('server authorization helpers', () => {
  it('recognizes only supported auth roles', () => {
    expect(isKnownAuthRole('user')).toBe(true);
    expect(isKnownAuthRole('creator')).toBe(true);
    expect(isKnownAuthRole('studio')).toBe(true);
    expect(isKnownAuthRole('admin')).toBe(true);
    expect(isKnownAuthRole('internalAdmin')).toBe(true);
    expect(isKnownAuthRole('owner')).toBe(false);
    expect(isKnownAuthRole(null)).toBe(false);
  });

  it('detects admin and creator-capable sessions', () => {
    expect(isAdminSession(admin)).toBe(true);
    expect(isAdminSession(internalAdmin)).toBe(true);
    expect(isAdminSession(creator)).toBe(false);
    expect(isAdminSession(null)).toBe(false);

    expect(isCreatorSession(creator)).toBe(true);
    expect(isCreatorSession(studio)).toBe(true);
    expect(isCreatorSession(admin)).toBe(true);
    expect(isCreatorSession(internalAdmin)).toBe(true);
    expect(isCreatorSession(user)).toBe(false);
  });

  it('requires admin for admin-only writes', () => {
    expect(requireAdmin(null)).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(requireAdmin(user)).toEqual({ ok: false, reason: 'forbidden' });
    expect(requireAdmin(admin)).toEqual({ ok: true });
    expect(requireAdmin(internalAdmin)).toEqual({ ok: true });
  });

  it('allows owner or admin reads for owned resources', () => {
    expect(canReadOwnedResource(null, 'user-1')).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(canReadOwnedResource(user, 'user-1')).toEqual({ ok: true });
    expect(canReadOwnedResource(user, 'other-user')).toEqual({ ok: false, reason: 'forbidden' });
    expect(canReadOwnedResource(admin, 'other-user')).toEqual({ ok: true });
  });

  it('allows only the owner to create owned resources', () => {
    expect(canCreateOwnedResource(null, 'user-1')).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(canCreateOwnedResource(user, 'user-1')).toEqual({ ok: true });
    expect(canCreateOwnedResource(user, 'other-user')).toEqual({ ok: false, reason: 'forbidden' });
    expect(canCreateOwnedResource(admin, 'other-user')).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('allows only creator-capable users to create their own creator submissions', () => {
    expect(canCreateCreatorSubmission(null, 'creator-1')).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(canCreateCreatorSubmission(user, 'user-1')).toEqual({ ok: false, reason: 'forbidden' });
    expect(canCreateCreatorSubmission(creator, 'creator-1')).toEqual({ ok: true });
    expect(canCreateCreatorSubmission(creator, 'other-creator')).toEqual({ ok: false, reason: 'forbidden' });
    expect(canCreateCreatorSubmission(studio, 'studio-1')).toEqual({ ok: true });
    expect(canCreateCreatorSubmission(admin, 'admin-1')).toEqual({ ok: true });
  });
});
