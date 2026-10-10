import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Actual production handler/session/canonical consumer/collector/schema bytes.
// SDK reads and canonical replies are labeled isolated fixtures, never native delivery.
function sourceModule(relative, replacements = []) {
  let source = readFileSync(new URL(relative, import.meta.url), 'utf8').replace("import 'server-only';", '');
  for (const [from, to] of replacements) {
    assert(source.includes(from), 'fixture must bind actual source import: ' + from);
    source = source.replace(from, to);
  }
  return 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64');
}
const schemasUrl = sourceModule('../../../src/schemas/content.ts', [["from 'zod'", `from '${pathToFileURL(createRequire(import.meta.url).resolve('zod')).href}'`]]);
const consumerUrl = sourceModule('../src/server/privacy/canonicalConsent.ts');
const rolesUrl = sourceModule('../src/server/auth/roles.ts');
const rbacUrl = sourceModule('../src/server/auth/rbac.ts', [
  ["import type { AuthPermission, AuthRole, AuthSession, AuthorizationResult } from './roles';", ''],
  ["from './roles'", `from '${rolesUrl}'`]
]);
const fixture = { uid: 'fixture-owner', role: 'creator', currentUid: 'fixture-owner', currentRole: 'creator', configured: true,
  revoked: false, disabled: false, allowed: true, reads: [], canonical: [], rows: {}, onRead: null, verify: null };
globalThis.__uraiContentExportFixture = fixture;
const sessionUrl = sourceModule('../src/server/auth/session.ts', [
  ["import type { AuthRole, AuthSession } from './roles';", ''],
  ["from './roles'", `from '${rolesUrl}'`],
  ["import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';", `
const fixture = globalThis.__uraiContentExportFixture;
const isFirebaseAdminConfigured = () => fixture.configured;
const getFirebaseAdminAuth = () => ({
  verifyIdToken: async (_token, checkRevoked) => {
    if (fixture.verify) await fixture.verify();
    if (!checkRevoked || fixture.revoked) throw new Error('fixture-revoked');
    return { uid: fixture.uid, role: fixture.role, entitlements: [] };
  },
  getUser: async () => ({ uid: fixture.currentUid, disabled: fixture.disabled, customClaims: { role: fixture.currentRole } })
});`],
  ["from '../privacy/canonicalConsent'", `from '${consumerUrl}'`]
]);
const exportUrl = sourceModule('../src/server/privacy/contentExport.ts', [["from '../content/schemas'", `from '${schemasUrl}'`]]);
const exporter = await import(exportUrl);
const handlerUrl = sourceModule('../src/app/api/privacy/export/route.ts', [
  ["import { FieldPath } from 'firebase-admin/firestore';", 'const FieldPath = { documentId: () => "fixture-document-id" };'],
  ["import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';", `
const fixture = globalThis.__uraiContentExportFixture;
const isFirebaseAdminConfigured = () => fixture.configured;
const getFirebaseAdminDb = () => ({ collection: (collection) => fixture.query(collection) });`],
  ["from '@/server/auth/session'", `from '${sessionUrl}'`],
  ["from '@/server/auth/rbac'", `from '${rbacUrl}'`],
  ["from '@/server/privacy/contentExport'", `from '${exportUrl}'`]
]);
const { GET } = await import(handlerUrl);
const stamp = '2026-10-09T00:00:00.000Z';
const item = (id = 'owned', createdBy = 'fixture-owner') => ({ id, createdBy, slug: id, title: 'Recorded title', body: 'Raw source text unchanged.',
  tags: ['rights-preserved'], locale: 'en-US', status: 'draft', visibility: 'private', updatedAt: stamp, createdAt: stamp,
  sourceLabel: 'synthetic-source-with-rights', whyShownCopy: 'Owned record', safetyNotes: ['not accepted family material'], contentType: 'story', schemaVersion: 2 });
const row = (id, data) => ({ id, data });
const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(['NODE_ENV', 'URAI_CONTENT_PRIVACY_PROJECT_ID', 'URAI_CONTENT_PRIVACY_REGION'].map(k => [k, process.env[k]]));
const request = (signal, search = '') => new Request('https://fixture.invalid/api/privacy/export' + search,
  { signal, headers: { authorization: 'Bearer synthetic-token' } });
const compare = (a,b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const fields = { contentItems: 'createdBy', creatorSubmissions: 'creatorId', marketplaceItems: 'creatorId',
  userContentEntitlements: 'userId', telemetryEvents: 'userId', contentVersions: 'contentId' };
fixture.query = (collection) => {
  assert(collection in fields, 'no pending/internal collection read');
  let field, value, cursor = null, limit;
  const query = {
    where(f, op, v) { assert.equal(f, fields[collection]); assert.equal(op, '=='); field=f; value=v; return query; },
    orderBy(f) { assert.equal(f, 'fixture-document-id'); return query; },
    startAfter(v) { cursor=v; return query; },
    limit(v) { assert.equal(v, 100); limit=v; return query; },
    async get() {
      fixture.reads.push({ collection, field, value, cursor, limit });
      if (fixture.onRead) await fixture.onRead(collection);
      const rows = (fixture.rows[collection] ?? []).filter(r => r.data[field] === value && (!cursor || compare(r.id,cursor)>0)).sort((a,b)=>compare(a.id,b.id)).slice(0,limit);
      return { docs: rows.map(r => ({ id:r.id, data:()=>r.data })) };
    }
  }; return query;
};
beforeEach(() => {
  Object.assign(fixture, { uid: 'fixture-owner', role:'creator', currentUid:'fixture-owner', currentRole:'creator', configured:true,
    revoked:false, disabled:false, allowed:true, reads:[], canonical:[], rows:{}, onRead:null, verify:null });
  process.env.NODE_ENV='production'; process.env.URAI_CONTENT_PRIVACY_PROJECT_ID='synthetic-private-project'; process.env.URAI_CONTENT_PRIVACY_REGION='us-central1';
  globalThis.fetch = async (_url, init) => {
    const data = JSON.parse(init.body).data; fixture.canonical.push(data);
    assert.equal(data.purpose,'data.export'); // memory.storage may be withdrawn independently.
    return new Response(JSON.stringify({ result: { ...data, allowed:fixture.allowed, reason:fixture.allowed?'ALLOWED':'REVOKED',
      requiredTier:'C7', policyVersion:'1.0.0', evaluatedAt:new Date().toISOString(), decisionEventId:'synthetic-current-decision' } }));
  };
});
afterEach(() => { globalThis.fetch=originalFetch; for (const [k,v] of Object.entries(originalEnv)) { if(v===undefined) delete process.env[k]; else process.env[k]=v; } });

async function collect(patch = {}) {
  return exporter.collectContentSubjectExport({ uid:'fixture-owner', requestId:'fixture-request', signal:new AbortController().signal,
    requireCurrent:async()=>{}, store:{readPage:async()=>[]}, ...patch });
}
const rejectsCode = (promise, code) => assert.rejects(promise, failure => failure instanceof exporter.ContentExportError && failure.code === code);

test('actual GET returns deterministic owned facts/rights with partial coverage, no internal review identity or other account', async () => {
  fixture.rows = {
    contentItems:[row('other',item('other','different-owner')),row('owned',item())],
    contentVersions:[row('owned-v1',{contentId:'owned',version:1,snapshot:item()})],
    creatorSubmissions:[row('submission',{id:'submission',creatorId:fixture.uid,title:'Source',body:'Original dialogue remains unknown.',status:'submitted',submittedAt:stamp,updatedAt:stamp,
      moderationNotes:'internal deliberation',moderatedBy:'other-reviewer',migrationSource:'operator-only'})],
    marketplaceItems:[row('market',{id:'market',creatorId:fixture.uid,title:'Rights',moderationStatus:'pending',tier:'free',priceUsd:0,entitlementKey:'owned-key'})],
    userContentEntitlements:[row('ent',{userId:fixture.uid,entitlementKey:'owned-key',grantedBy:'admin',grantedAt:stamp,expiresAt:null})],
    telemetryEvents:[row('event',{event:'content_viewed',userId:fixture.uid,entityId:'owned',timestamp:stamp,metadata:{locale:'en-US'}})]
  };
  const response=await GET(request()); assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'private, no-store');
  const data=await response.json(); assert.equal(data.manifest.complete,false); assert.equal(data.manifest.recordCount,6);
  assert.equal(data.payload.collections.contentItems[0].record.body,item().body); assert.deepEqual(data.payload.collections.contentItems[0].record.safetyNotes,item().safetyNotes);
  assert.equal(data.payload.coverage.pendingCollections.length,6); assert.equal(data.manifest.providerDeliveryVerified,false);
  assert.equal(data.manifest.payloadSha256,createHash('sha256').update(exporter.serializeContentExport(data.payload)).digest('hex'));
  assert(!JSON.stringify(data).includes('other-reviewer')); assert(!JSON.stringify(data).includes('internal deliberation')); assert(!JSON.stringify(data).includes('different-owner'));
  const again=await (await GET(request())).json(); assert.equal(again.manifest.payloadSha256,data.manifest.payloadSha256);
  assert(fixture.canonical.length>10); assert(fixture.reads.every(q=>q.collection==='contentVersions'?q.value==='owned':q.value===fixture.uid));
});
test('empty authorized journey succeeds with explicit incomplete scope', async()=>{ const response=await GET(request()); assert.equal(response.status,200); assert.equal((await response.json()).manifest.recordCount,0); });
for(const kind of ['withdrawal','tombstone','revoked token','disabled account','unbound canonical']) test(kind+' rejects before source reads',async()=>{
  if(kind==='withdrawal') fixture.allowed=false;
  if(kind==='tombstone') globalThis.fetch=async()=>new Response(JSON.stringify({error:{status:'FAILED_PRECONDITION',message:'synthetic active deletion tombstone'}}),{status:400});
  if(kind==='revoked token')fixture.revoked=true;
  if(kind==='disabled account')fixture.disabled=true;
  if(kind==='unbound canonical')delete process.env.URAI_CONTENT_PRIVACY_PROJECT_ID;
  assert.equal((await GET(request())).status,401); assert.equal(fixture.reads.length,0);
});
for(const kind of ['cross-account','role change','withdrawal','revocation']) test(kind+' during awaited source read rejects the entire data response',async()=>{
  fixture.rows.contentItems=[row('owned',item())]; fixture.onRead=async()=>{
    if(kind==='cross-account')fixture.currentUid='different-owner'; if(kind==='role change')fixture.currentRole='user';
    if(kind==='withdrawal')fixture.allowed=false; if(kind==='revocation')fixture.revoked=true;
  };
  const response=await GET(request()); assert.equal(response.status,401); assert(!await response.text().then(s=>s.includes('Raw source'))); assert.equal(fixture.reads.length,1);
});
test('caller cannot choose target, collection or scopes',async()=>{ for(const query of ['?uid=other','?collection=moderationQueue','?scope=all'])assert.equal((await GET(request(undefined,query))).status,400); assert.equal(fixture.canonical.length,0); });
test('store errors return usable generic recovery without source details',async()=>{fixture.onRead=async()=>{throw Error('sensitive-provider-detail');};const response=await GET(request()); assert.equal(response.status,503);assert(!await response.text().then(s=>s.includes('sensitive-provider-detail')));});
test('cancellation of stalled initial Auth returns promptly without canonical dispatch or source read',async()=>{
  fixture.verify=()=>new Promise(()=>{});const controller=new AbortController();const pending=GET(request(controller.signal));setTimeout(()=>controller.abort(),5);
  assert.equal((await pending).status,499);assert.equal(fixture.canonical.length,0);assert.equal(fixture.reads.length,0);
});
test('cancellation of stalled collector authority does not dispatch a read',async()=>{
  const controller=new AbortController();let calls=0;const pending=collect({signal:controller.signal,requireCurrent:()=>new Promise(()=>{}),store:{readPage:async()=>{calls++;return[];}}});
  setTimeout(()=>controller.abort(),5);await rejectsCode(pending,'export_cancelled');assert.equal(calls,0);
});
test('stalled collector authority reaches shared deadline without a read',async()=>{
  let tick=0,calls=0;const pending=collect({now:()=>tick++===0?0:19_995,requireCurrent:()=>new Promise(()=>{}),store:{readPage:async()=>{calls++;return[];}}});
  await rejectsCode(pending,'export_limit');assert.equal(calls,0);
});
test('cancellation while SDK read awaits returns no later queries or artifact',async()=>{
  const controller=new AbortController();fixture.onRead=()=>new Promise(()=>{});const pending=GET(request(controller.signal));setTimeout(()=>controller.abort(),5);
  assert.equal((await pending).status,499);assert.equal(fixture.reads.length,1);
});
test('already cancelled request dispatches nothing',async()=>{const controller=new AbortController();controller.abort();assert.equal((await GET(request(controller.signal))).status,499);assert.equal(fixture.canonical.length,0);});
for(const kind of ['foreign row','schema invalid','identity mismatch','page overflow','out-of-order cursor','foreign revision'])test(kind+' fails closed, never a partial artifact',async()=>{
  let rows=[row('owned',item())];
  if(kind==='foreign row')rows=[row('owned',item('owned','other'))];
  if(kind==='schema invalid')rows=[row('owned',{createdBy:'fixture-owner'})];
  if(kind==='identity mismatch')rows=[row('wrong',item())];
  if(kind==='page overflow')rows=Array.from({length:101},(_,i)=>row(String(i),item(String(i))));
  if(kind==='out-of-order cursor')rows=[row('z',item('z')),row('a',item('a'))];
  const store={readPage:async page=>page.collection==='contentItems'?rows:page.collection==='contentVersions'&&kind==='foreign revision'?[row('owned-v1',{contentId:'owned',version:1,snapshot:item('owned','other')})]:[]};
  await rejectsCode(collect({store}),'export_source_invalid');
});
test('paginated UTF-8 IDs preserve deterministic ordering and collect owned revision links',async()=>{
  const all=Array.from({length:101},(_,i)=>row('id-'+String(i).padStart(3,'0'),item('id-'+String(i).padStart(3,'0'))));
  let pages=0;const store={readPage:async p=>{pages++; if(p.collection!=='contentItems')return [];return all.filter(r=>!p.afterId||compare(r.id,p.afterId)>0).slice(0,p.limit);}};
  // 101 owned items require 101 revision queries: total bounded query count rejects,
  // rather than silently claiming their version history complete.
  await rejectsCode(collect({store}),'export_limit');assert.equal(pages,100);
});
test('record cap hard-fails rather than silently truncating',async()=>{
  const store={readPage:async p=>{
    if(p.collection!=='telemetryEvents')return[];
    const start=p.afterId?Number(p.afterId)+1:0;
    return Array.from({length:Math.min(100,1001-start)},(_,i)=>row(String(start+i).padStart(4,'0'),{event:'content_viewed',userId:'fixture-owner',entityId:'owned',timestamp:stamp,metadata:{}}));
  }}; await rejectsCode(collect({store}),'export_limit');
});
test('byte cap returns truthful limit recovery, no successful truncated body',async()=>{
  fixture.rows.contentItems=[row('owned',{...item(),body:'x'.repeat(2*1024*1024)})];
  const response=await GET(request());assert.equal(response.status,413);const failure=await response.json();assert.equal(failure.complete,false);assert.equal(failure.recovery.automaticRetry,false);assert.match(failure.recovery.action,/privacy request operator/);
});
test('shared operation deadline also covers initial admission and rejects future dispatch',async()=>{
  let tick=0;const operation=exporter.createContentExportOperation(new AbortController().signal,()=>tick++===0?0:19_995);
  await rejectsCode(operation.wait(()=>new Promise(()=>{})),'export_limit');let called=false;await rejectsCode(operation.wait(async()=>{called=true;}),'export_limit');assert.equal(called,false);operation.dispose();
});
test('successful pagination preserves all 101 directly owned rows without truncation',async()=>{
  fixture.rows.telemetryEvents=Array.from({length:101},(_,i)=>row('event-'+String(i).padStart(3,'0'),{event:'content_viewed',userId:fixture.uid,entityId:'owned',timestamp:stamp,metadata:{}}));
  const response=await GET(request());assert.equal(response.status,200);const data=await response.json();assert.equal(data.payload.collections.telemetryEvents.length,101);
  assert.equal(fixture.reads.filter(q=>q.collection==='telemetryEvents').length,2);assert.equal(data.payload.collections.telemetryEvents[100].id,'event-100');
});
test('cancelled initial Auth settling later cannot dispatch canonical processing or source reads',async()=>{
  let resolve;fixture.verify=()=>new Promise(r=>{resolve=r;});const controller=new AbortController();const pending=GET(request(controller.signal));controller.abort();assert.equal((await pending).status,499);
  resolve();await new Promise(r=>setTimeout(r,0));assert.equal(fixture.canonical.length,0);assert.equal(fixture.reads.length,0);
});
test('export registered purpose selects C7 independently of memory storage',async()=>{
  const { contentRequestConsentPurpose }=await import(consumerUrl);assert.equal(contentRequestConsentPurpose(request()),'data.export');
  assert.equal(contentRequestConsentPurpose(new Request('https://fixture.invalid/api/creator/submissions')),'memory.storage');
});
