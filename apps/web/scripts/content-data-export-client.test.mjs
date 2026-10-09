import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function sourceModule(relative, replacements = []) {
  let source = readFileSync(new URL(relative, import.meta.url), 'utf8').replace("import 'server-only';", '');
  for (const [from,to] of replacements) { assert(source.includes(from)); source=source.replace(from,to); }
  return 'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64');
}
const schemasUrl=sourceModule('../../../src/schemas/content.ts',[["from 'zod'",`from '${pathToFileURL(createRequire(import.meta.url).resolve('zod')).href}'`]]);
const exporterUrl=sourceModule('../src/server/privacy/contentExport.ts',[["from '../content/schemas'",`from '${schemasUrl}'`]]);
const clientUrl=sourceModule('../src/lib/contentDataExport.ts',[["from '../../../../src/schemas/content'",`from '${schemasUrl}'`]]);
const { collectContentSubjectExport,serializeContentExport }=await import(exporterUrl);
const { ContentDataExportController,ContentExportAccountObserver,saveContentExport,restoreContentExportFocus }=await import(clientUrl);
// Full production collector generates this isolated fixture contract; no actual provider/delivery is represented.
async function fixtureBody(uid='fixture-owner') {
  return (await collectContentSubjectExport({uid,requestId:'synthetic-request',signal:new AbortController().signal,requireCurrent:async()=>{},store:{readPage:async()=>[]}})).body;
}
const response=(body,status=200)=>new Response(body,{status,headers:{'content-type':'application/json','x-urai-export-scope':'partial-content-records'}});
const actor=(patch={})=>({uid:'fixture-owner',isCurrent:()=>true,getToken:async()=>'synthetic-token',...patch});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
async function ready(request) {
  const saved=[]; const controller=new ContentDataExportController(request??(async()=>response(await fixtureBody())),blob=>saved.push(blob));
  controller.setActor(actor());controller.setConfirmed(true);return {controller,saved};
}

test('actual source controller consumes the actual collector contract and requests a partial private download',async()=>{
  let calls=0;const {controller,saved}=await ready(async(path,init)=>{
    calls++;assert.equal(path,'/api/privacy/export');assert.equal(init.method,'GET');assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.headers.authorization,'Bearer synthetic-token');
    return response(await fixtureBody());
  });assert.equal(await controller.download(),true);assert.equal(calls,1);assert.equal(saved.length,1);assert.equal(saved[0].type,'application/json');
  const data=JSON.parse(await saved[0].text());assert.equal(data.manifest.complete,false);assert.equal(data.payload.coverage.pendingCollections.length,6);
  assert.equal(controller.snapshot().confirmed,false);assert.match(controller.snapshot().message,/browser saving is not confirmed/);
  assert.equal(await controller.download(),false);assert.equal(calls,1);
});
test('no sign-in or scope confirmation means no request',async()=>{let calls=0;const controller=new ContentDataExportController(async()=>{calls++;throw Error();},()=>{});await controller.download();controller.setActor(actor());await controller.download();assert.equal(calls,0);});
for(const status of [401,403,413,503])test('denial/limit/unavailability '+status+' creates no file and manual recovery',async()=>{
  let calls=0;const {controller,saved}=await ready(async()=>{calls++;return response('{}',status);});assert.equal(await controller.download(),false);assert.equal(saved.length,0);assert.equal(calls,1);assert.equal(controller.snapshot().confirmed,false);
  if(status===413)assert.match(controller.snapshot().message,/privacy support/);else assert.match(controller.snapshot().message,/could not/);
  await controller.download();assert.equal(calls,1);
});
test('user can explicitly confirm and retry after a recoverable failure',async()=>{
  let calls=0;const {controller,saved}=await ready(async()=>++calls===1?response('{}',503):response(await fixtureBody()));assert.equal(await controller.download(),false);
  controller.setConfirmed(true);assert.equal(await controller.download(),true);assert.equal(saved.length,1);assert.equal(calls,2);
});
for(const stage of ['token','fetch','body'])test('account replacement during '+stage+' drops late bytes and preserves new actor state',async()=>{
  const gate=deferred();let calls=0;
  const body=await fixtureBody();
  const {controller,saved}=await ready(async()=>{calls++;return stage==='fetch'?gate.promise:stage==='body'?response(new ReadableStream({start(c){gate.promise.then(()=>{c.enqueue(new TextEncoder().encode(body));c.close();});}})):response(body);});
  if(stage==='token')controller.setActor(actor({getToken:()=>gate.promise}));controller.setConfirmed(true);
  const pending=controller.download();await new Promise(r=>setTimeout(r,0));controller.setActor(actor({uid:'other-account'}));
  gate.resolve(stage==='token'?'late-token':stage==='fetch'?response(body):undefined);assert.equal(await pending,false);assert.equal(saved.length,0);assert.equal(controller.snapshot().phase,'ready');assert.equal(controller.snapshot().confirmed,false);
  if(stage==='token')assert.equal(calls,0);
});
test('stalled token cancellation settles promptly without a request',async()=>{
  let calls=0;const {controller,saved}=await ready(async()=>{calls++;throw Error();});controller.setActor(actor({getToken:()=>new Promise(()=>{})}));controller.setConfirmed(true);
  const pending=controller.download();controller.cancel();assert.equal(await pending,false);assert.equal(calls,0);assert.equal(saved.length,0);assert.equal(controller.snapshot().phase,'cancelled');
});
test('shared thirty-second bound includes a stalled initial token',async(context)=>{
  context.mock.timers.enable({apis:['setTimeout']});let calls=0;const {controller,saved}=await ready(async()=>{calls++;throw Error();});controller.setActor(actor({getToken:()=>new Promise(()=>{})}));controller.setConfirmed(true);
  const pending=controller.download();context.mock.timers.tick(30_000);assert.equal(await pending,false);assert.equal(calls,0);assert.equal(saved.length,0);assert.match(controller.snapshot().message,/time limit/);context.mock.timers.reset();
});
test('scope withdrawal during stalled fetch aborts and returns no file',async()=>{
  let signal;const {controller,saved}=await ready(async(_p,init)=>{signal=init.signal;return new Promise(()=>{});});const pending=controller.download();await new Promise(r=>setTimeout(r,0));controller.setConfirmed(false);
  assert.equal(await pending,false);assert.equal(signal.aborted,true);assert.equal(saved.length,0);
});
test('duplicate click cannot start duplicate requests',async()=>{
  const gate=deferred();let calls=0;const {controller,saved}=await ready(async()=>{calls++;return gate.promise;});const pending=controller.download();assert.equal(await controller.download(),false);
  gate.resolve(response(await fixtureBody()));assert.equal(await pending,true);assert.equal(calls,1);assert.equal(saved.length,1);
});
for(const change of ['foreign subject','claimed complete','wrong count','wrong hash','missing pending scopes','unmapped collection','reviewer identity','foreign record','foreign revision'])test('rejects malformed/foreign response: '+change,async()=>{
  const data=JSON.parse(await fixtureBody());
  if(change==='foreign subject')data.payload.subjectUid='other';
  if(change==='claimed complete')data.manifest.complete=true;
  if(change==='wrong count')data.manifest.recordCount=1;
  if(change==='wrong hash')data.manifest.payloadSha256='0'.repeat(64);
  if(change==='missing pending scopes')data.payload.coverage.pendingCollections=[];
  if(change==='unmapped collection')data.payload.collections.moderationQueue=[];
  if(change==='reviewer identity'||change==='foreign record') {
    data.payload.collections.creatorSubmissions=[{id:'owned',record:{id:'owned',creatorId:change==='foreign record'?'other':'fixture-owner',title:'Synthetic',body:'Fixture',status:'submitted',submittedAt:'2026-10-09T00:00:00.000Z',updatedAt:'2026-10-09T00:00:00.000Z',...(change==='reviewer identity'?{moderatedBy:'other-reviewer'}:{})}}];data.manifest.collectionCounts.creatorSubmissions=1;data.manifest.recordCount=1;
  }
  if(change==='foreign revision') {data.payload.collections.contentVersions=[{id:'foreign-v1',record:{contentId:'foreign',version:1,snapshot:{}}}];data.manifest.collectionCounts.contentVersions=1;data.manifest.recordCount=1;}
  const {controller,saved}=await ready(async()=>response(serializeContentExport(data)));assert.equal(await controller.download(),false);assert.equal(saved.length,0);
});
test('response bytes above cap never become a truncated saved file',async()=>{const {controller,saved}=await ready(async()=>response(' '.repeat(2*1024*1024+1)));assert.equal(await controller.download(),false);assert.equal(saved.length,0);assert.match(controller.snapshot().message,/size or time limit/);});
test('silent SDK account change is checked after awaited token before source dispatch',async()=>{let current=true,calls=0;const {controller,saved}=await ready(async()=>{calls++;throw Error();});controller.setActor(actor({isCurrent:()=>current,getToken:async()=>{current=false;return 'late-token';}}));controller.setConfirmed(true);assert.equal(await controller.download(),false);assert.equal(saved.length,0);assert.equal(calls,0);assert.equal(controller.snapshot().phase,'signed-out');});
test('dispose drops stalled work, and StrictMode restart requires a fresh actor and confirmation',async()=>{const {controller,saved}=await ready(async()=>new Promise(()=>{}));const pending=controller.download();controller.dispose();assert.equal(await pending,false);controller.start();assert.equal(await controller.download(),false);assert.equal(saved.length,0);});
test('default fetch adapter preserves the browser global receiver',async()=>{
  const prior=globalThis.fetch;let compatibleReceiver=false;const saved=[];
  globalThis.fetch=async function(){compatibleReceiver=this==null||this===globalThis;return response(await fixtureBody());};
  try{const controller=new ContentDataExportController(undefined,blob=>saved.push(blob));controller.setActor(actor());controller.setConfirmed(true);assert.equal(await controller.download(),true);assert(compatibleReceiver);assert.equal(saved.length,1);}finally{globalThis.fetch=prior;}
});
test('real browser download adapter creates only an owned Blob URL and always removes/revokes it',async()=>{
  const oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;const events=[];
  URL.createObjectURL=blob=>{assert(blob instanceof Blob);events.push('create');return'blob:synthetic-owned';};URL.revokeObjectURL=url=>{assert.equal(url,'blob:synthetic-owned');events.push('revoke');};
  const link={href:'',download:'',rel:'',click(){assert.equal(this.href,'blob:synthetic-owned');assert.equal(this.download,'urai-content-records.json');events.push('click');},remove(){events.push('remove');}};
  globalThis.document={createElement:tag=>{assert.equal(tag,'a');return link;},body:{appendChild:entry=>{assert.equal(entry,link);events.push('append');}}};
  try{saveContentExport(new Blob(['synthetic']));await new Promise(r=>setTimeout(r,5));assert.deepEqual(events,['create','append','click','remove','revoke']);}finally{globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
test('browser save failure still revokes the Blob URL',async()=>{
  const oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;let revoked=false;
  URL.createObjectURL=()=> 'blob:synthetic';URL.revokeObjectURL=()=>{revoked=true;};globalThis.document={createElement:()=>{throw Error('synthetic unavailable DOM');}};
  try{assert.throws(()=>saveContentExport(new Blob(['synthetic'])));await new Promise(r=>setTimeout(r,5));assert.equal(revoked,true);}finally{globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
test('consumer preserves actual collector owned source facts and revision history in the saved bytes',async()=>{
  const item={id:'owned',createdBy:'fixture-owner',slug:'owned',title:'Recorded title',body:'Raw source text; unknown dialogue remains unknown.',tags:['synthetic-rights'],locale:'en-US',status:'draft',visibility:'private',updatedAt:'2026-10-09T00:00:00.000Z',createdAt:'2026-10-09T00:00:00.000Z',sourceLabel:'Synthetic rights source',whyShownCopy:'Owned',safetyNotes:['source rights preserved'],contentType:'story'};
  const data=await collectContentSubjectExport({uid:'fixture-owner',requestId:'synthetic-request',signal:new AbortController().signal,requireCurrent:async()=>{},store:{readPage:async page=>page.collection==='contentItems'?[{id:'owned',data:item}]:page.collection==='contentVersions'?[{id:'owned-v1',data:{contentId:'owned',version:1,snapshot:item}}]:[]}});
  const {controller,saved}=await ready(async()=>response(data.body));assert.equal(await controller.download(),true);assert.equal(saved.length,1);const decoded=JSON.parse(await saved[0].text());
  assert.equal(decoded.payload.collections.contentItems[0].record.body,item.body);assert.equal(decoded.payload.collections.contentVersions[0].record.snapshot.sourceLabel,item.sourceLabel);assert.deepEqual(decoded.payload.collections.contentItems[0].record.safetyNotes,item.safetyNotes);assert.equal(controller.snapshot().recordCount,2);
});
test('same SDK User synchronous token refresh notification preserves the authorized download',async()=>{
  const {controller,saved}=await ready();let observer,user;user={uid:'fixture-owner',getIdToken:async force=>{assert.equal(force,true);observer.observe(user);return'synthetic-token';}};
  let changes=0;observer=new ContentExportAccountObserver(controller,'fixture-owner',()=>user,()=>{changes++;});observer.observe(user);controller.setConfirmed(true);
  assert.equal(await controller.download(),true);assert.equal(saved.length,1);assert.equal(changes,1);
});
test('different SDK User object at the same UID cancels the previous operation',async()=>{
  const gate=deferred();const {controller,saved}=await ready();let current={uid:'fixture-owner',getIdToken:()=>gate.promise};const observer=new ContentExportAccountObserver(controller,'fixture-owner',()=>current,()=>{});
  observer.observe(current);controller.setConfirmed(true);const pending=controller.download();current={uid:'fixture-owner',getIdToken:async()=> 'new-token'};observer.observe(current);gate.resolve('old-token');
  assert.equal(await pending,false);assert.equal(saved.length,0);assert.equal(controller.snapshot().confirmed,false);
});
test('browser session-ending boundary cancels read and prevents reactivation by a token notification',async()=>{
  const gate=deferred();const body=await fixtureBody();const {controller,saved}=await ready(async()=>response(new ReadableStream({start(c){gate.promise.then(()=>{try{c.enqueue(new TextEncoder().encode(body));c.close();}catch{ /* already cancelled */ }});}})));
  const user={uid:'fixture-owner',getIdToken:async()=> 'synthetic-token'};const observer=new ContentExportAccountObserver(controller,'fixture-owner',()=>user,()=>{});observer.observe(user);controller.setConfirmed(true);
  const pending=controller.download();await new Promise(r=>setTimeout(r,0));observer.endSession();gate.resolve();assert.equal(await pending,false);observer.observe(user);assert.equal(controller.snapshot().phase,'signed-out');assert.equal(saved.length,0);
});
test('account ending during hash verification produces no Blob download or stale summary',async()=>{
  const prior=Object.getOwnPropertyDescriptor(globalThis,'crypto'),gate=deferred();let called=false;
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{subtle:{digest:()=>{called=true;return gate.promise;}}}});
  try{const {controller,saved}=await ready();const pending=controller.download();while(!called)await new Promise(r=>setTimeout(r,0));controller.setActor(null);gate.resolve(new ArrayBuffer(32));assert.equal(await pending,false);assert.equal(saved.length,0);assert.equal(controller.snapshot().recordCount,null);}
  finally{Object.defineProperty(globalThis,'crypto',prior);}
});
test('revoked or disabled-token failure clears old actor, confirmation and download candidate',async()=>{
  let calls=0;const {controller,saved}=await ready(async()=>{calls++;throw Error();});controller.setActor(actor({getToken:async()=>{throw Error('synthetic revoked/disabled SDK account');}}));controller.setConfirmed(true);
  assert.equal(await controller.download(),false);assert.equal(controller.snapshot().phase,'signed-out');assert.equal(controller.snapshot().recordCount,null);assert.equal(saved.length,0);controller.setConfirmed(true);await controller.download();assert.equal(calls,0);
});
test('cancellation after a requested browser download does not promise byte recall',async()=>{const {controller}=await ready();assert.equal(await controller.download(),true);controller.cancel();assert.match(controller.snapshot().message,/cannot recall/);});
test('a synchronous account boundary during browser download never restores the old actor summary',async()=>{
  let controller;controller=new ContentDataExportController(async()=>response(await fixtureBody()),()=>controller.setActor(actor({uid:'new-account'})));controller.setActor(actor());controller.setConfirmed(true);assert.equal(await controller.download(),false);assert.equal(controller.snapshot().phase,'ready');assert.equal(controller.snapshot().recordCount,null);
});

// Actual rendered server-page/component HTML, with explicit session and SDK
// fixtures. SSR does not certify mounted browser pixels, real Auth or delivery.
const require=createRequire(import.meta.url), ts=require('typescript');
const React=await import(pathToFileURL(require.resolve('react')).href);
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')).href);
function jsxModule(relative,replacements=[]) {
  let source=readFileSync(new URL(relative,import.meta.url),'utf8');
  for(const [from,to]of replacements){assert(source.includes(from));source=source.replace(from,to);}
  source=`import * as React from '${pathToFileURL(require.resolve('react')).href}';\n`+source;
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React},fileName:'actual-source.tsx'}).outputText;
  return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
}
const componentUrl=jsxModule('../src/components/ContentDataExport.tsx',[
  ["from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`],
  ["import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';",'const onIdTokenChanged=()=>()=>{}; const signInWithEmailAndPassword=async()=>{}; const signOut=async()=>{};'],
  ["import { getBrowserAuth } from '@/lib/firebaseClient';",'const getBrowserAuth=()=>null;'],
  ["from '@/lib/contentDataExport'",`from '${clientUrl}'`]
]);
const logoutUrl=jsxModule('../src/components/BrowserSessionLogout.tsx',[["from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`]]);
const pageUrl=jsxModule('../src/app/dashboard/settings/page.tsx',[
  ["import { cookies } from 'next/headers';",'const cookies=async()=>({get:()=>({value:"synthetic-session"})});'],
  ["import { CONTENT_SESSION_COOKIE, getBrowserSession } from '@/server/auth/browserSession';",'const CONTENT_SESSION_COOKIE="synthetic-cookie";const getBrowserSession=async()=>globalThis.__uraiContentExportPageFixture;'],
  ["from '@/components/BrowserSessionLogout'",`from '${logoutUrl}'`],
  ["from '@/components/ContentDataExport'",`from '${componentUrl}'`]
]);
const {default:SettingsPage}=await import(pageUrl);
test('actual rendered settings page admits only the existing session UID and matching project consumer',async()=>{
  const oldServer=process.env.FIREBASE_PROJECT_ID,oldPublic=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  try{
    globalThis.__uraiContentExportPageFixture={uid:'fixture-owner',role:'user'};process.env.FIREBASE_PROJECT_ID='synthetic-project';process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID='synthetic-project';
    const page=await SettingsPage();const consumer=page.props.children.find(child=>child?.type?.name==='ContentDataExport');assert.equal(consumer.props.expectedUid,'fixture-owner');assert.equal(consumer.props.projectMatches,true);
    const html=renderToStaticMarkup(page);assert.match(html,/Download your Content records/);assert.match(html,/partial Content export/);assert.match(html,/not an export of your entire UrAi account/);assert.match(html,/file already saved on your device cannot be recalled/);
    for(const label of ['Moderation queues','publishing releases','narrator prompts','story templates','ritual templates','export templates'])assert(html.includes(label));
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID='foreign-project';const mismatched=await SettingsPage();assert.equal(mismatched.props.children.find(child=>child?.type?.name==='ContentDataExport').props.projectMatches,false);
  }finally{delete globalThis.__uraiContentExportPageFixture;if(oldServer===undefined)delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=oldServer;if(oldPublic===undefined)delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID=oldPublic;}
});
test('actual rendered anonymous settings page never mounts the private consumer',async()=>{
  globalThis.__uraiContentExportPageFixture=null;try{const html=renderToStaticMarkup(await SettingsPage());assert.match(html,/Sign in to manage your account/);assert(!html.includes('Download your Content records'));}finally{delete globalThis.__uraiContentExportPageFixture;}
});
for(const throwing of [false,true])test('actual DOM click '+(throwing?'then throws':'cancels')+' never promises no downloaded file after the request boundary',async()=>{
  const priorDocument=globalThis.document,priorCreate=URL.createObjectURL,priorRevoke=URL.revokeObjectURL;let revoked=false,controller;
  URL.createObjectURL=()=> 'blob:synthetic';URL.revokeObjectURL=()=>{revoked=true;};
  const link={href:'',download:'',rel:'',remove(){},click(){if(throwing)throw Error('synthetic click-started failure');controller.cancel();}};
  globalThis.document={createElement:()=>link,body:{appendChild(){}}};
  try{controller=new ContentDataExportController(async()=>response(await fixtureBody()));controller.setActor(actor());controller.setConfirmed(true);assert.equal(await controller.download(),false);
    assert.match(controller.snapshot().message,/may already|cannot recall/);assert(!controller.snapshot().message.includes('No file'));assert.equal(controller.snapshot().recordCount,null);await new Promise(r=>setTimeout(r,5));assert.equal(revoked,true);
  }finally{globalThis.document=priorDocument;URL.createObjectURL=priorCreate;URL.revokeObjectURL=priorRevoke;}
});
test('actual focus recovery restores only a removed control with browser focus lost to body',()=>{
  let focused=0;const body={},previous={},outside={},target={focus:()=>{focused++;}},root={querySelector:selector=>{assert.equal(selector,'[data-export-recovery-focus]:not(:disabled)');return target;}};
  const doc={activeElement:body,body,contains:()=>false};assert.equal(restoreContentExportFocus(root,previous,doc),true);assert.equal(focused,1);
  doc.activeElement=outside;assert.equal(restoreContentExportFocus(root,previous,doc),false);assert.equal(focused,1);
  doc.activeElement=body;doc.contains=()=>true;assert.equal(restoreContentExportFocus(root,previous,doc),false);assert.equal(focused,1);
  assert.equal(restoreContentExportFocus(null,previous,doc),false);
});
test('actual signed-in React output retains a focusable download control during pending and result',async()=>{
  const hooks="import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';";
  const focusedComponentUrl=jsxModule('../src/components/ContentDataExport.tsx',[
    [hooks,`import { useEffect, useMemo as reactMemo, useRef, useState as reactState, useSyncExternalStore } from '${pathToFileURL(require.resolve('react')).href}';
      const useMemo=()=>reactMemo(()=>globalThis.__uraiExportFocusFixture.controller,[]);
      const useState=()=>reactState([null,globalThis.__uraiExportFocusFixture.user,true,false,'',false][globalThis.__uraiExportFocusFixture.index++]);`],
    ["import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';",'const onIdTokenChanged=()=>()=>{};const signInWithEmailAndPassword=async()=>{};const signOut=async()=>{};'],
    ["import { getBrowserAuth } from '@/lib/firebaseClient';",'const getBrowserAuth=()=>null;'],
    ["from '@/lib/contentDataExport'",`from '${clientUrl}'`]
  ]);
  const {ContentDataExport}=await import(focusedComponentUrl);const gate=deferred();const {controller}=await ready(async()=>gate.promise);
  const pending=controller.download();globalThis.__uraiExportFocusFixture={controller,user:{uid:'fixture-owner'},index:0};
  try{
    for(const phase of ['pending','result']){
      if(phase==='result'){gate.resolve(response(await fixtureBody()));await pending;globalThis.__uraiExportFocusFixture.index=0;}
      const html=renderToStaticMarkup(React.createElement(ContentDataExport,{expectedUid:'fixture-owner',projectMatches:true}));
      const download=html.match(/<button[^>]*>Download Content records<\/button>/)?.[0];assert(download);assert.match(download,/aria-disabled="true"/);assert(!/\sdisabled(?:[= >])/.test(download));
      assert.match(html,/data-export-recovery-focus/);
    }
  }finally{delete globalThis.__uraiExportFocusFixture;controller.cancel();}
});
