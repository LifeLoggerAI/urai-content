/** URAI Content trusted Ed25519 release-v2 issuer; no public dispatch. */
import { createPrivateKey, sign } from 'node:crypto';
import { canonicalReleaseV2, RELEASE_V2_DOMAIN, RELEASE_V2_SCHEMA } from './canonical-release-v2.js';
import { evaluatePublication, type PublicationCandidate } from './release.js';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const HASH = /^[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
const GENERATION = /^[1-9][0-9]{0,19}$/;
const valid = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
const MEDIA_FIELDS = ['assetId','version','bucket','storageKey','generation','sha256'];
export type ReleasePlatform = 'Instagram'|'TikTok'|'YouTube'|'Facebook'|'LinkedIn'|'X'|'Threads'|'Bluesky'|'Pinterest';
export type ReleaseMedia = {assetId: string;version: string;bucket: string;storageKey: string;generation: string;sha256: string};
export type AuthorizedContentRelease = {
  releaseId: string;campaignId: 'urai-global-45-plus-45';candidate: PublicationCandidate;
  ownerId: string;contentVersionId: string;releaseState: 'APPROVED';publicationHold: true;
  platform: ReleasePlatform;platformAccountId: string;nativeAccountId: string;
  sourceSha: string;destinationUrl: string;media: ReleaseMedia;
  privacyClass: 'public-original'|'consented-subject';consentReceiptId: string|null;consentVersion: string|null;
  rightsReceiptId: string;rightsVersion: string;claimsReceiptId: string;claimsVersion: string;
  accessibilityReceiptId: string;localeReceiptId: string;technicalReceiptId: string;ownerApprovalReceiptId: string;
};
export type ReleaseAuthority = {
  authenticateService(requestId: string): Promise<{authorized: true;serviceId: string}|null>;
  readApprovedRelease(releaseId: string): Promise<AuthorizedContentRelease|null>;
  assertCurrent(releaseId: string, sourceSha: string): Promise<boolean>;
};
export type MarketingReleasePayload = {
  schema: typeof RELEASE_V2_SCHEMA;issuer: 'urai-content';keyId: string;issuerServiceId: string;
  releaseId: string;campaignId: 'urai-global-45-plus-45';contentId: string;ownerId: string;
  contentVersionId: string;revision: number;contentStatus: 'approved';releaseState: 'APPROVED';publicationHold: true;
  platform: ReleasePlatform;platformAccountId: string;nativeAccountId: string;
  locale: string;localeVersion: string;sourceSha: string;destinationUrl: string;provenanceId: string;
  approvedBy: string;rightsReceiptId: string;rightsVersion: string;claimsReceiptId: string;claimsVersion: string;
  accessibilityReceiptId: string;localeReceiptId: string;technicalReceiptId: string;ownerApprovalReceiptId: string;
  privacyClass: 'public-original'|'consented-subject';consentReceiptId: string|null;consentVersion: string|null;
  media: ReleaseMedia;issuedAt: string;expiresAt: string;
};
function approvedDestination(raw: string): boolean {
  try {const u=new URL(raw);return u.protocol==='https:' && !u.username && !u.password && !u.hash && !u.search &&
    u.hostname==='urai.app' && ['/', '/status', '/waitlist'].includes(u.pathname) && u.toString()===raw;}catch{return false;}
}
export async function issueSignedMarketingRelease({releaseId,requestId,authority,signingKeyPem,keyId,now=Date.now}:{
  releaseId:string;requestId:string;authority:ReleaseAuthority;signingKeyPem:string;keyId:string;now?:()=>number;
}):Promise<{keyId:string;payload:MarketingReleasePayload;signature:string}>{
  if(!valid(releaseId)||!valid(requestId)||!valid(keyId)||!signingKeyPem)throw Error('issuer configuration or release ID missing');
  if(!authority?.authenticateService||!authority?.readApprovedRelease||!authority?.assertCurrent)throw Error('trusted Content authority unavailable');
  const actor=await authority.authenticateService(requestId);
  if(actor?.authorized!==true||!valid(actor.serviceId))throw Error('issuer requester is not authenticated');
  const entry=await authority.readApprovedRelease(releaseId);
  if(!entry||entry.releaseId!==releaseId||entry.campaignId!=='urai-global-45-plus-45'||entry.releaseState!=='APPROVED'||entry.publicationHold!==true)
    throw Error('release missing or outside canonical campaign/hold');
  const c=entry.candidate;
  if(!evaluatePublication(c).allowed)throw Error('Content publication gate denied release');
  for(const id of [entry.ownerId,entry.contentVersionId,entry.platformAccountId,entry.nativeAccountId,
    entry.media?.assetId,entry.media?.version,entry.media?.bucket,entry.media?.storageKey,
    entry.rightsReceiptId,entry.rightsVersion,entry.claimsReceiptId,entry.claimsVersion,
    entry.accessibilityReceiptId,entry.localeReceiptId,entry.technicalReceiptId,entry.ownerApprovalReceiptId]){
    if(!valid(id))throw Error('missing trusted source identity or approval version');
  }
  if(!SHA.test(entry.sourceSha)||!HASH.test(entry.media.sha256)||!GENERATION.test(entry.media.generation)||
    !approvedDestination(entry.destinationUrl)||!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(c.locale))
    throw Error('invalid exact source, media generation, locale or canonical destination');
  if(!Array.isArray(c.assets)||!c.assets.some(a=>a.assetId===entry.media.assetId&&a.version===entry.media.version&&
    a.checksum==='sha256:'+entry.media.sha256&&['approved','published'].includes(a.promotionState)))
    throw Error('media not included in approved Content revision');
  if(!['public-original','consented-subject'].includes(entry.privacyClass))throw Error('privacy class unsupported');
  if(entry.privacyClass==='consented-subject'&&(!valid(entry.consentReceiptId)||!valid(entry.consentVersion)))throw Error('subject consent version missing');
  if(entry.privacyClass==='public-original'&&(entry.consentReceiptId!==null||entry.consentVersion!==null))throw Error('unexpected consent field');
  if((await authority.assertCurrent(releaseId,entry.sourceSha))!==true)throw Error('release revoked or stale');
  const timestamp=Number(now());if(!Number.isSafeInteger(timestamp)||timestamp<Date.parse(c.approvedAt!))throw Error('release time invalid');
  const payload:MarketingReleasePayload={
    schema:RELEASE_V2_SCHEMA,issuer:'urai-content',keyId,issuerServiceId:actor.serviceId,
    releaseId,campaignId:entry.campaignId,contentId:c.contentId,ownerId:entry.ownerId,
    contentVersionId:entry.contentVersionId,revision:c.contentRevision,contentStatus:'approved',
    releaseState:'APPROVED',publicationHold:true,platform:entry.platform,
    platformAccountId:entry.platformAccountId,nativeAccountId:entry.nativeAccountId,
    locale:c.locale,localeVersion:c.localeVersion,sourceSha:entry.sourceSha,destinationUrl:entry.destinationUrl,
    provenanceId:c.provenanceRecordId,approvedBy:c.approvedBy!,rightsReceiptId:entry.rightsReceiptId,
    rightsVersion:entry.rightsVersion,claimsReceiptId:entry.claimsReceiptId,claimsVersion:entry.claimsVersion,
    accessibilityReceiptId:entry.accessibilityReceiptId,localeReceiptId:entry.localeReceiptId,
    technicalReceiptId:entry.technicalReceiptId,ownerApprovalReceiptId:entry.ownerApprovalReceiptId,
    privacyClass:entry.privacyClass,consentReceiptId:entry.consentReceiptId,consentVersion:entry.consentVersion,
    media:entry.media,issuedAt:new Date(timestamp).toISOString(),expiresAt:new Date(timestamp+300000).toISOString(),
  };
  if(Object.keys(payload.media).sort().join(',')!==MEDIA_FIELDS.slice().sort().join(','))throw Error('unexpected media fields');
  const privateKey=createPrivateKey(signingKeyPem);
  if(privateKey.asymmetricKeyType!=='ed25519')throw Error('issuer requires Ed25519 signing key');
  const bytes=Buffer.from(RELEASE_V2_DOMAIN+canonicalReleaseV2(payload));
  return {keyId,payload,signature:sign(null,bytes,privateKey).toString('base64url')};
}
