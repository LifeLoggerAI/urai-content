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

    const updated = await service.update('ci-1', { body: 'Updated body' });
    expect(updated.body).toBe('Updated body');

    await expect(service.update('ci-1', { status: 'review' })).rejects.toThrow(/transitionWorkflow/);

    const inReview = await service.transitionWorkflow('ci-1', 'review', 'admin');
    expect(inReview.status).toBe('review');

    const approved = await service.transitionWorkflow('ci-1', 'approved', 'admin');
    expect(approved.status).toBe('approved');

    const results = await service.searchContent('insight');
    expect(results.length).toBe(1);
  });

  it('enforces entitlement tiers, entitlement keys, and expiration', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);
    const now = new Date('2026-05-03T00:00:00.000Z');
    repo.seedEntitlement({ userId: 'u1', entitlementKey: 'pro', grantedBy: 'subscription', grantedAt: now.toISOString(), expiresAt: null });
    repo.seedEntitlement({ userId: 'u1', entitlementKey: 'mkt-ritual-pack-01', grantedBy: 'purchase', grantedAt: now.toISOString(), expiresAt: null });
    repo.seedEntitlement({ userId: 'u1', entitlementKey: 'expired-pack', grantedBy: 'purchase', grantedAt: now.toISOString(), expiresAt: '2026-05-02T00:00:00.000Z' });

    expect(await service.canAccess('u1', 'free')).toBe(true);
    expect(await service.canAccess('u1', 'pro')).toBe(true);
    expect(await service.canAccess('u1', 'paid')).toBe(true);
    expect(await service.canAccess('u1', { tier: 'paid', entitlementKey: 'mkt-ritual-pack-01', now })).toBe(true);
    expect(await service.canAccess('u1', { tier: 'paid', entitlementKey: 'other-pack', now })).toBe(false);
    expect(await service.canAccess('u1', { tier: 'paid', entitlementKey: 'expired-pack', now })).toBe(false);
    expect(await service.canAccess('u2', 'pro')).toBe(false);
  });
});
