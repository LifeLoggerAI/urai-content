/** R311 Content authenticated, read-only authority binding for the R310 issuer.
 * Requires server-verified Firebase ID token captured OUTSIDE request JSON.
 * Existing contentVersions / publishingReleases collections are preserved;
 * approval/identity receipts are new REQUIRED schemas, not presumed populated.
 */
import type { AuthorizedContentRelease, ReleaseAuthority } from './marketing-release-envelope.js';
import { evaluatePublication } from './release.js';

type Snap = { exists: boolean; data(): Record<string, any> };
type Firestore = { projectId?: string; collection(path: string): { doc(id: string): { get(): Promise<Snap> } } };
type ServiceIdentity = { serviceId: string; email: string };
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA = /^[a-f0-9]{40}$/i;
const HASH = /^[a-f0-9]{64}$/i;
const valid = (s: unknown): s is string => typeof s === 'string' && ID.test(s);
const cleanDate = (s: unknown) => typeof s === 'string' && Number.isFinite(Date.parse(s));

export function createFirestoreContentReleaseAuthority({
  db, serviceToken, verifyServiceIdentity, projectId, clock=Date.now,
}: {db: Firestore; serviceToken: string; verifyServiceIdentity: (token: string) => Promise<ServiceIdentity>; projectId: string; clock?: () => number}): ReleaseAuthority {
  if (!db?.collection || typeof verifyServiceIdentity !== 'function' || !valid(projectId) || db.projectId!==projectId || !serviceToken)
    throw new Error('trusted Firebase Content project and service OIDC identity required');
  const get = async (col: string, key: unknown): Promise<Record<string, any>|null> => {
    if (!valid(key)) return null;
    const s=await db.collection(col).doc(key).get();return s.exists?s.data():null;
  };
  let verifiedActor: string|null=null;
  async function identify() {
    // Google-signed service identity, not Firebase user ID tokens.
    const identity=await verifyServiceIdentity(serviceToken);
    if (!valid(identity.serviceId) || !identity.email) return null;
    const caller=await get('publishingCallers',identity.serviceId);
    if (!caller || caller.serviceId!==identity.serviceId || caller.email!==identity.email ||
      caller.active!==true || caller.revoked!==false ||
      !Array.isArray(caller.roles) || !caller.roles.includes('content-release-issuer')) return null;
    return identity.serviceId;
  }
  async function verifyReceipt(kind: string, receiptId: unknown, release: any, now: number): Promise<boolean> {
    const receipt=await get('publishingApprovalReceipts',receiptId);
    if (!receipt || receipt.kind!==kind || receipt.state!=='APPROVED' || receipt.releaseId!==release.releaseId ||
       receipt.contentId!==release.candidate?.contentId || receipt.revision!==release.candidate?.contentRevision ||
       receipt.sourceSha!==release.sourceSha || receipt.revokedAt!==null ||
       !valid(receipt.reviewerUid) || !cleanDate(receipt.approvedAt) || Date.parse(receipt.approvedAt)>now ||
       (receipt.expiresAt!==null && (!cleanDate(receipt.expiresAt) || Date.parse(receipt.expiresAt)<=now))) return false;
    const reviewer=await get('publishingReviewers',receipt.reviewerUid);
    if (!reviewer || reviewer.active!==true || reviewer.revoked===true || !Array.isArray(reviewer.roles) ||
      !reviewer.roles.includes(kind)) return false;
    if (kind==='technical' && receipt.reviewerUid===release.ownerUid) return false;
    if (kind==='owner' && receipt.reviewerUid!==release.ownerUid) return false;
    return true;
  }
  async function readChecked(releaseId: string, expectedSha?: string): Promise<AuthorizedContentRelease|null> {
    if (!verifiedActor || await identify()!==verifiedActor || !valid(releaseId)) return null;
    const r=await get('publishingReleases',releaseId);
    if (!r || r.releaseId!==releaseId || r.campaignId!=='urai-global-45-plus-45' ||
        r.state!=='APPROVED' || r.revoked!==false || r.revokedAt!==null || r.hold!==true ||
        !SHA.test(r.sourceSha||'') || r.currentSourceSha!==r.sourceSha ||
        (expectedSha!==undefined && r.sourceSha!==expectedSha) || !valid(r.ownerUid) ||
        !r.candidate || !evaluatePublication(r.candidate).allowed ||
        r.candidate.contentRevision!==r.currentRevision || !valid(r.contentVersionId) ||
        !valid(r.platformAccountId) || !valid(r.issuerKeyId) || !valid(r.nativeAccountId) ||
        r.issuerServiceId!==verifiedActor || !valid(r.rightsVersion) || !valid(r.claimsVersion) ||
        !valid(r.platformAccountId) || !valid(r.media?.bucket) || !/^[1-9][0-9]{0,19}$/.test(r.media?.generation||'') ||
        !valid(r.media?.storageKey) || !valid(r.media?.assetId) ||
        !valid(r.media?.version) || !HASH.test(r.media?.sha256||'')) return null;
    const version=await get('contentVersions',r.contentVersionId);
    if (!version || version.contentId!==r.candidate.contentId ||
      version.revision!==r.currentRevision || version.sourceSha!==r.sourceSha || version.state!=='APPROVED') return null;
    const media=await get('approvedMediaObjects',r.media.storageKey);
    if (!media || media.sha256!==r.media.sha256 || media.bucket!==r.media.bucket ||
      media.generation!==r.media.generation || media.state!=='APPROVED' || media.revoked===true ||
      !valid(String(media.generation||'')) || media.storageKey!==r.media.storageKey) return null;
    const now=Number(clock());if(!Number.isFinite(now))return null;
    const issuerKey=await get('publishingIssuerKeys',r.issuerKeyId);
    if(!issuerKey||issuerKey.serviceId!==verifiedActor||issuerKey.state!=='ACTIVE'||issuerKey.revokedAt!==null||
       !cleanDate(issuerKey.expiresAt)||Date.parse(issuerKey.expiresAt)<=now)return null;
    if(!cleanDate(r.releaseExpiresAt)||Date.parse(r.releaseExpiresAt)<=now)return null;
    const fields: Array<[string,string]>=[['rights','rightsReceiptId'],['claims','claimsReceiptId'],
      ['accessibility','accessibilityReceiptId'],['locale','localeReceiptId'],
      ['owner','ownerApprovalReceiptId'],['technical','technicalAcceptanceReceiptId']];
    if (r.privacyClass==='consented-subject') {
      const grant=await get('publishingConsentGrants',r.consentGrantId);
      if(!valid(r.consentVersion)||!grant||grant.version!==r.consentVersion||grant.receiptId!==r.consentReceiptId||
        grant.state!=='ACTIVE'||grant.revokedAt!==null||grant.ownerUid!==r.ownerUid||
        !cleanDate(grant.expiresAt)||Date.parse(grant.expiresAt)<=now)return null;
      fields.push(['consent','consentReceiptId']);
    }
    if (!['public-original','consented-subject'].includes(r.privacyClass)) return null;
    const checks=await Promise.all(fields.map(([kind,field])=>verifyReceipt(kind,r[field],r,now)));
    if (checks.some(x=>!x)) return null;
    const out:AuthorizedContentRelease={releaseId:r.releaseId,campaignId:r.campaignId,
      ownerId:r.ownerUid,contentVersionId:r.contentVersionId,releaseState:'APPROVED',publicationHold:true,
      issuerServiceId:verifiedActor,issuerKeyId:r.issuerKeyId,nativeAccountId:r.nativeAccountId,
      rightsVersion:r.rightsVersion,claimsVersion:r.claimsVersion,
      technicalReceiptId:r.technicalAcceptanceReceiptId,consentVersion:r.consentVersion??null,
      candidate:r.candidate,platform:r.platform,platformAccountId:r.platformAccountId,
      sourceSha:r.sourceSha,destinationUrl:r.destinationUrl,
      media:{assetId:r.media.assetId,version:r.media.version,bucket:r.media.bucket,
        storageKey:r.media.storageKey,generation:r.media.generation,sha256:r.media.sha256},
      privacyClass:r.privacyClass,consentReceiptId:r.consentReceiptId??null,
      rightsReceiptId:r.rightsReceiptId,claimsReceiptId:r.claimsReceiptId,
      accessibilityReceiptId:r.accessibilityReceiptId,localeReceiptId:r.localeReceiptId,
      ownerApprovalReceiptId:r.ownerApprovalReceiptId};
    return out;
  }
  return {
    async authenticateService(_requestId) {
      // requestId is correlation ONLY. Never interpreted as proof of identity.
      verifiedActor=await identify();
      return verifiedActor?{authorized:true,serviceId:verifiedActor}:null;
    },
    async readApprovedRelease(releaseId) {return readChecked(releaseId);},
    async assertCurrent(releaseId,sourceSha) {return (await readChecked(releaseId,sourceSha))!==null;},
  };
}
