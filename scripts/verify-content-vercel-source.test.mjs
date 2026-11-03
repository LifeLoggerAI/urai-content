import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyContentReleaseSources } from './verify-content-vercel-source.mjs';

const sha='a'.repeat(40);
const deploymentUrl='https://urai-content-example.vercel.app';
const baseUrl='https://content.urai.app';
const request=(extras={})=>({deploymentUrl,baseUrl,expectedSha:sha,...extras});
const stream=(text)=>new ReadableStream({start(controller){
  controller.enqueue(new TextEncoder().encode(text));controller.close();
}});
const reply=(commitSha=sha,extras={})=>({
  status:200, redirected:false,
  headers:{get:(k)=>k==='content-type'?'application/json':null},
  body:stream(JSON.stringify({service:'urai-content-web',commitSha})),
  ...extras
});

test('verify both artifact and exact public source',async()=>{
  const hits=[];
  const result=await verifyContentReleaseSources(request({fetchImpl:async(url,opts)=>{
    hits.push([url,opts.redirect,opts.cache]);return reply();
  }}));
  assert.equal(result.expectedSha,sha);
  assert.deepEqual(hits,[[deploymentUrl+'/api/version','error','no-store'],[baseUrl+'/api/version','error','no-store']]);
});
test('deny stale artifact or stale domain',async()=>{
  for(const stale of [deploymentUrl,baseUrl]){
    await assert.rejects(verifyContentReleaseSources(request({fetchImpl:async url=>reply(url.startsWith(stale)?'b'.repeat(40):sha)})),/CONTENT_RELEASE_SOURCE_MISMATCH/);
  }
});
test('deny invalid authority and unsafe destinations',async()=>{
  for(const expectedSha of [null,undefined,'',sha.slice(0,8)]) {
    await assert.rejects(verifyContentReleaseSources(request({expectedSha,fetchImpl:async()=>reply()})),/CONTENT_RELEASE_SHA_INVALID/);
  }
  for(const deploymentUrl of ['http://urai-content-example.vercel.app','https://example.com','https://urai-content-example.vercel.app/path']){
    await assert.rejects(verifyContentReleaseSources(request({deploymentUrl,fetchImpl:async()=>reply()})),/CONTENT_RELEASE_(?:PROVIDER_)?URL_INVALID/);
  }
  for(const baseUrl of ['https://localhost','http://content.urai.app','https://content.urai.app?token=foo']){
    await assert.rejects(verifyContentReleaseSources(request({baseUrl,fetchImpl:async()=>reply()})),/CONTENT_RELEASE_(?:DOMAIN|URL)_INVALID/);
  }
});
test('deny malformed response, redirects and network failures',async()=>{
  for(const bad of [reply(sha,{status:302}),reply(sha,{redirected:true}),reply(sha,{headers:{get:()=> 'text/html'}}),reply(sha,{body:stream('.'.repeat(16385))})]){
    await assert.rejects(verifyContentReleaseSources(request({fetchImpl:async()=>bad})),/CONTENT_RELEASE_VERSION_RESPONSE_INVALID/);
  }
  await assert.rejects(verifyContentReleaseSources(request({fetchImpl:async()=>{throw Error('offline')}})),/CONTENT_RELEASE_VERSION_UNREACHABLE/);
});
