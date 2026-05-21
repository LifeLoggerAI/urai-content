import { describe, expect, it } from 'vitest';
import { ContentService } from '../src/backend/contentService.js';
import { InMemoryContentRepository } from '../src/backend/inMemoryRepository.js';
import type { PublishingRelease } from '../src/schemas/content.js';

class ReleaseCapturingRepository extends InMemoryContentRepository {
  readonly capturedReleases: PublishingRelease[] = [];

  override async logRelease(release: PublishingRelease): Promise<void> {
    this.capturedReleases.push(release);
    await super.logRelease(release);
  }
}

function makeContentItem(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();

  return {
    id: 'ci-1',
    slug: 'first-insight',
    title: 'First Insight',
    body: 'Body',
    tags: ['weekly'],
    locale: 'en-US',
    status: 'draft',
    visibility: 'public',
    createdBy: 'admin',
    updatedAt: now,
    createdAt: now,
    sourceLabel: 'weekly-digest',
    whyShownCopy: 'Because you opted in.',
    safetyNotes: ['non-clinical'],
    contentType: 'narrator',
    ...overrides
  };
}

describe('content service', () => {
  it('creates, updates, searches, and transitions workflows', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);

    await service.create(makeContentItem());

    const updated = await service.update('ci-1', { status: 'review' });
    expect(updated.status).toBe('review');

    const published = await service.transitionWorkflow('ci-1', 'approved', 'admin');
    expect(published.status).toBe('approved');

    const results = await service.searchContent('insight');
    expect(results.length).toBe(1);
  });

  it('rejects updates for missing content items', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);

    await expect(service.update('missing', { status: 'review' })).rejects.toThrow('Content item not found');
  });

  it('rejects invalid workflow transitions', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);

    await service.create(makeContentItem({ status: 'draft' }));

    await expect(service.transitionWorkflow('ci-1', 'published', 'admin')).rejects.toThrow(
      'Invalid workflow transition draft -> published'
    );
  });

  it('logs a publishing release when content is published', async () => {
    const repo = new ReleaseCapturingRepository();
    const service = new ContentService(repo);

    await service.create(makeContentItem({ status: 'approved' }));
    const published = await service.transitionWorkflow('ci-1', 'published', 'admin');

    expect(published.status).toBe('published');
    expect(repo.capturedReleases).toHaveLength(1);
    expect(repo.capturedReleases[0]?.contentItemIds).toEqual(['ci-1']);
    expect(repo.capturedReleases[0]?.releasedBy).toBe('admin');
    expect(await repo.listVersions('ci-1')).toHaveLength(2);
  });

  it('searches only the requested visibility scope', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);

    await service.create(makeContentItem({ id: 'public-1', slug: 'public-insight', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'private-1', slug: 'private-insight', visibility: 'private' }));

    expect(await service.searchContent('insight', 'public')).toHaveLength(1);
    expect(await service.searchContent('insight', 'private')).toHaveLength(1);
    expect(await service.searchContent('missing', 'public')).toHaveLength(0);
  });

  it('returns only published items from the published content search', async () => {
    const repo = new InMemoryContentRepository();
    const service = new ContentService(repo);

    await service.create(makeContentItem({ id: 'draft-1', slug: 'draft-insight', status: 'draft', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'review-1', slug: 'review-insight', status: 'review', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'approved-1', slug: 'approved-insight', status: 'approved', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'published-1', slug: 'published-insight', status: 'published', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'archived-1', slug: 'archived-insight', status: 'archived', visibility: 'public' }));
    await service.create(makeContentItem({ id: 'private-published-1', slug: 'private-published-insight', status: 'published', visibility: 'private' }));

    const publicResults = await service.searchPublishedContent('insight', 'public');
    const privateResults = await service.searchPublishedContent('insight', 'private');

    expect(publicResults.map((item) => item.id)).toEqual(['published-1']);
    expect(privateResults.map((item) => item.id)).toEqual(['private-published-1']);
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
