import { describe, expect, it } from 'vitest';
import { ContentService } from '../src/backend/contentService.js';
import { InMemoryContentRepository } from '../src/backend/inMemoryRepository.js';

describe('content service', () => {
  it('creates, updates, searches, and transitions workflows', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);
    const now = new Date().toISOString();

    await service.create({
      id: 'ci-1', slug: 'first-insight', title: 'First Insight', body: 'Body', tags: ['weekly'], locale: 'en-US',
      status: 'draft', visibility: 'public', createdBy: 'admin', updatedAt: now, createdAt: now,
      sourceLabel: 'weekly-digest', whyShownCopy: 'Because you opted in.', safetyNotes: ['non-clinical'], contentType: 'narrator'
    });

    const updated = await service.update('ci-1', { status: 'review' });
    expect(updated.status).toBe('review');

    const published = await service.transitionWorkflow('ci-1', 'approved', 'admin');
    expect(published.status).toBe('approved');

    const results = await service.searchContent('insight');
    expect(results.length).toBe(1);
  });

  it('enforces entitlement tiers', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);
    const now = new Date().toISOString();
    repo.seedEntitlement({ userId: 'u1', entitlementKey: 'pro', grantedBy: 'subscription', grantedAt: now, expiresAt: null });
    expect(await service.canAccess('u1', 'free')).toBe(true);
    expect(await service.canAccess('u1', 'pro')).toBe(true);
    expect(await service.canAccess('u1', 'paid')).toBe(false);
  });
});
