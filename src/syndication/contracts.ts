export type SyndicationState = 'draft' | 'approved' | 'active' | 'paused' | 'withdrawn' | 'revoked';

export type SyndicationGrant = {
  id: string;
  contentPackageId: string;
  tenantId: string;
  destinationId: string;
  state: SyndicationState;
  version: string;
  licenseId: string;
  rightsEvidenceRefs: string[];
  territories: string[];
  attribution: string | null;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  provenanceRecordId: string;
  approvedBy: string | null;
  approvedAt: string | null;
};

export function validateSyndicationGrant(grant: SyndicationGrant): SyndicationGrant {
  if (!grant.id || !grant.contentPackageId || !grant.tenantId || !grant.destinationId || !grant.version || !grant.licenseId || !grant.provenanceRecordId) {
    throw new Error('Syndication identity, tenant, license and provenance are required');
  }
  if ((grant.state === 'approved' || grant.state === 'active') && (!grant.approvedBy || !grant.approvedAt)) {
    throw new Error('Approved syndication requires human approval');
  }
  if (grant.state === 'revoked' && !grant.revokedAt) throw new Error('Revoked syndication requires revocation timestamp');
  return {...grant,rightsEvidenceRefs:[...new Set(grant.rightsEvidenceRefs)].sort(),territories:[...new Set(grant.territories)].sort()};
}

export function syndicationIsDeliverable(grant: SyndicationGrant, now: string): boolean {
  if (grant.state !== 'active' || grant.revokedAt) return false;
  if (Date.parse(now) < Date.parse(grant.startsAt)) return false;
  if (grant.expiresAt && Date.parse(now) >= Date.parse(grant.expiresAt)) return false;
  return true;
}
