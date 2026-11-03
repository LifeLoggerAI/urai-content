import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyContentReleaseSources } from './verify-content-vercel-source.mjs';

const sha = 'a'.repeat(40);
const base = {deploymentUrl:'https://urai-content-test.vercel.app',baseUrl:'https://content.urai.app',expectedSha:sha};
const encoded = (v) => new TextEncoder().encode(v);
function instrumentedResponse(chunks,{advertisedBytes}={}) {
  let cancelCount=0;
  let unsafeReads=0;
  const stream = new ReadableStream({
    start(controller){
      for(const chunk of chunks) controller.enqueue(encoded(chunk));
      controller.close();
    },
    cancel(){cancelCount++;}
  });
  return {
    response:{status:200,redirected:false,headers:{get:k=>k==='content-type'?'application/json':k==='content-length'?advertisedBytes??null:null},
      body:stream,async text(){unsafeReads++;throw new Error('unbounded text() API invoked');}},
    calls:()=>({cancelCount,unsafeReads})
  };
}
function validPayload(){return JSON.stringify({service:'urai-content-web',commitSha:sha})}

test('streamed JSON attests the expected commit without unbounded response.text()',async()=>{
  const payload=validPayload();
  const fixture=instrumentedResponse([payload.slice(0,17),payload.slice(17)]);
  const result=await verifyContentReleaseSources({...base,baseUrl:base.deploymentUrl,fetchImpl:async()=>fixture.response});
  assert.deepEqual(result.checkedOrigins,[base.deploymentUrl]);
  assert.equal(fixture.calls().unsafeReads,0);
});
test('advertised oversize is rejected before any unbounded read',async()=>{
  const fixture=instrumentedResponse([validPayload()],{advertisedBytes:'16385'});
  await assert.rejects(verifyContentReleaseSources({...base,baseUrl:base.deploymentUrl,fetchImpl:async()=>fixture.response}),/CONTENT_RELEASE_VERSION_RESPONSE_INVALID/);
  assert.equal(fixture.calls().unsafeReads,0);
});
test('streamed oversized body is rejected with generic denial without response.text()',async()=>{
  const fixture=instrumentedResponse(['x'.repeat(8200),'x'.repeat(8200)]);
  await assert.rejects(verifyContentReleaseSources({...base,baseUrl:base.deploymentUrl,fetchImpl:async()=>fixture.response}),/CONTENT_RELEASE_VERSION_RESPONSE_INVALID/);
  assert.equal(fixture.calls().unsafeReads,0);
});
test('malformed advertised length is rejected independently of valid response body',async()=>{
  for(const bad of ['negative','-1','NaN','999999999999999999999']){
    const fixture=instrumentedResponse([validPayload()],{advertisedBytes:bad});
    await assert.rejects(verifyContentReleaseSources({...base,baseUrl:base.deploymentUrl,fetchImpl:async()=>fixture.response}),/CONTENT_RELEASE_VERSION_RESPONSE_INVALID/);
  }
});
test('empty stream cannot be interpreted as a valid version receipt',async()=>{
  const fixture=instrumentedResponse([]);
  await assert.rejects(verifyContentReleaseSources({...base,baseUrl:base.deploymentUrl,fetchImpl:async()=>fixture.response}),/CONTENT_RELEASE_VERSION_RESPONSE_INVALID/);
});
