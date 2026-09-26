import { describe, expect, it } from 'vitest';
import {
  issueSyntheticEntitlement,
  transitionMarketplaceListing,
  validateMarketplaceListing,
  type MarketplaceListingContract,
} from '../src/marketplace/contracts.js';

const base: MarketplaceListingContract = {
  listingId: 'listing-synthetic-001',
  contentPackId: 'pack-synthetic-001',
  creatorId: 'creator-synthetic-001',
  lifecycle: 'submitted',
  moderationStatus: 'approved',
  entitlementKey: 'entitlement.synthetic.pack.001',
  rights: {
    rightsHolderId: 'creator-synthetic-001',
    licenseId: 'license-synthetic-001',
    allowedUses: ['personal', 'personal'],
    prohibitedUses: ['resale'],
    territory: ['US', 'US'],
    provenanceRecordId: 'provenance-synthetic-001',
  },
  version: 1,
  synthetic: true,
  publicSaleEnabled: false,
  payoutEnabled: false,
  openUploadEnabled: false,
};

describe('hard-off marketplace lifecycle', () => {
  it('normalizes rights metadata while keeping commerce disabled', () => {
    const valid = validateMarketplaceListing(base);
    expect(valid.rights.allowedUses).toEqual(['personal']);
    expect(valid.rights.territory).toEqual(['US']);
    expect(valid.publicSaleEnabled).toBe(false);
    expect(valid.payoutEnabled).toBe(false);
  });

  it('supports moderated synthetic entitlement proof without payment or payout', () => {
    const approved = transitionMarketplaceListing(base, 'approved');
    const receipt = issueSyntheticEntitlement(approved, {
      userId: 'synthetic-user',
      issuedAt: '2026-09-23T12:00:00.000Z',
    });

    expect(receipt.paymentCaptured).toBe(false);
    expect(receipt.payoutCreated).toBe(false);
    expect(receipt.rightsProvenanceRecordId).toBe('provenance-synthetic-001');
  });

  it('prevents approval without moderation and prevents activation', () => {
    expect(() => transitionMarketplaceListing(
      { ...base, moderationStatus: 'pending' },
      'approved',
    )).toThrow('before moderation approval');

    expect(() => validateMarketplaceListing({
      ...base,
      publicSaleEnabled: true as false,
    })).toThrow('hard-off');
  });

  it('makes revoked and withdrawn listings terminal', () => {
    const revoked = transitionMarketplaceListing(base, 'revoked');
    expect(() => transitionMarketplaceListing(revoked, 'submitted')).toThrow('Illegal marketplace transition');

    const withdrawn = transitionMarketplaceListing(base, 'withdrawn');
    expect(() => issueSyntheticEntitlement(withdrawn, {
      userId: 'synthetic-user',
      issuedAt: '2026-09-23T12:00:00.000Z',
    })).toThrow('requires an approved listing');
  });
});
