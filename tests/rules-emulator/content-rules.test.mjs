import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

const projectId = 'urai-content-rules-test';
let testEnv;

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../../storage.rules', import.meta.url), 'utf8'),
  ]);

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

after(async () => {
  await testEnv.cleanup();
});

async function seedDoc(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function seedObject(path, bytes = new Uint8Array([1]), contentType = 'application/octet-stream') {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), path), bytes, { contentType });
  });
}

function validAnalytics(overrides = {}) {
  return {
    event: 'content_viewed',
    userId: 'alice',
    entityId: 'content-1',
    timestamp: '2026-07-14T00:00:00.000Z',
    metadata: { source: 'rules-emulator' },
    ...overrides,
  };
}

test('public Firestore reads require the exact persisted public schemas', async () => {
  await seedDoc('contentItems/public', { status: 'published', visibility: 'public' });
  await seedDoc('contentItems/draft', { status: 'draft', visibility: 'public' });
  await seedDoc('contentItems/missing', { title: 'missing public fields' });
  await seedDoc('contentPacks/free', { status: 'published', tierVisibility: ['free'] });
  await seedDoc('contentPacks/paid', { status: 'published', tierVisibility: ['paid'] });
  await seedDoc('marketplaceItems/free', { moderationStatus: 'approved', tier: 'free' });
  await seedDoc('marketplaceItems/pending', { moderationStatus: 'pending', tier: 'free' });
  await seedDoc('seoPages/indexable', { status: 'published', noIndex: false });
  await seedDoc('seoPages/no-index', { status: 'published', noIndex: true });
  await seedDoc('seoPages/missing', { status: 'published' });

  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'contentItems/public')));
  await assertFails(getDoc(doc(db, 'contentItems/draft')));
  await assertFails(getDoc(doc(db, 'contentItems/missing')));
  await assertSucceeds(getDoc(doc(db, 'contentPacks/free')));
  await assertFails(getDoc(doc(db, 'contentPacks/paid')));
  await assertSucceeds(getDoc(doc(db, 'marketplaceItems/free')));
  await assertFails(getDoc(doc(db, 'marketplaceItems/pending')));
  await assertSucceeds(getDoc(doc(db, 'seoPages/indexable')));
  await assertFails(getDoc(doc(db, 'seoPages/no-index')));
  await assertFails(getDoc(doc(db, 'seoPages/missing')));
});

test('scalar and list administrator claims work while missing claims deny cleanly', async () => {
  const scalarAdmin = testEnv.authenticatedContext('admin-scalar', { role: 'admin' }).firestore();
  const listAdmin = testEnv.authenticatedContext('admin-list', { roles: ['admin'] }).firestore();
  const internalAdmin = testEnv.authenticatedContext('internal-admin', { roles: ['internalAdmin'] }).firestore();
  const missingClaims = testEnv.authenticatedContext('plain-user').firestore();

  await assertSucceeds(setDoc(doc(scalarAdmin, 'contentItems/scalar-admin'), { status: 'draft' }));
  await assertSucceeds(setDoc(doc(listAdmin, 'contentItems/list-admin'), { status: 'draft' }));
  await assertSucceeds(setDoc(doc(internalAdmin, 'contentItems/internal-admin'), { status: 'draft' }));
  await assertFails(setDoc(doc(missingClaims, 'contentItems/plain-user'), { status: 'draft' }));
});

test('creator submissions are owner-bound and require an accepted creator role shape', async () => {
  const scalarCreator = testEnv.authenticatedContext('alice', { role: 'creator' }).firestore();
  const listCreator = testEnv.authenticatedContext('bob', { roles: ['studio'] }).firestore();
  const plainUser = testEnv.authenticatedContext('mallory').firestore();

  await assertSucceeds(setDoc(doc(scalarCreator, 'creatorSubmissions/a'), { creatorId: 'alice' }));
  await assertSucceeds(setDoc(doc(listCreator, 'creatorSubmissions/b'), { creatorId: 'bob' }));
  await assertFails(setDoc(doc(scalarCreator, 'creatorSubmissions/cross'), { creatorId: 'bob' }));
  await assertFails(setDoc(doc(plainUser, 'creatorSubmissions/plain'), { creatorId: 'mallory' }));
});

test('analytics creation enforces owner, exact keys, event allowlist and bounded fields', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  const validRef = doc(alice, 'analyticsEvents/valid');
  await assertSucceeds(setDoc(validRef, validAnalytics()));

  await assertFails(setDoc(doc(alice, 'analyticsEvents/cross-user'), validAnalytics({ userId: 'bob' })));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/bad-event'), validAnalytics({ event: 'arbitrary_event' })));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/empty-entity'), validAnalytics({ entityId: '' })));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/long-entity'), validAnalytics({ entityId: 'x'.repeat(161) })));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/long-time'), validAnalytics({ timestamp: 'x'.repeat(65) })));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/extra-key'), { ...validAnalytics(), extra: true }));
  await assertFails(setDoc(doc(alice, 'analyticsEvents/large-metadata'), validAnalytics({
    metadata: Object.fromEntries(Array.from({ length: 21 }, (_, index) => [`k${index}`, index])),
  })));
});

test('legacy entitlement alias remains denied while the canonical owner path is readable', async () => {
  await seedDoc('userContentEntitlements/alice-entitlement', { userId: 'alice' });
  await seedDoc('userEntitlements/alice-legacy', { userId: 'alice' });

  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(alice, 'userContentEntitlements/alice-entitlement')));
  await assertFails(getDoc(doc(alice, 'userEntitlements/alice-legacy')));
});

test('Storage public/admin boundaries support both administrator claim shapes', async () => {
  await seedObject('public/existing.txt', new TextEncoder().encode('public'), 'text/plain');

  const publicStorage = testEnv.unauthenticatedContext().storage();
  const scalarAdminStorage = testEnv.authenticatedContext('admin-scalar', { role: 'admin' }).storage();
  const listAdminStorage = testEnv.authenticatedContext('admin-list', { roles: ['admin'] }).storage();
  const missingClaimsStorage = testEnv.authenticatedContext('plain-user').storage();

  const publicBytes = await assertSucceeds(getBytes(ref(publicStorage, 'public/existing.txt')));
  assert.equal(new TextDecoder().decode(publicBytes), 'public');
  await assertSucceeds(uploadBytes(ref(scalarAdminStorage, 'public/scalar.txt'), new Uint8Array([1]), { contentType: 'text/plain' }));
  await assertSucceeds(uploadBytes(ref(listAdminStorage, 'public/list.txt'), new Uint8Array([1]), { contentType: 'text/plain' }));
  await assertFails(uploadBytes(ref(missingClaimsStorage, 'public/plain.txt'), new Uint8Array([1]), { contentType: 'text/plain' }));
});

test('creator Storage uploads enforce owner path, role, nonzero size, size ceiling and MIME allowlist', async () => {
  const scalarCreator = testEnv.authenticatedContext('alice', { role: 'creator' }).storage();
  const listCreator = testEnv.authenticatedContext('bob', { roles: ['studio'] }).storage();
  const plainUser = testEnv.authenticatedContext('mallory').storage();

  await assertSucceeds(uploadBytes(ref(scalarCreator, 'creator-submissions/alice/image.png'), new Uint8Array([1]), { contentType: 'image/png' }));
  await assertSucceeds(uploadBytes(ref(listCreator, 'creator-submissions/bob/photo.jpg'), new Uint8Array([1]), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(scalarCreator, 'creator-submissions/bob/cross.png'), new Uint8Array([1]), { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(plainUser, 'creator-submissions/mallory/plain.png'), new Uint8Array([1]), { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(scalarCreator, 'creator-submissions/alice/empty.png'), new Uint8Array(0), { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(scalarCreator, 'creator-submissions/alice/disallowed.html'), new Uint8Array([1]), { contentType: 'text/html' }));
  await assertFails(uploadBytes(
    ref(scalarCreator, 'creator-submissions/alice/oversized.bin'),
    new Uint8Array(25 * 1024 * 1024 + 1),
    { contentType: 'application/pdf' },
  ));
});

test('creator Storage reads and deletes stay owner-bound', async () => {
  await seedObject('creator-submissions/alice/file.txt', new Uint8Array([1]), 'text/plain');
  const alice = testEnv.authenticatedContext('alice', { role: 'creator' }).storage();
  const bob = testEnv.authenticatedContext('bob', { role: 'creator' }).storage();

  await assertSucceeds(getBytes(ref(alice, 'creator-submissions/alice/file.txt')));
  await assertFails(getBytes(ref(bob, 'creator-submissions/alice/file.txt')));
  await assertFails(deleteObject(ref(bob, 'creator-submissions/alice/file.txt')));
  await assertSucceeds(deleteObject(ref(alice, 'creator-submissions/alice/file.txt')));
});

test('export and license Storage reads are owner/admin only and writes are admin only', async () => {
  await seedObject('exports/alice/export.json', new Uint8Array([1]), 'application/json');
  await seedObject('licenses/alice/license.pdf', new Uint8Array([1]), 'application/pdf');

  const alice = testEnv.authenticatedContext('alice').storage();
  const bob = testEnv.authenticatedContext('bob').storage();
  const admin = testEnv.authenticatedContext('admin', { roles: ['admin'] }).storage();

  await assertSucceeds(getBytes(ref(alice, 'exports/alice/export.json')));
  await assertFails(getBytes(ref(bob, 'exports/alice/export.json')));
  await assertSucceeds(getBytes(ref(alice, 'licenses/alice/license.pdf')));
  await assertFails(getBytes(ref(bob, 'licenses/alice/license.pdf')));
  await assertFails(uploadBytes(ref(alice, 'exports/alice/user-write.json'), new Uint8Array([1]), { contentType: 'application/json' }));
  await assertSucceeds(uploadBytes(ref(admin, 'exports/alice/admin-write.json'), new Uint8Array([1]), { contentType: 'application/json' }));
});
