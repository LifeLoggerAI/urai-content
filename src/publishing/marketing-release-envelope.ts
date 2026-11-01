/**
 * Content-side issuer for the URAI Marketing nonproduction release handoff.
 * Signing is server-only and must run after a privileged authenticated database
 * authority resolves an immutable approved release. Never call this from a
 * browser or pass signing keys/record snapshots from request JSON.
 */
import { createPrivateKey, sign } from 'node:crypto';
import { evaluatePublication, type PublicationCandidate } from './release.js';

const DOMAIN = 'URAI_CONTENT_MARKETING_RELEASE_V1\n';
const HASH = /^[a-f0-9]{64}$/i;
const SHA = /^[a-f0-9]{40}$/i;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KEY = /^[A-Za-z0-9_-]{1,80}$/;
const valid = (s: unknown): s is string => typeof s === 'string' && ID.test(s);

export type ReleasePlatform = 'Instagram'|'TikTok'|'YouTube'|'Facebook'|'LinkedIn'|'X'|'Threads'|'Bluesky'|'Pinterest';
export type AuthorizedContentRelease = {
  releaseId: string;
  candidate: PublicationCandidate;
  campaignId: 'urai-global-45-plus-45';
  platform: ReleasePlatform;
  platformAccountId: string;
  sourceSha: string;
  destinationUrl: string;
  media: { assetId: string; version: string; sha256: string; storageKey: string };
  privacyClass: 'public-original'|'consented-subject';
  consentReceiptId: string|null;
  rightsReceiptId: string;
  claimsReceiptId: string;
  accessibilityReceiptId: string;
  localeReceiptId: string;
  ownerApprovalReceiptId: string;
};

/** The caller of this object MUST implement credential-backed authorization and
 * retrieve approvals directly from the trusted DB / provider, never from input.
 */
export type ReleaseAuthority = {
  authenticateService(requestId: string): Promise<{ authorized: true; serviceId: string } | null>;
  readApprovedRelease(releaseId: string): Promise<AuthorizedContentRelease|null>;
  assertCurrent(releaseId: string, sourceSha: string): Promise<boolean>;
};

export type MarketingReleasePayload = {
  schema: 'urai-content-marketing-release-v1'; issuer: 'urai-content';
  releaseId: string; campaignId: 'urai-global-45-plus-45'; contentId: string;
  revision: number; contentStatus: 'approved'; platform: ReleasePlatform; platformAccountId: string;
  locale: string; sourceSha: string; destinationUrl: string; provenanceId: string;
  approvedBy: string; rightsReceiptId: string; claimsReceiptId: string;
  accessibilityReceiptId: string; localeReceiptId: string; ownerApprovalReceiptId: string;
  privacyClass: 'public-original'|'consented-subject'; consentReceiptId: string|null;
  media: { assetId: string; version: string; sha256: string; storageKey: string };
  issuedAt: string; expiresAt: string;
};

export async function issueSignedMarketingRelease({
  releaseId, requestId, authority, signingKeyPem, keyId, now = () => Date.now(),
}: {
  releaseId: string; requestId: string; authority: ReleaseAuthority;
  signingKeyPem: string; keyId: string; now?: () => number;
}): Promise<{ keyId: string; payload: MarketingReleasePayload; signature: string }> {
  if (!valid(releaseId) || !valid(requestId) || !KEY.test(keyId) || !signingKeyPem) {
    throw new Error('issuer configuration or release ID missing');
  }
  if (!authority || typeof authority.authenticateService !== 'function' ||
      typeof authority.readApprovedRelease !== 'function' || typeof authority.assertCurrent !== 'function') {
    throw new Error('trusted content release authority is unavailable');
  }
  const actor = await authority.authenticateService(requestId);
  if (actor?.authorized !== true || !valid(actor.serviceId)) throw new Error('issuer requester is not authenticated');
  const entry = await authority.readApprovedRelease(releaseId);
  if (!entry || entry.releaseId !== releaseId || entry.campaignId !== 'urai-global-45-plus-45') {
    throw new Error('release missing or outside canonical campaign');
  }
  const c = entry.candidate;
  if (!evaluatePublication(c).allowed) throw new Error('Content publication gate denied release');
  if (!SHA.test(entry.sourceSha) || !valid(entry.platformAccountId) ||
      !entry.destinationUrl.startsWith('https://urai.app/') && entry.destinationUrl !== 'https://urai.app') {
    throw new Error('source/account/destination authority invalid');
  }
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(c.locale)) throw new Error('locale identity invalid');
  if (!entry.media || !valid(entry.media.assetId) || !valid(entry.media.version) ||
      !valid(entry.media.storageKey) || !HASH.test(entry.media.sha256||'')) throw new Error('media authorization missing');
  const matched = c.assets.some(a => a.assetId === entry.media.assetId && a.version === entry.media.version &&
    a.checksum.toLowerCase() === 'sha256:' + entry.media.sha256.toLowerCase() &&
    (a.promotionState === 'approved' || a.promotionState === 'published'));
  if (!matched) throw new Error('media not included in Content-approved asset revision');
  for (const name of ['rightsReceiptId','claimsReceiptId','accessibilityReceiptId','localeReceiptId','ownerApprovalReceiptId'] as const) {
    if (!valid(entry[name])) throw new Error('missing approval authority: ' + name);
  }
  if (!['public-original','consented-subject'].includes(entry.privacyClass)) throw new Error('privacy class unsupported');
  if (entry.privacyClass === 'consented-subject' && !valid(entry.consentReceiptId)) throw new Error('subject consent missing');
  if (entry.privacyClass === 'public-original' && entry.consentReceiptId !== null) throw new Error('unexpected consent field');
  if ((await authority.assertCurrent(releaseId,entry.sourceSha)) !== true) throw new Error('release revoked or out of date');
  const instant = now();
  if (!Number.isFinite(instant) || instant < Date.parse(c.approvedAt!)) throw new Error('release time invalid');
  const payload: MarketingReleasePayload = {
    schema:'urai-content-marketing-release-v1',issuer:'urai-content',releaseId,campaignId:entry.campaignId,
    contentId:c.contentId,revision:c.contentRevision,contentStatus:'approved',platform:entry.platform,
    platformAccountId:entry.platformAccountId,locale:c.locale,sourceSha:entry.sourceSha,
    destinationUrl:entry.destinationUrl,provenanceId:c.provenanceRecordId,
    approvedBy:c.approvedBy!,rightsReceiptId:entry.rightsReceiptId,claimsReceiptId:entry.claimsReceiptId,
    accessibilityReceiptId:entry.accessibilityReceiptId,localeReceiptId:entry.localeReceiptId,
    ownerApprovalReceiptId:entry.ownerApprovalReceiptId,privacyClass:entry.privacyClass,
    consentReceiptId:entry.consentReceiptId,media:entry.media,
    issuedAt:new Date(instant).toISOString(),expiresAt:new Date(instant+300_000).toISOString(),
  };
  const key = createPrivateKey(signingKeyPem);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('release issuer requires Ed25519 private key');
  const signature = sign(null,Buffer.from(DOMAIN + JSON.stringify(payload),'utf8'),key).toString('base64url');
  return {keyId,payload,signature};
}
