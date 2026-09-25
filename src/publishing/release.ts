import { createHash } from 'node:crypto';

export type PublicationAssetRef = {
  assetId: string;
  version: string;
  checksum: string;
  promotionState: 'generated' | 'validated' | 'approved' | 'published';
};

export type PublicationCandidate = {
  contentId: string;
  contentRevision: number;
  contentStatus: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  locale: string;
  localeVersion: string;
  translationApproved: boolean;
  accessibilityAccepted: boolean;
  provenanceRecordId: string;
  rightsApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  assets: PublicationAssetRef[];
};

export type PublicationDecision = {
  allowed: boolean;
  reasons: string[];
};

export type PublicationReceipt = {
  format: 'urai-content-publication-receipt';
  version: '1.0.0';
  releaseId: string;
  candidate: PublicationCandidate;
  releasedAt: string;
  releasedBy: string;
  checksum: string;
};

function sha(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function evaluatePublication(candidate: PublicationCandidate): PublicationDecision {
  const reasons: string[] = [];
  if (candidate.contentStatus !== 'approved') reasons.push('content is not approved');
  if (!candidate.provenanceRecordId) reasons.push('provenance is missing');
  if (!candidate.rightsApproved) reasons.push('rights approval is missing');
  if (!candidate.accessibilityAccepted) reasons.push('accessibility acceptance is missing');
  if (!candidate.translationApproved) reasons.push('locale translation approval is missing');
  if (!candidate.approvedBy || !candidate.approvedAt) reasons.push('human publication approval is missing');
  if (candidate.contentRevision < 1) reasons.push('content revision is invalid');
  for (const asset of candidate.assets) {
    if (asset.promotionState !== 'approved' && asset.promotionState !== 'published') {
      reasons.push('asset is not promotion-approved: ' + asset.assetId);
    }
    if (!/^sha256:[a-f0-9]{64}$/i.test(asset.checksum)) reasons.push('asset checksum is invalid: ' + asset.assetId);
  }
  return { allowed: reasons.length === 0, reasons };
}

export function createPublicationReceipt(
  releaseId: string,
  candidate: PublicationCandidate,
  releasedAt: string,
  releasedBy: string,
): PublicationReceipt {
  const decision = evaluatePublication(candidate);
  if (!decision.allowed) throw new Error('Publication denied: ' + decision.reasons.join('; '));
  if (!releaseId || !releasedBy) throw new Error('Publication receipt identity is required');
  const payload = { format:'urai-content-publication-receipt' as const, version:'1.0.0' as const, releaseId, candidate, releasedAt, releasedBy };
  return { ...payload, checksum: sha(payload) };
}
