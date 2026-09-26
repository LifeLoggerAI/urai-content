import { describe, expect, it } from 'vitest';
import { buildSearchDocument, searchIndexId } from '../src/search/document.js';

const candidate = {
  entityId: 'c1', locale: 'en-US', visibility: 'public' as const, userDerived: false,
  consentRecordId: null, provenanceRecordId: 'p1', deleted: false
};
const policy = { semanticIndexEnabled: false, allowTieredContent: false, allowUserDerivedContent: false };

describe('search document foundation', () => {
  it('uses deterministic versioned locale-aware index IDs', () => {
    const doc = buildSearchDocument(candidate, policy, {
      entityVersion: '2', title: 'Title', text: 'Text', taxonomyTermIds: ['b', 'a', 'a'],
      provenanceRecordId: 'p1', entitlementKey: null, sourceChecksum: 'sha256:' + 'a'.repeat(64)
    });
    expect(doc.indexId).toBe(searchIndexId('c1', '2', 'en-US'));
    expect(doc.taxonomyTermIds).toEqual(['a', 'b']);
  });

  it('fails closed for private content', () => {
    expect(() => buildSearchDocument({ ...candidate, visibility: 'private' }, policy, {
      entityVersion: '1', title: 'Title', text: 'Text', taxonomyTermIds: [], provenanceRecordId: 'p1',
      entitlementKey: null, sourceChecksum: 'sha256:' + 'a'.repeat(64)
    })).toThrow('Search indexing denied');
  });
});
