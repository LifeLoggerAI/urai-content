export type MarketplaceLifecycle =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'withdrawn'
  | 'revoked';

export type RightsMetadata = {
  rightsHolderId: string;
  licenseId: string;
  allowedUses: string[];
  prohibitedUses: string[];
  territory: string[];
  provenanceRecordId: string;
};

export type MarketplaceListingContract = {
  listingId: string;
  contentPackId: string;
  creatorId: string;
  lifecycle: MarketplaceLifecycle;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  entitlementKey: string;
  rights: RightsMetadata;
  version: number;
  synthetic: true;
  publicSaleEnabled: false;
  payoutEnabled: false;
  openUploadEnabled: false;
};

export type SyntheticEntitlementReceipt = {
  receiptVersion: '1.0.0';
  listingId: string;
  userId: string;
  entitlementKey: string;
  issuedAt: string;
  synthetic: true;
  paymentCaptured: false;
  payoutCreated: false;
  rightsProvenanceRecordId: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function validateMarketplaceListing(
  listing: MarketplaceListingContract,
): MarketplaceListingContract {
  if (listing.synthetic !== true) {
    throw new Error('Prelaunch marketplace listings must be synthetic');
  }
  if (
    listing.publicSaleEnabled !== false ||
    listing.payoutEnabled !== false ||
    listing.openUploadEnabled !== false
  ) {
    throw new Error('Prelaunch marketplace activation must remain hard-off');
  }
  if (!listing.listingId || !listing.contentPackId || !listing.creatorId || !listing.entitlementKey) {
    throw new Error('Marketplace listing identity is incomplete');
  }
  if (!listing.rights?.rightsHolderId || !listing.rights.licenseId || !listing.rights.provenanceRecordId) {
    throw new Error('Marketplace rights provenance is required');
  }
  if (!Number.isInteger(listing.version) || listing.version < 1) {
    throw new Error('Marketplace listing version must be a positive integer');
  }
  if (listing.lifecycle === 'approved' && listing.moderationStatus !== 'approved') {
    throw new Error('Approved listing requires approved moderation');
  }

  return {
    ...structuredClone(listing),
    rights: {
      ...structuredClone(listing.rights),
      allowedUses: unique(listing.rights.allowedUses),
      prohibitedUses: unique(listing.rights.prohibitedUses),
      territory: unique(listing.rights.territory),
    },
  };
}

export function transitionMarketplaceListing(
  listing: MarketplaceListingContract,
  next: MarketplaceLifecycle,
): MarketplaceListingContract {
  const current = validateMarketplaceListing(listing);
  const legal: Record<MarketplaceLifecycle, MarketplaceLifecycle[]> = {
    draft: ['submitted', 'withdrawn'],
    submitted: ['approved', 'withdrawn', 'revoked'],
    approved: ['withdrawn', 'revoked'],
    withdrawn: [],
    revoked: [],
  };

  if (!legal[current.lifecycle].includes(next)) {
    throw new Error('Illegal marketplace transition ' + current.lifecycle + ' -> ' + next);
  }
  if (next === 'approved' && current.moderationStatus !== 'approved') {
    throw new Error('Cannot approve marketplace listing before moderation approval');
  }

  return validateMarketplaceListing({
    ...current,
    lifecycle: next,
    version: current.version + 1,
    publicSaleEnabled: false,
    payoutEnabled: false,
    openUploadEnabled: false,
  });
}

export function issueSyntheticEntitlement(
  listing: MarketplaceListingContract,
  input: { userId: string; issuedAt: string },
): SyntheticEntitlementReceipt {
  const valid = validateMarketplaceListing(listing);
  if (valid.lifecycle !== 'approved') {
    throw new Error('Synthetic entitlement requires an approved listing');
  }
  if (!input.userId || !input.issuedAt) throw new Error('Synthetic entitlement identity is required');

  return {
    receiptVersion: '1.0.0',
    listingId: valid.listingId,
    userId: input.userId,
    entitlementKey: valid.entitlementKey,
    issuedAt: input.issuedAt,
    synthetic: true,
    paymentCaptured: false,
    payoutCreated: false,
    rightsProvenanceRecordId: valid.rights.provenanceRecordId,
  };
}
