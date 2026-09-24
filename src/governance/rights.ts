import type { ContentLicense, ProvenanceRecord } from '../schemas/production.js';

export type RightsReviewState = 'unreviewed' | 'technical_review' | 'legal_review_required' | 'approved' | 'revoked';

export type RightsDecision = {
  contentId: string;
  rightsHolderId: string;
  provenanceRecordId: string;
  licenseId: string | null;
  reviewState: RightsReviewState;
  reviewedBy: string | null;
  reviewedAt: string | null;
  evidenceRefs: string[];
  attribution: string | null;
  restrictions: string[];
  expiresAt: string | null;
  revokedAt: string | null;
};

export function validateRightsDecision(
  decision: RightsDecision,
  provenance: ProvenanceRecord,
  license: ContentLicense | null,
): RightsDecision {
  if (!decision.contentId || !decision.rightsHolderId || !decision.provenanceRecordId) {
    throw new Error('Rights decision identity, holder and provenance are required');
  }
  if (decision.provenanceRecordId !== provenance.id) {
    throw new Error('Rights decision provenance reference does not resolve');
  }
  if (decision.licenseId && (!license || license.id !== decision.licenseId)) {
    throw new Error('Rights decision license reference does not resolve');
  }
  if (decision.reviewState === 'approved' && (!decision.reviewedBy || !decision.reviewedAt)) {
    throw new Error('Approved rights decision requires human reviewer identity and timestamp');
  }
  if (decision.reviewState === 'revoked' && !decision.revokedAt) {
    throw new Error('Revoked rights decision requires revocation timestamp');
  }
  if (decision.expiresAt && Number.isNaN(Date.parse(decision.expiresAt))) {
    throw new Error('Rights expiration timestamp is invalid');
  }
  return {
    ...decision,
    evidenceRefs: [...new Set(decision.evidenceRefs)].sort(),
    restrictions: [...new Set(decision.restrictions)].sort(),
  };
}

export function rightsPermitPublication(decision: RightsDecision, now: string): boolean {
  if (decision.reviewState !== 'approved' || decision.revokedAt) return false;
  if (decision.expiresAt && Date.parse(now) >= Date.parse(decision.expiresAt)) return false;
  return true;
}
