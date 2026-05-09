import { describe, expect, it } from 'vitest';
import {
  getFirebaseAdminEnv,
  getRequiredFirebaseAdminEnv,
  hasFirebaseAdminCredentials,
  normalizePrivateKey,
  parseAdminUids
} from '../src/server/firebase/adminEnv';

describe('Firebase Admin environment helpers', () => {
  it('detects missing and complete Firebase Admin credentials', () => {
    const missing = getFirebaseAdminEnv({});
    expect(hasFirebaseAdminCredentials(missing)).toBe(false);

    const complete = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@example.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'private-key'
    });

    expect(hasFirebaseAdminCredentials(complete)).toBe(true);
  });

  it('throws when required Firebase Admin credentials are missing', () => {
    expect(() => getRequiredFirebaseAdminEnv({ FIREBASE_PROJECT_ID: 'only-project' })).toThrow(
      'Firebase Admin credentials are not configured'
    );
  });

  it('parses comma-separated admin UIDs', () => {
    const env = getFirebaseAdminEnv({
      URAI_CONTENT_ADMIN_UIDS: 'admin-1, admin-2,,admin-3 '
    });

    expect(parseAdminUids(env)).toEqual(['admin-1', 'admin-2', 'admin-3']);
  });

  it('normalizes escaped private key newlines', () => {
    expect(normalizePrivateKey('line-1\\nline-2')).toBe('line-1\nline-2');
  });
});
