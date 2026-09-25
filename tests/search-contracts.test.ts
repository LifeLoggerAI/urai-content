import { describe, expect, it } from 'vitest';
import { decideSearchIndexing } from '../src/search/contracts.js';

const policy = { semanticIndexEnabled: false, allowTieredContent: true, allowUserDerivedContent: false };
const base = {
  entityId: 'content-1',
  locale: 'en-US',
  visibility: 'public' as const,
  userDerived: false,
  consentRecordId: null,
  provenanceRecordId: 'prov-1',
  deleted: false,
};

describe('privacy-safe search indexing contract', () => {
  it('indexes approved public content without silently enabling embeddings', () => {
    expect(decideSearchIndexing(base, policy)).toEqual({
      indexText: true,
      indexEmbedding: false,
      reason: 'approved for text index only',
    });
  });

  it('excludes private, deleted and unconsented user-derived content', () => {
    expect(decideSearchIndexing({ ...base, visibility: 'private' }, policy).indexText).toBe(false);
    expect(decideSearchIndexing({ ...base, deleted: true }, policy).indexText).toBe(false);
    expect(decideSearchIndexing({ ...base, userDerived: true }, policy).indexText).toBe(false);
  });
});
