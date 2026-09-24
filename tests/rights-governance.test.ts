import { describe, expect, it } from 'vitest';
import { rightsPermitPublication, validateRightsDecision } from '../src/governance/rights.js';
import type { ContentLicense, ProvenanceRecord } from '../src/schemas/production.js';

const provenance: ProvenanceRecord = {
  id: 'prov-1', entityId: 'content-1', entityType: 'content', action: 'created',
  actorId: 'author-1', sourceSystem: 'urai-content', timestamp: '2026-09-23T00:00:00.000Z',
  evidence: ['source-1'], metadata: {}
};
const license: ContentLicense = {
  id: 'lic-1', contentPackId: 'pack-1', licenseeId: 'user-1', scope: 'personal',
  status: 'published', startsAt: '2026-09-23T00:00:00.000Z', expiresAt: null,
  territory: [], allowedUses: ['display'], prohibitedUses: [], royaltyNotes: '',
  provenanceRecordId: 'prov-1',
  audit: { createdBy: 'admin', updatedBy: 'admin', reviewedBy: 'admin', source: 'manual' }
};

describe('rights governance', () => {
  it('does not convert technical provenance into legal approval', () => {
    const decision = validateRightsDecision({
      contentId: 'content-1', rightsHolderId: 'holder-1', provenanceRecordId: 'prov-1',
      licenseId: 'lic-1', reviewState: 'legal_review_required', reviewedBy: null, reviewedAt: null,
      evidenceRefs: ['e1'], attribution: null, restrictions: [], expiresAt: null, revokedAt: null
    }, provenance, license);
    expect(rightsPermitPublication(decision, '2026-09-24T00:00:00.000Z')).toBe(false);
  });

  it('requires human review for approval and fails closed after revocation/expiry', () => {
    const base = {
      contentId: 'content-1', rightsHolderId: 'holder-1', provenanceRecordId: 'prov-1',
      licenseId: 'lic-1', reviewState: 'approved' as const, reviewedBy: 'reviewer-1',
      reviewedAt: '2026-09-23T00:00:00.000Z', evidenceRefs: [], attribution: null,
      restrictions: [], expiresAt: '2026-10-01T00:00:00.000Z', revokedAt: null
    };
    const approved = validateRightsDecision(base, provenance, license);
    expect(rightsPermitPublication(approved, '2026-09-24T00:00:00.000Z')).toBe(true);
    expect(rightsPermitPublication(approved, '2026-10-02T00:00:00.000Z')).toBe(false);
    expect(() => validateRightsDecision({ ...base, reviewedBy: null }, provenance, license)).toThrow('human reviewer');
  });
});
