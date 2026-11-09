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
  it('denies blank content/locale/provenance/approval identities', () => {
    const c={...candidate,contentId:'  ',locale:' ',localeVersion:' ',provenanceRecordId:' ',approvedBy:' ',approvedAt:'invalid'};
    const result=evaluatePublication(c);
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain('content ID is missing');
    expect(result.reasons).toContain('locale is missing');
    expect(result.reasons).toContain('human publication approval is missing or invalid');
  });
  it('denies invalid revisions and duplicate/unnamed assets', () => {
    const c={...candidate,contentRevision:NaN,assets:[candidate.assets[0],{...candidate.assets[0]},{...candidate.assets[0],assetId:' '}]};
    const result=evaluatePublication(c);
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain('duplicate asset reference: a1');
    expect(result.reasons).toContain('content revision is invalid');
    expect(result.reasons).toContain('asset identity is missing');
  });
  it('preserves approved text-only posts', () => {
    expect(evaluatePublication({...candidate,assets:[]}).allowed).toBe(true);
  });
  it('denies missing release times and releases before approval', () => {
    expect(() => createPublicationReceipt('rel-3',candidate,'','operator')).toThrow('timestamp is invalid');
    expect(() => createPublicationReceipt('rel-3',candidate,'2026-09-22T23:00:00Z','operator')).toThrow('precedes human approval');
  });
});
