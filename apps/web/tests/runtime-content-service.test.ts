import { describe, expect, it } from 'vitest';
import { getRuntimeContentMode } from '../src/server/content/service';

describe('runtime content service factory', () => {
  it('uses memory mode when Firebase Admin credentials are absent', () => {
    const originalProjectId = process.env.FIREBASE_PROJECT_ID;
    const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    try {
      expect(getRuntimeContentMode()).toBe('memory');
    } finally {
      if (originalProjectId !== undefined) process.env.FIREBASE_PROJECT_ID = originalProjectId;
      if (originalClientEmail !== undefined) process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;
      if (originalPrivateKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
    }
  });
});
