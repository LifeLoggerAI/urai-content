export type SearchVisibility = 'public' | 'tiered' | 'private';

export type SearchIndexCandidate = {
  entityId: string;
  locale: string;
  visibility: SearchVisibility;
  userDerived: boolean;
  consentRecordId: string | null;
  provenanceRecordId: string;
  deleted: boolean;
};

export type SearchIndexPolicy = {
  semanticIndexEnabled: boolean;
  allowTieredContent: boolean;
  allowUserDerivedContent: boolean;
};

export type SearchIndexDecision = {
  indexText: boolean;
  indexEmbedding: boolean;
  reason: string;
};

export function decideSearchIndexing(
  candidate: SearchIndexCandidate,
  policy: SearchIndexPolicy,
): SearchIndexDecision {
  if (!candidate.entityId || !candidate.locale || !candidate.provenanceRecordId) {
    throw new Error('Search candidate identity, locale and provenance are required');
  }
  if (candidate.deleted) return { indexText: false, indexEmbedding: false, reason: 'deleted content is never indexed' };
  if (candidate.visibility === 'private') return { indexText: false, indexEmbedding: false, reason: 'private content is excluded' };
  if (candidate.visibility === 'tiered' && !policy.allowTieredContent) {
    return { indexText: false, indexEmbedding: false, reason: 'tiered indexing is disabled' };
  }
  if (candidate.userDerived && (!policy.allowUserDerivedContent || !candidate.consentRecordId)) {
    return { indexText: false, indexEmbedding: false, reason: 'user-derived indexing requires policy authorization and consent' };
  }

  return {
    indexText: true,
    indexEmbedding: policy.semanticIndexEnabled,
    reason: policy.semanticIndexEnabled ? 'approved for text and semantic index' : 'approved for text index only',
  };
}
