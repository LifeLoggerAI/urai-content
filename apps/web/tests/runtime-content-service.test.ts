import { describe, expect, it } from 'vitest';
import { getRuntimeContentMode, RuntimeContentService } from '../src/server/content/service';
import { InMemoryContentRepository } from '../src/server/content/inMemoryRepository';
import type { ContentItem } from '../src/server/content/types';

function makeContentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();

  return {
    id: 'content-1',
    slug: 'content-one',
    title: 'Content One',
    body: 'Published content body.',
    tags: ['runtime'],
    locale: 'en-US',
    status: 'published',
    visibility: 'public',
    createdBy: 'admin',
    updatedAt: now,
    createdAt: now,
    sourceLabel: 'runtime-content-service-test',
    whyShownCopy: 'Because this is public content.',
    safetyNotes: ['non-clinical'],
    contentType: 'narrator',
    ...overrides
  };
}

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

describe('RuntimeContentService', () => {
  it('returns only published content for the requested visibility', async () => {
    const repo = new InMemoryContentRepository();
    const service = new RuntimeContentService(repo);

    await repo.upsertContent(makeContentItem({ id: 'draft-public', slug: 'draft-public', status: 'draft' }));
    await repo.upsertContent(makeContentItem({ id: 'review-public', slug: 'review-public', status: 'review' }));
    await repo.upsertContent(makeContentItem({ id: 'approved-public', slug: 'approved-public', status: 'approved' }));
    await repo.upsertContent(makeContentItem({ id: 'published-public', slug: 'published-public', status: 'published' }));
    await repo.upsertContent(makeContentItem({ id: 'archived-public', slug: 'archived-public', status: 'archived' }));
    await repo.upsertContent(makeContentItem({ id: 'published-private', slug: 'published-private', status: 'published', visibility: 'private' }));

    const publicResults = await service.searchPublishedContent('', 'public');
    const privateResults = await service.searchPublishedContent('', 'private');

    expect(publicResults.map((item) => item.id)).toEqual(['published-public']);
    expect(privateResults.map((item) => item.id)).toEqual(['published-private']);
  });

  it('matches query text across title, body, slug, and tags', async () => {
    const repo = new InMemoryContentRepository();
    const service = new RuntimeContentService(repo);

    await repo.upsertContent(makeContentItem({ id: 'title-match', title: 'Moonlit Ritual' }));
    await repo.upsertContent(makeContentItem({ id: 'body-match', body: 'A quiet lunar archive.' }));
    await repo.upsertContent(makeContentItem({ id: 'slug-match', slug: 'silver-orb' }));
    await repo.upsertContent(makeContentItem({ id: 'tag-match', tags: ['starlight'] }));
    await repo.upsertContent(makeContentItem({ id: 'miss', title: 'Different Content', body: 'No matching terms.', slug: 'different', tags: [] }));

    expect((await service.searchPublishedContent('moonlit')).map((item) => item.id)).toEqual(['title-match']);
    expect((await service.searchPublishedContent('lunar')).map((item) => item.id)).toEqual(['body-match']);
    expect((await service.searchPublishedContent('silver')).map((item) => item.id)).toEqual(['slug-match']);
    expect((await service.searchPublishedContent('starlight')).map((item) => item.id)).toEqual(['tag-match']);
  });
});
