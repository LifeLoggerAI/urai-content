import { describe, expect, it } from 'vitest';
import { getRuntimeCatalogItemBySlug, listRuntimeCatalogSummaries } from '../src/server/content/runtimeCatalog';

describe('runtime catalog reader', () => {
  it('lists canonical JSON summaries when Firebase Admin is not configured', async () => {
    const originalProjectId = process.env.FIREBASE_PROJECT_ID;
    const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    try {
      const catalog = await listRuntimeCatalogSummaries();
      expect(catalog.source).toBe('canonical-json');
      expect(catalog.items.length).toBeGreaterThan(0);
      expect(catalog.items.some((item) => item.id === 'page-home')).toBe(true);
    } finally {
      if (originalProjectId !== undefined) process.env.FIREBASE_PROJECT_ID = originalProjectId;
      if (originalClientEmail !== undefined) process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;
      if (originalPrivateKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
    }
  });

  it('reads canonical JSON item details when Firebase Admin is not configured', async () => {
    const item = await getRuntimeCatalogItemBySlug('/privacy');

    expect(item.source).toBe('canonical-json');
    expect(item.item?.id).toBe('page-privacy');
  });
});
