#!/usr/bin/env node
// ONE URAI R1497: independently pinned, read-only bundle verifier.
// The trust anchor below comes from GitHub's exact source commit, fetched and
// SHA256-checked outside this checkout. This code does NOT grant publication approval.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(appRoot, '../..');
const expected = Object.freeze({
  repository: 'LifeLoggerAI/urai-content',
  sourceCommit: '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d',
  snapshotSha256: 'b5e52dcd4d6785a71757772afa778aa2a1f1183809fb15d163b13a8b7da2d6d1',
  items: 6,
  files: Object.freeze([
    'content/pages/home.json',
    'content/pages/privacy.json',
    'content/demo/weekly-scrolls.json',
    'content/demo/life-map-events.json',
    'content/demo/council-reflections.json',
    'content/sprites/sprite-packs.json',
  ]),
  inputDigests: Object.freeze({
    'content/pages/home.json': '8cd1b847a1dbceb13476b727d33ac0d3b86983112ce68f09759a54e85cf47ce7',
    'content/pages/privacy.json': '432a1d1a9e077333540f074db698811e8a04f158c64936f7ca2f90b16ce0e41b',
    'content/demo/weekly-scrolls.json': 'aede878baabba829fee88cd14e060ba536861d317cb5c03f423cab88eddb9c6b',
    'content/demo/life-map-events.json': '33bc57cc0dd5d413cc496a624a968794c265d0067305314dbf3bee7eb76ddcd4',
    'content/demo/council-reflections.json': '40f45b21a815b1e112f66b691a040ea80584f02b8e877f6777b9be1cee553fb9',
    'content/sprites/sprite-packs.json': '4b5bb093d6408b142f8d6fe1d6a488a546b524d6eecea231d017a4487dfc8375',
  }),
});

const mode = process.argv.includes('--require-canonical') ? 'require-canonical' : 'bundle';
const hash = text => createHash('sha256').update(text).digest('hex');
const report = {
  version: 'R1497', mode, sourceCommit: expected.sourceCommit,
  checks: [], releaseCertified: false, publicationApproved: false,
};
const mark = (id, pass, detail = {}) => report.checks.push({id, pass: Boolean(pass), detail});
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
try {
  const snapshotText = readFileSync(join(appRoot, 'src/lib/generated/canonical-catalog.snapshot.json'), 'utf8');
  const receipt = JSON.parse(readFileSync(join(appRoot, 'src/lib/generated/canonical-catalog.receipt.json'), 'utf8'));
  const snapshot = JSON.parse(snapshotText);
  const actualSha = hash(snapshotText);
  mark('pinned-snapshot-hash', actualSha === expected.snapshotSha256,
    {actual:actualSha, approvedBaseline:expected.snapshotSha256});
  mark('receipt-hash', receipt.sha256 === actualSha);
  mark('receipt-reviewed-source',
    receipt.schemaVersion === 1 &&
    receipt.sourceRepository === expected.repository &&
    receipt.sourceBaseCommit === expected.sourceCommit &&
    same(receipt.sourceFiles, expected.files));
  mark('receipt-pinned-content-digests', same(receipt.inputDigests, expected.inputDigests));
  mark('item-count', Array.isArray(snapshot) && snapshot.length === expected.items && receipt.items === expected.items);

  let structuralValid = Array.isArray(snapshot);
  let home = null;
  if (Array.isArray(snapshot)) {
    const seenId = new Set(), seenRoutes = new Set();
    for (const item of snapshot) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim() ||
          typeof item.slug !== 'string' || !item.slug.trim() ||
          !['public','demo'].includes(item.visibility) ||
          !['live','demo','prototype','planned','archived'].includes(item.status) ||
          (item.assetAvailability === 'unavailable' && item.path !== undefined)) {
        structuralValid = false;
        continue;
      }
      const route = item.slug === '/' ? '/' : '/' + item.slug.replace(/^\/+|\/+$/g, '');
      if (seenId.has(item.id) || seenRoutes.has(route)) structuralValid = false;
      seenId.add(item.id); seenRoutes.add(route);
      if (item.id === 'page-home') home = item;
    }
  }
  mark('public-demo-shape-and-routes', structuralValid);
  mark('home-demo-not-promoted', home?.status === 'demo' && home?.visibility === 'demo');

  const found = expected.files.filter(p => existsSync(join(root, p)));
  const complete = found.length === expected.files.length;
  mark('complete-or-absent-source-tree', found.length === 0 || complete,
    {found:found.length, required:expected.files.length});
  if (complete) {
    const actualFiles = {};
    const canonicalItems = [];
    for (const p of expected.files) {
      const source = readFileSync(join(root, p), 'utf8');
      actualFiles[p] = hash(source);
      const x = JSON.parse(source);
      for (const item of (Array.isArray(x) ? x : [x])) {
        if (item?.visibility === 'public' || item?.visibility === 'demo') canonicalItems.push(item);
      }
    }
    mark('source-files-match-reviewed-hashes', same(actualFiles, expected.inputDigests));
    mark('source-items-equal-snapshot', same(canonicalItems, snapshot));
    mark('source-files-match-receipt', same(actualFiles, receipt.inputDigests));
    report.sourceMatched = same(actualFiles, expected.inputDigests) && same(canonicalItems, snapshot);
  } else {
    report.sourceMatched = false;
    if (mode === 'require-canonical') mark('require-canonical-source', false);
    else report.note = 'Bundle verified against pinned reviewed source digest, but canonical files are not present and runtime/visual quality is untested.';
  }
} catch (e) {
  mark('read-or-parse', false, {error:String(e.message).slice(0,220)});
}
report.ok = report.checks.every(x => x.pass);
console.log(JSON.stringify(report,null,2));
if (!report.ok) process.exitCode = 1;
