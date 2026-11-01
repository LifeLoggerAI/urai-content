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

export type PublicationDecision = { allowed: boolean; reasons: string[] };

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

function nonBlank(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validTimestamp(value: string | null | undefined): boolean {
  return nonBlank(value)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value!)
    && Number.isFinite(Date.parse(value!));
}

export function evaluatePublication(candidate: PublicationCandidate): PublicationDecision {
  const reasons: string[] = [];
  if (!nonBlank(candidate.contentId)) reasons.push('content ID is missing');
  if (candidate.contentStatus !== 'approved') reasons.push('content is not approved');
  if (!nonBlank(candidate.locale)) reasons.push('locale is missing');
  if (!nonBlank(candidate.localeVersion)) reasons.push('locale version is missing');
  if (!nonBlank(candidate.provenanceRecordId)) reasons.push('provenance is missing');
  if (!candidate.rightsApproved) reasons.push('rights approval is missing');
  if (!candidate.accessibilityAccepted) reasons.push('accessibility acceptance is missing');
  if (!candidate.translationApproved) reasons.push('locale translation approval is missing');
  if (!nonBlank(candidate.approvedBy) || !validTimestamp(candidate.approvedAt)) {
    reasons.push('human publication approval is missing or invalid');
  }
  if (!Number.isSafeInteger(candidate.contentRevision) || candidate.contentRevision < 1) {
    reasons.push('content revision is invalid');
  }
  if (!Array.isArray(candidate.assets)) {
    reasons.push('asset list is invalid');
  } else {
    const seenAssets = new Set<string>();
    for (const asset of candidate.assets) {
      if (!asset || !nonBlank(asset.assetId) || !nonBlank(asset.version)) {
        reasons.push('asset identity is missing');
        continue;
      }
      const assetKey = JSON.stringify([asset.assetId, asset.version]);
      if (seenAssets.has(assetKey)) reasons.push('duplicate asset reference: ' + asset.assetId);
      seenAssets.add(assetKey);
      if (asset.promotionState !== 'approved' && asset.promotionState !== 'published') {
        reasons.push('asset is not promotion-approved: ' + asset.assetId);
      }
      if (!/^sha256:[a-f0-9]{64}$/i.test(asset.checksum)) {
        reasons.push('asset checksum is invalid: ' + asset.assetId);
      }
    }
  }
  // Zero-asset approved text-only publications remain supported.
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
  if (!nonBlank(releaseId) || !nonBlank(releasedBy)) {
    throw new Error('Publication receipt identity is required');
  }
  if (!validTimestamp(releasedAt)) throw new Error('Publication receipt timestamp is invalid');
  if (Date.parse(releasedAt) < Date.parse(candidate.approvedAt!)) {
    throw new Error('Publication receipt precedes human approval');
  }
  const payload = { format:'urai-content-publication-receipt' as const, version:'1.0.0' as const, releaseId, candidate, releasedAt, releasedBy };
  return { ...payload, checksum: sha(payload) };
}
