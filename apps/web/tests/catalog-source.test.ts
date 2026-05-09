import { describe, expect, it } from 'vitest';
import { getCatalogSourceDescription, getCatalogSourceMode } from '../src/server/content/catalogSource';

describe('catalog source mode', () => {
  it('reports canonical JSON mode when Firebase Admin credentials are absent', () => {
    const originalProjectId = process.env.FIREBASE_PROJECT_ID;
    const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    try {
      expect(getCatalogSourceMode()).toBe('canonical-json');
      expect(getCatalogSourceDescription()).toContain('canonical JSON');
    } finally {
      if (originalProjectId !== undefined) process.env.FIREBASE_PROJECT_ID = originalProjectId;
      if (originalClientEmail !== undefined) process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;
      if (originalPrivateKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
    }
  });
});
