import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPublicCatalogEligible,
  isExplicitlyIndexedPublicRecord
} from '../src/query/publicCatalogEligibility.ts';

const published = { status: 'published', visibility: 'public' };

test('status fields are not a publication grant', () => {
  assert.equal(isPublicCatalogEligible(published), true);
  assert.equal(isExplicitlyIndexedPublicRecord(published), false);
  assert.equal(isExplicitlyIndexedPublicRecord({ ...published, publicCatalogEligible: false }), false);
});

test('explicit true marker must agree with published and public state', () => {
  assert.equal(isExplicitlyIndexedPublicRecord({ ...published, publicCatalogEligible: true }), true);
  for (const row of [
    { status: 'draft', visibility: 'public' },
    { status: 'approved', visibility: 'public' },
    { status: 'published', visibility: 'private' },
    { status: 'published', visibility: 'unlisted' },
    { status: 'archived', visibility: 'public' }
  ]) {
    assert.equal(isExplicitlyIndexedPublicRecord({ ...row, publicCatalogEligible: true }), false);
  }
});

test('retained deletion always makes a record ineligible', () => {
  assert.equal(isExplicitlyIndexedPublicRecord({
    ...published, publicCatalogEligible: true, deletion: { state: 'retained_for_restore' }
  }), false);
});

test('no marker remains ineligible even after restore', () => {
  assert.equal(isExplicitlyIndexedPublicRecord({
    ...published, publicCatalogEligible: false, deletion: { state: 'restored' }
  }), false);
});

test('restored marker alone is not a fresh signed grant', () => {
  // This pure predicate cannot verify provenance/rights/signature.
  // Repo restore explicitly clears the marker; never use this predicate
  // directly as an authorization issuer.
  assert.equal(isExplicitlyIndexedPublicRecord({
    ...published, publicCatalogEligible: true, deletion: { state: 'restored' }
  }), true);
});

test('unexpected object shapes do not authorize public content', () => {
  for (const value of [null, false, 0, 'true', { approved: true }]) {
    assert.equal(isExplicitlyIndexedPublicRecord({ ...published, publicCatalogEligible: value }), false);
  }
});
