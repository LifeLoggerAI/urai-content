import { describe, expect, it } from 'vitest';
import { generateKeyPairSync, verify } from 'node:crypto';
import { issueSignedMarketingRelease, type AuthorizedContentRelease, type ReleaseAuthority } from '../src/publishing/marketing-release-envelope.js';
import { canonicalReleaseV2, RELEASE_V2_DOMAIN, RELEASE_V2_SCHEMA } from '../src/publishing/canonical-release-v2.js';

const date = Date.parse('2026-11-01T12:00:00Z');
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const signingKeyPem = privateKey.export({format:'pem',type:'pkcs8'}).toString();
const content: AuthorizedContentRelease = {
  releaseId:'release-1',campaignId:'urai-global-45-plus-45',platform:'Facebook',platformAccountId:'facebook-123',
  releaseState:'APPROVED',publicationHold:true,issuerServiceId:'content-service',issuerKeyId:'issuer-key-1',
  ownerId:'owner-1',contentVersionId:'content-v1',nativeAccountId:'native-facebook-123',
  sourceSha:'a'.repeat(40),destinationUrl:'https://urai.app/status',
  candidate:{contentId:'GENESIS-D01',contentRevision:1,contentStatus:'approved',locale:'en',localeVersion:'1',
    translationApproved:true,accessibilityAccepted:true,provenanceRecordId:'prov-1',rightsApproved:true,
    approvedBy:'reviewer-1',approvedAt:'2026-11-01T11:00:00.000Z',
    assets:[{assetId:'asset-1',version:'1',checksum:'sha256:'+'b'.repeat(64),promotionState:'approved'}]},
  media:{assetId:'asset-1',version:'1',bucket:'urai-staging-media',generation:'123456789',sha256:'b'.repeat(64),storageKey:'storage-1'},
  privacyClass:'public-original',consentReceiptId:null,consentVersion:null,
  rightsReceiptId:'rights-1',rightsVersion:'rights-v1',claimsReceiptId:'claims-1',claimsVersion:'claims-v1',technicalReceiptId:'tech-1',accessibilityReceiptId:'a11y-1',
  localeReceiptId:'locale-1',ownerApprovalReceiptId:'owner-1',
};
function authority(record: AuthorizedContentRelease|null=content, opts:{unauthorized?:boolean;revoked?:boolean}={}): ReleaseAuthority {
  return {async authenticateService(){return opts.unauthorized?null:{authorized:true as const,serviceId:'content-service'};},
    async readApprovedRelease(){return record;},async assertCurrent(){return !opts.revoked;}};
}
const args=(a:ReleaseAuthority=authority())=>({releaseId:'release-1',requestId:'request-1',authority:a,signingKeyPem,keyId:'issuer-key-1',now:()=>date});

describe('Content to Marketing signed release issuer',()=>{
  it('signs only the exact approved immutable snapshot',async()=>{
    const e=await issueSignedMarketingRelease(args());
    expect(e.payload.releaseId).toBe('release-1');
    expect(e.payload.expiresAt).toBe('2026-11-01T12:05:00.000Z');
    expect(e.payload.schema).toBe(RELEASE_V2_SCHEMA);
    expect(e.payload.media.generation).toBe('123456789');
    expect(verify(null,Buffer.from(RELEASE_V2_DOMAIN+canonicalReleaseV2(e.payload)),publicKey,Buffer.from(e.signature,'base64url'))).toBe(true);
  });
  it('rejects unsigned identities and unauthenticated issuer context',async()=>{
    await expect(issueSignedMarketingRelease(args(authority(content,{unauthorized:true})))).rejects.toThrow('authenticated');
  });
  it('rejects missing source release',async()=>{
    await expect(issueSignedMarketingRelease(args(authority(null)))).rejects.toThrow('missing');
  });
  it('rejects Content publication gate failure',async()=>{
    const c=structuredClone(content);c.candidate.rightsApproved=false;
    await expect(issueSignedMarketingRelease(args(authority(c)))).rejects.toThrow('Content publication gate');
  });
  it('rejects media reference outside approved asset revision',async()=>{
    const c=structuredClone(content);c.media.sha256='c'.repeat(64);
    await expect(issueSignedMarketingRelease(args(authority(c)))).rejects.toThrow('not included');
  });
  it('rejects revoked source release',async()=>{
    await expect(issueSignedMarketingRelease(args(authority(content,{revoked:true})))).rejects.toThrow('revoked');
  });
  it('requires explicit subject consent on sensitive media',async()=>{
    const c=structuredClone(content);c.privacyClass='consented-subject';c.consentReceiptId=null;
    await expect(issueSignedMarketingRelease(args(authority(c)))).rejects.toThrow('subject consent');
  });
  it('rejects future approval timestamps and missing platform identity',async()=>{
    const c=structuredClone(content);c.platformAccountId='';
    await expect(issueSignedMarketingRelease(args(authority(c)))).rejects.toThrow('missing trusted source identity');
    const future=structuredClone(content);future.candidate.approvedAt='2027-01-01T00:00:00.000Z';
    await expect(issueSignedMarketingRelease(args(authority(future)))).rejects.toThrow('time invalid');
  });
});
