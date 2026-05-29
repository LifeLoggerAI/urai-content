import { afterEach, describe, expect, it } from 'vitest';
import {
  canCreateCreatorSubmission,
  canCreateOwnedResource,
  canReadOwnedResource,
  hasPermission,
  isAdminSession,
  isCreatorSession,
  isKnownAuthRole,
  requireAdmin,
  type AuthSession
} from '../src/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '../src/server/auth/requestSession';

const user: AuthSession = { uid: 'user-1', role: 'user' };
const creator: AuthSession = { uid: 'creator-1', role: 'creator' };
const studio: AuthSession = { uid: 'studio-1', role: 'studio' };
const admin: AuthSession = { uid: 'admin-1', role: 'admin' };
const internalAdmin: AuthSession = { uid: 'internal-1', role: 'internalAdmin' };

const originalNodeEnv = process.env.NODE_ENV;
const originalHeaderAuth = process.env.URAI_ENABLE_HEADER_AUTH;
const originalProjectId = process.env.FIREBASE_PROJECT_ID;
const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

function setNodeEnv(value: string | undefined) {
  const mutableEnv = process.env as Record<string, string | undefined>;
  if (value === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = value;
}

function makeAuthRequest(): Request {
  return new Request('http://localhost/api/admin/content', {
    headers: {
      'x-urai-user-id': ' admin-1 ',
      'x-urai-role': 'admin'
    }
  });
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);

  if (originalHeaderAuth === undefined) delete process.env.URAI_ENABLE_HEADER_AUTH;
  else process.env.URAI_ENABLE_HEADER_AUTH = originalHeaderAuth;

  if (originalProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
  else process.env.FIREBASE_PROJECT_ID = originalProjectId;

  if (originalClientEmail === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
  else process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;

  if (originalPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
  else process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
});

describe('server authorization helpers', () => {
  it('recognizes canonical auth roles and rejects unsupported roles', () => {
    expect(isKnownAuthRole('user')).toBe(true);
    expect(isKnownAuthRole('creator')).toBe(true);
    expect(isKnownAuthRole('studio')).toBe(true);
    expect(isKnownAuthRole('admin')).toBe(true);
    expect(isKnownAuthRole('internalAdmin')).toBe(true);
    expect(isKnownAuthRole('enterprise')).toBe(true);
    expect(isKnownAuthRole('licensingPartner')).toBe(true);
    expect(isKnownAuthRole('foundation')).toBe(true);
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

  it('maps permissions by role', () => {
    expect(hasPermission(null, 'content:read:public')).toBe(true);
    expect(hasPermission(user, 'admin:access')).toBe(false);
    expect(hasPermission(creator, 'creator:submit')).toBe(true);
    expect(hasPermission(admin, 'content:publish')).toBe(true);
    expect(hasPermission(internalAdmin, 'system:seed')).toBe(true);
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

  it('parses request sessions from explicit URAI auth headers outside production', async () => {
    setNodeEnv('test');
    delete process.env.URAI_ENABLE_HEADER_AUTH;
    await expect(getRequestSession(makeAuthRequest())).resolves.toEqual({ uid: 'admin-1', role: 'admin' });
  });

  it('ignores header auth in production by default', async () => {
    setNodeEnv('production');
    delete process.env.URAI_ENABLE_HEADER_AUTH;
    await expect(getRequestSession(makeAuthRequest())).resolves.toBeNull();
  });

  it('allows production header auth only with explicit opt-in', async () => {
    setNodeEnv('production');
    process.env.URAI_ENABLE_HEADER_AUTH = '1';
    await expect(getRequestSession(makeAuthRequest())).resolves.toEqual({ uid: 'admin-1', role: 'admin' });
  });

  it('fails closed for missing user id and unsupported roles', async () => {
    await expect(getRequestSession(new Request('http://localhost/api/admin/content'))).resolves.toBeNull();

    const request = new Request('http://localhost/api/admin/content', {
      headers: {
        'x-urai-user-id': 'user-1',
        'x-urai-role': 'owner'
      }
    });

    await expect(getRequestSession(request)).resolves.toEqual({ uid: 'user-1', role: null });
  });

  it('fails closed for bearer tokens when Firebase Admin credentials are not configured', async () => {
    setNodeEnv('production');
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const request = new Request('http://localhost/api/admin/content', {
      headers: { authorization: 'Bearer fake-token' }
    });

    await expect(getRequestSession(request)).resolves.toBeNull();
  });

  it('maps auth failures to stable response status and body shapes', () => {
    expect(getAuthFailureStatus('unauthenticated')).toBe(401);
    expect(getAuthFailureStatus('forbidden')).toBe(403);
    expect(getAuthFailureBody('unauthenticated')).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
    expect(getAuthFailureBody('forbidden')).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });
});
