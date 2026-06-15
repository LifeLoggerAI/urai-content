import { afterEach, describe, expect, it } from 'vitest';
import { createRuntimeContentRepository, resetRuntimeMemoryRepositoryForTests } from '../src/server/content/service';
import type { ContentItem } from '../src/server/content/types';

function item(): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'content-1',
    slug: 'content-one',
    title: 'Content One',
    body: 'Body',
    tags: [],
    locale: 'en-US',
    status: 'published',
    visibility: 'public',
    createdBy: 'test',
    updatedAt: now,
    createdAt: now,
    sourceLabel: 'test',
    whyShownCopy: 'Test item.',
    safetyNotes: [],
    contentType: 'story'
  };
}

afterEach(() => {
  resetRuntimeMemoryRepositoryForTests();
});

describe('runtime memory repository', () => {
  it('persists local runtime writes until reset', async () => {
    const first = createRuntimeContentRepository();
    await first.upsertContent(item());

    const second = createRuntimeContentRepository();

    expect(second).toBe(first);
    expect(await second.getContent('content-1')).toMatchObject({ id: 'content-1' });

    resetRuntimeMemoryRepositoryForTests();

    const reset = createRuntimeContentRepository();
    expect(reset).not.toBe(first);
    expect(await reset.getContent('content-1')).toBeNull();
  });
});
