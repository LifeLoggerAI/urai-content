import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const configFile = resolve(new URL('../apps/web/next.config.mjs', import.meta.url).pathname);
const routeFile = resolve(new URL('../apps/web/src/app/api/version/route.ts', import.meta.url).pathname);
const vars = ['URAI_CONTENT_RELEASE_SHA','GITHUB_SHA','VERCEL_GIT_COMMIT_SHA'];
const a = 'a'.repeat(40), b = 'b'.repeat(40);
let counter = 0;
async function configFor(values) {
  const previous = Object.fromEntries(vars.map(name => [name, process.env[name]]));
  try {
    for (const name of vars) {
      if (values[name] === undefined) delete process.env[name];
      else process.env[name] = values[name];
    }
    return (await import(pathToFileURL(configFile).href + '?e=' + counter++)).default;
  } finally {
    for (const name of vars) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}
function routeFor(env) {
  const code = readFileSync(routeFile,'utf8')
    .replace("import { NextResponse } from 'next/server';",'')
    .replace('export const dynamic =','const dynamic =')
    .replace('export function GET()', 'function GET()');
  const module = { exports:{} };
  vm.runInNewContext(code + '\nmodule.exports.GET=GET;',{
    process:{env},module,NextResponse:{json:(body,options)=>({body,options})}
  });
  return module.exports.GET();
}
test('GitHub prebuild embeds exact commit and version never caches it',async()=>{
  const cfg = await configFor({GITHUB_SHA:a,URAI_CONTENT_RELEASE_SHA:a});
  assert.equal(cfg.env.URAI_CONTENT_COMPILED_SHA,a);
  const out=routeFor({URAI_CONTENT_COMPILED_SHA:a});
  assert.equal(out.body.commitSha,a);
  assert.match(out.options.headers['Cache-Control'],/no-store/);
});
test('Vercel direct Git source embeds same build-time commit',async()=>{
  assert.equal((await configFor({VERCEL_GIT_COMMIT_SHA:b})).env.URAI_CONTENT_COMPILED_SHA,b);
});
test('missing source cannot be reconstructed from runtime variables',async()=>{
  assert.equal((await configFor({})).env.URAI_CONTENT_COMPILED_SHA,'');
  assert.equal(routeFor({VERCEL_GIT_COMMIT_SHA:a}).body.commitSha,null);
});
test('build rejects invalid and contradictory SHA metadata',async()=>{
  for (const key of vars) await assert.rejects(configFor({[key]:'a'.repeat(8)}),/URAI_CONTENT_BUILD_COMMIT_INVALID/);
  await assert.rejects(configFor({GITHUB_SHA:a,URAI_CONTENT_RELEASE_SHA:b}),/URAI_CONTENT_BUILD_COMMIT_CONFLICT/);
  await assert.rejects(configFor({GITHUB_SHA:a,VERCEL_GIT_COMMIT_SHA:b}),/URAI_CONTENT_BUILD_COMMIT_CONFLICT/);
});
test('runtime SHA contradiction, malformed compiled hash and stale metadata fail closed',()=>{
  for (const env of [
    {URAI_CONTENT_COMPILED_SHA:a,VERCEL_GIT_COMMIT_SHA:b},
    {URAI_CONTENT_COMPILED_SHA:'a'.repeat(8)},
    {URAI_CONTENT_COMPILED_SHA:'A'.repeat(40)},
  ]) assert.equal(routeFor(env).body.commitSha,null);
});
