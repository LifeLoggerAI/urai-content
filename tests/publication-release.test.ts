import { describe, expect, it } from 'vitest';
import { createPublicationReceipt, evaluatePublication } from '../src/publishing/release.js';

const digest='sha256:'+'a'.repeat(64);
const candidate = {
  contentId:'c1', contentRevision:3, contentStatus:'approved' as const,
  locale:'en', localeVersion:'1', translationApproved:true, accessibilityAccepted:true,
  provenanceRecordId:'p1', rightsApproved:true, approvedBy:'reviewer', approvedAt:'2026-09-23T00:00:00.000Z',
  assets:[{assetId:'a1',version:'1',checksum:digest,promotionState:'approved' as const}]
};

describe('publication safety contract', () => {
  it('creates a receipt only from an exact approved candidate', () => {
    expect(evaluatePublication(candidate).allowed).toBe(true);
    expect(createPublicationReceipt('rel-1',candidate,'2026-09-23T01:00:00.000Z','operator').checksum).toMatch(/^sha256:/);
  });

  it('denies drafts, unapproved assets and missing human gates', () => {
    const denied={...candidate,contentStatus:'draft' as const,rightsApproved:false,assets:[{...candidate.assets[0],promotionState:'generated' as const}]};
    const result=evaluatePublication(denied);
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(' ')).toContain('rights');
    expect(() => createPublicationReceipt('rel-2',denied,'2026-09-23T01:00:00.000Z','operator')).toThrow('Publication denied');
  });
});
