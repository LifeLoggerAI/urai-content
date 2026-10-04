import { createHash } from 'node:crypto';
import type { SearchIndexCandidate, SearchIndexPolicy } from './contracts.js';
import { decideSearchIndexing } from './contracts.js';

export type SearchDocument = {
  indexId: string;
  entityId: string;
  entityVersion: string;
  locale: string;
  title: string;
  text: string;
  taxonomyTermIds: string[];
  provenanceRecordId: string;
  entitlementKey: string | null;
  sourceChecksum: string;
};

export function searchIndexId(entityId: string, entityVersion: string, locale: string): string {
  return createHash('sha256').update(entityId + '\0' + entityVersion + '\0' + locale).digest('hex');
}

export function buildSearchDocument(
  candidate: SearchIndexCandidate,
  policy: SearchIndexPolicy,
  input: Omit<SearchDocument, 'indexId' | 'entityId' | 'locale'> & { entityVersion: string },
): SearchDocument {
  const decision = decideSearchIndexing(candidate, policy);
  if (!decision.indexText) throw new Error('Search indexing denied: ' + decision.reason);
  if (!input.entityVersion || !input.sourceChecksum || !input.title.trim()) throw new Error('Search document version, checksum and title are required');
  return {
    ...input,
    entityId: candidate.entityId,
    locale: candidate.locale,
    indexId: searchIndexId(candidate.entityId, input.entityVersion, candidate.locale),
    taxonomyTermIds: [...new Set(input.taxonomyTermIds)].sort(),
    provenanceRecordId: candidate.provenanceRecordId,
  };
}
