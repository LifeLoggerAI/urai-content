/** R315 server-only, fail-closed binding for the existing v2 Content issuer.
 * `verifyServiceIdentity` MUST verify a Google-signed OIDC service token with a
 * deployment-pinned audience and service-account allowlist. No client consent
 * documents or caller-provided receipt snapshots are authoritative here.
 * All collections below are protected, server-owned staging schema contracts;
 * this source does not create them or grant IAM permissions.
 */
import type { AuthorizedContentRelease, ReleaseAuthority } from './marketing-release-envelope.js';
import { evaluatePublication } from './release.js';

type Snap = { exists: boolean; data(): Record<string, any> };
type Firestore = { projectId?: string; collection(path: string): { doc(id: string): { get(): Promise<Snap> } } };
type ServiceIdentity = { serviceId: string; email: string };
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const GENERATION = /^[1-9][0-9]{0,19}$/;
const valid = (s: unknown): s is string => typeof s === 'string' && ID.test(s);
const storageKey = (s: unknown): s is string => typeof s === 'string' && s.length < 1024 &&
  /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(s) && !s.split('/').some(k=>!k||k==='.'||k==='..');
const validDate = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const activeUntil = (until: unknown, now: number): boolean => validDate(until) && Date.parse(until) > now;

export function createFirestoreContentReleaseAuthority({
  db, projectId, serviceToken, verifyServiceIdentity, clock = Date.now,
}: {
  db: Firestore; projectId: string; serviceToken: string;
  verifyServiceIdentity: (token: string) => Promise<ServiceIdentity>; clock?: () => number;
}): ReleaseAuthority {
  if (!db?.collection || db.projectId !== projectId || !valid(projectId) ||
      !serviceToken || typeof verifyServiceIdentity !== 'function') {
    throw Error('trusted Content project and Google service identity required');
  }
  const get = async (collection: string, id: unknown): Promise<Record<string, any>|null> => {
    if (!valid(id)) return null;
    const snap = await db.collection(collection).doc(id).get();
    return snap.exists ? snap.data() : null;
  };
  async function identify(): Promise<ServiceIdentity|null> {
    // Runtime-injected verifier checks Google's signature, iss, aud, exp,
    // account allowlist. This function separately checks a server-owned role.
    const actor = await verifyServiceIdentity(serviceToken);
    if (!valid(actor?.serviceId) || typeof actor?.email !== 'string' || !actor.email.endsWith('.iam.gserviceaccount.com')) return null;
    const role = await get('publishingCallers', actor.serviceId);
    if (!role || role.serviceId !== actor.serviceId || role.email !== actor.email ||
        role.active !== true || role.revoked !== false ||
        !Array.isArray(role.roles) || !role.roles.includes('content-release-issuer')) return null;
    return actor;
  }
  async function receipt(kind: string, id: unknown, r: Record<string, any>, now: number, expectedVersion?: string): Promise<boolean> {
    const p = await get('publishingApprovalReceipts', id);
    if (!p || p.id !== id || p.kind !== kind || p.state !== 'APPROVED' ||
        p.releaseId !== r.releaseId || p.contentId !== r.candidate?.contentId ||
        p.ownerId !== r.ownerUid || p.revision !== r.currentRevision ||
        p.sourceSha !== r.sourceSha || p.revokedAt !== null ||
        !valid(p.reviewerUid) || !validDate(p.approvedAt) || Date.parse(p.approvedAt) > now ||
        !activeUntil(p.expiresAt, now) ||
        (expectedVersion !== undefined && p.version !== expectedVersion)) return false;
    const reviewer = await get('publishingReviewers', p.reviewerUid);
    if (!reviewer || reviewer.uid !== p.reviewerUid || reviewer.active !== true || reviewer.revoked !== false ||
        !Array.isArray(reviewer.roles) || !reviewer.roles.includes(kind)) return false;
    if (kind === 'owner' && p.reviewerUid !== r.ownerUid) return false;
    if (kind === 'technical' && p.reviewerUid === r.ownerUid) return false;
    return true;
  }
  async function resolve(releaseId: string, expectedSha?: string): Promise<AuthorizedContentRelease|null> {
    const actor = await identify();
    const now = Number(clock());
    if (!actor || !valid(releaseId) || !Number.isSafeInteger(now)) return null;
    const r = await get('publishingReleases', releaseId);
    if (!r || r.releaseId !== releaseId || r.campaignId !== 'urai-global-45-plus-45' ||
        r.state !== 'APPROVED' || r.hold !== true || r.revoked !== false || r.revokedAt !== null ||
        !activeUntil(r.releaseExpiresAt, now) || !SHA.test(r.sourceSha || '') ||
        r.sourceSha !== r.currentSourceSha || (expectedSha !== undefined && r.sourceSha !== expectedSha) ||
        r.issuerServiceId !== actor.serviceId || !valid(r.issuerKeyId) || !valid(r.ownerUid) ||
        !valid(r.contentVersionId) || !valid(r.nativeAccountId) || !valid(r.platformAccountId) ||
        !r.candidate || !evaluatePublication(r.candidate).allowed ||
        r.currentRevision !== r.candidate.contentRevision) return null;
    const issuerKey = await get('publishingIssuerKeys', r.issuerKeyId);
    if (!issuerKey || issuerKey.id !== r.issuerKeyId || issuerKey.serviceId !== actor.serviceId ||
        issuerKey.state !== 'ACTIVE' || issuerKey.revokedAt !== null || !activeUntil(issuerKey.expiresAt, now)) return null;
    const version = await get('contentVersions', r.contentVersionId);
    if (!version || version.id !== r.contentVersionId || version.contentId !== r.candidate.contentId ||
        version.ownerUid !== r.ownerUid || version.revision !== r.currentRevision ||
        version.sourceSha !== r.sourceSha || version.state !== 'APPROVED' || version.revokedAt !== null) return null;
    const editorial = await get('publishingReviewers', r.candidate.approvedBy);
    if (!editorial || editorial.active !== true || editorial.revoked !== false ||
        editorial.uid !== r.candidate.approvedBy || !editorial.roles?.includes('editorial')) return null;
    if (!valid(r.mediaRecordId)) return null;
    const media = await get('approvedMediaObjects', r.mediaRecordId);
    if (!media || media.id !== r.mediaRecordId || media.ownerUid !== r.ownerUid ||
        media.contentId !== r.candidate.contentId || media.state !== 'APPROVED' || media.revokedAt !== null ||
        media.sourceSha !== r.sourceSha ||
        !valid(media.assetId) || !valid(media.version) || !valid(media.bucket) || !storageKey(media.storageKey) ||
        !GENERATION.test(String(media.generation || '')) || !HASH.test(media.sha256 || '') ||
        !r.media || media.assetId !== r.media.assetId || media.version !== r.media.version ||
        media.bucket !== r.media.bucket || media.storageKey !== r.media.storageKey ||
        media.generation !== r.media.generation || media.sha256 !== r.media.sha256) return null;
    const match = r.candidate.assets.some((a: { assetId:string; version:string; checksum:string; promotionState:string }) =>
      a.assetId === media.assetId && a.version === media.version && a.checksum === 'sha256:' + media.sha256 &&
      (a.promotionState === 'approved' || a.promotionState === 'published'));
    if (!match) return null;
    const required: Array<[string,unknown,string|undefined]> = [
      ['rights',r.rightsReceiptId,r.rightsVersion], ['claims',r.claimsReceiptId,r.claimsVersion],
      ['accessibility',r.accessibilityReceiptId,undefined], ['locale',r.localeReceiptId,undefined],
      ['owner',r.ownerApprovalReceiptId,undefined], ['technical',r.technicalAcceptanceReceiptId,undefined],
    ];
    if (r.privacyClass === 'consented-subject') {
      if (!valid(r.consentReceiptId) || !valid(r.consentVersion) || !valid(r.consentGrantId)) return null;
      const grant = await get('publishingConsentGrants',r.consentGrantId);
      if (!grant || grant.id !== r.consentGrantId || grant.ownerUid !== r.ownerUid ||
          grant.contentId !== r.candidate.contentId || grant.version !== r.consentVersion ||
          grant.receiptId !== r.consentReceiptId || grant.scope !== 'SOCIAL_PUBLICATION' ||
          grant.state !== 'ACTIVE' || grant.revokedAt !== null || !activeUntil(grant.expiresAt,now)) return null;
      required.push(['consent',r.consentReceiptId,r.consentVersion]);
    } else if (r.privacyClass !== 'public-original' || r.consentReceiptId !== null || r.consentVersion !== null) {
      return null;
    }
    if (!(await Promise.all(required.map(([kind,id,version])=>receipt(kind,id,r,now,version)))).every(Boolean)) return null;
    return {
      releaseId:r.releaseId,campaignId:r.campaignId,candidate:r.candidate,
      ownerId:r.ownerUid,contentVersionId:r.contentVersionId,releaseState:'APPROVED',publicationHold:true,
      issuerServiceId:r.issuerServiceId,issuerKeyId:r.issuerKeyId,
      platform:r.platform,platformAccountId:r.platformAccountId,nativeAccountId:r.nativeAccountId,
      sourceSha:r.sourceSha,destinationUrl:r.destinationUrl,
      media:{assetId:media.assetId,version:media.version,bucket:media.bucket,storageKey:media.storageKey,
        generation:media.generation,sha256:media.sha256},
      privacyClass:r.privacyClass,consentReceiptId:r.consentReceiptId,consentVersion:r.consentVersion,
      rightsReceiptId:r.rightsReceiptId,rightsVersion:r.rightsVersion,claimsReceiptId:r.claimsReceiptId,
      claimsVersion:r.claimsVersion,accessibilityReceiptId:r.accessibilityReceiptId,
      localeReceiptId:r.localeReceiptId,technicalReceiptId:r.technicalAcceptanceReceiptId,
      ownerApprovalReceiptId:r.ownerApprovalReceiptId,
    };
  }
  return {
    async authenticateService(_requestId) {
      const actor = await identify();
      return actor ? {authorized:true,serviceId:actor.serviceId} : null;
    },
    async readApprovedRelease(releaseId) { return resolve(releaseId); },
    async assertCurrent(releaseId,sourceSha) { return (await resolve(releaseId,sourceSha)) !== null; },
  };
}
