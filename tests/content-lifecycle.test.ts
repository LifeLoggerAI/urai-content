import { describe, expect, it } from 'vitest';
import { applyContentMutation, createContentLifecycleState, isPurgeEligible, restoreContent, softDeleteContent } from '../src/lifecycle/contentLifecycle.js';
import type { ContentItem } from '../src/schemas/content.js';

const item: ContentItem = {
  id: 'c1', slug: 'c1', title: 'C1', body: 'body', tags: [], locale: 'en-US',
  status: 'draft', visibility: 'private', createdBy: 'operator',
  createdAt: '2026-09-23T00:00:00.000Z', updatedAt: '2026-09-23T00:00:00.000Z',
  sourceLabel: 'fixture', whyShownCopy: 'fixture', safetyNotes: [], contentType: 'story',
};

describe('content lifecycle concurrency foundation', () => {
  it('rejects stale mutations and records the exact published revision', () => {
    const state = createContentLifecycleState(item);
    const published = applyContentMutation(state, { status: 'published' }, 1);
    expect(published.revision).toBe(2);
    expect(published.publishedRevision).toBe(2);
    expect(() => applyContentMutation(published, { title: 'stale' }, 1)).toThrow('Stale content revision');
  });

  it('supports reversible soft delete and deterministic purge eligibility', () => {
    const state = createContentLifecycleState(item);
    const deleted = softDeleteContent(state, '2026-09-23T00:00:00.000Z', '2026-10-23T00:00:00.000Z', 1);
    expect(isPurgeEligible(deleted, '2026-10-24T00:00:00.000Z')).toBe(true);
    const restored = restoreContent(deleted, 2);
    expect(restored.deletedAt).toBeNull();
  });
});
