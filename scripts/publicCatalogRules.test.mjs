// This tests source alignment only, not deployed Rules or emulator behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sources = [
  readFileSync(resolve(root, 'firestore.rules'), 'utf8'),
  readFileSync(resolve(root, 'apps/web/firestore.rules'), 'utf8'),
];
const publicFunction = source => {
  const beginning = source.indexOf('function isPublicContentItem()');
  const ending = source.indexOf('function isPublishedFreeContentPack()', beginning);
  assert.ok(beginning >= 0 && ending > beginning, 'public gate must exist');
  return source.slice(beginning, ending);
};

test('root/web Firestore Rules must be byte identical', () => {
  assert.equal(sources[0], sources[1]);
});

test('anonymous Content items must be guarded by the same explicit index marker', () => {
  for (const source of sources) {
    const gate = publicFunction(source);
    assert.match(gate, /resource\.data\.get\('publicCatalogEligible', false\) == true/);
    assert.match(gate, /resource\.data\.get\('status', ''\) == 'published'/);
    assert.match(gate, /resource\.data\.get\('visibility', ''\) == 'public'/);
    assert.match(gate, /retained_for_restore|deletion/);
    assert.match(source, /match \/contentItems\/\{id\} \{\s*allow read: if isPublicContentItem\(\) \|\| isAdmin\(\);/);
  }
});

test('private and admin direct-client authority remain hard-off', () => {
  for (const source of sources) {
    for (const fn of ['privateClientAuthorized', 'isAdmin', 'isCreator']) {
      const body = source.match(new RegExp('function ' + fn + '\\(\\) \\{([\\s\\S]*?)\\}'))?.[1] || '';
      assert.match(body, /return false;/, fn + ' must remain client-denied');
    }
  }
});

test('a public flag is not enough to certify publication rights or field minimization', () => {
  const gate = publicFunction(sources[0]);
  assert.ok(!gate.includes('publisherSignature'), 'signed publisher authority is not enforced in these Rules');
  // This is a deliberately documented negative assertion: release must
  // remain HOLD until separate publisher/rights and field-projection review.
});
