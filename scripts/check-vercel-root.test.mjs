import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../apps/web/scripts/check-vercel-root.mjs', import.meta.url));
const projectId = 'prj_tcHThuSZ0Zpm4fXp5jHif2EbOdpv';
const teamId = 'team_w8p5bf3ufFzHRnb9QykJmjVR';
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'urai-content-link-'));
  const web = join(dir, 'apps', 'web');
  try {
    mkdirSync(join(web, 'src', 'app'), { recursive: true });
    mkdirSync(join(web, '.vercel', 'output'), { recursive: true });
    mkdirSync(join(web, '.next'), { recursive: true });
    writeFileSync(join(web, 'package.json'), JSON.stringify({name:'urai-content-web',scripts:{build:'next build'}}));
    writeFileSync(join(web, 'next.config.mjs'), 'export default {}');
    writeFileSync(join(web, '.vercel', 'project.json'), JSON.stringify({projectId,orgId:teamId}));
    writeFileSync(join(web, '.vercel', 'output', 'config.json'), JSON.stringify({version:3,routes:[]}));
    writeFileSync(join(web, '.next', 'routes-manifest.json'), JSON.stringify({version:3}));
    return fn({dir,web,write:(file,data)=>writeFileSync(join(web,file),data)});
  } finally { rmSync(dir,{recursive:true,force:true}); }
}
function check(dir,cwd,phase='linked',opts={}) {
  return spawnSync(process.execPath,[script,phase],{
    cwd,encoding:'utf8',env:{...process.env,GITHUB_WORKSPACE:opts.workspace??dir,
      VERCEL_PROJECT_ID:opts.projectId??projectId,VERCEL_ORG_ID:opts.orgId??teamId}
  });
}
const denies = (result,code) => {
  assert.notEqual(result.status,0,result.stdout);
  assert.match(result.stderr,new RegExp('CONTENT_VERCEL_ROOT_'+code));
};
test('Content link admits approved exact project and root',()=>fixture(({dir,web})=>{
  assert.equal(check(dir,web).status,0);
}));
test('prebuilt Content requires the correct Next and Vercel output manifests',()=>fixture(({dir,web})=>{
  assert.equal(check(dir,web,'prebuilt').status,0);
}));
test('a wrong checkout directory is denied',()=>fixture(({dir})=>{
  denies(check(dir,dir),'WORKSPACE_MISMATCH');
}));
test('a mislinked Vercel project is denied',()=>fixture(({dir,web,write})=>{
  write('.vercel/project.json',JSON.stringify({projectId:'prj_WRONG',orgId:teamId}));
  denies(check(dir,web),'PROJECT_MISMATCH');
}));
test('environment project mismatch is denied',()=>fixture(({dir,web})=>{
  denies(check(dir,web,'linked',{projectId:'prj_WRONG'}),'PROJECT_MISMATCH');
}));
test('nested or absolute provider root setting is denied when available',()=>fixture(({dir,web,write})=>{
  for(const rootDirectory of ['src','/vercel/path0','/vercel/path0/vercel/path0','../../secret']) {
    write('.vercel/project.json',JSON.stringify({projectId,orgId:teamId,settings:{rootDirectory}}));
    denies(check(dir,web),'PROVIDER_ROOT_MISMATCH');
  }
}));
test('double-applied apps/web provider root is denied from apps/web cwd',()=>fixture(({dir,web,write})=>{
  write('.vercel/project.json',JSON.stringify({projectId,orgId:teamId,settings:{rootDirectory:'apps/web'}}));
  denies(check(dir,web),'PROVIDER_ROOT_MISMATCH');
  denies(check(dir,web,'prebuilt'),'PROVIDER_ROOT_MISMATCH');
}));
test('canonical local root is accepted when explicitly available',()=>fixture(({dir,web,write})=>{
  for (const rootDirectory of ['', '.']) {
    write('.vercel/project.json',JSON.stringify({projectId,orgId:teamId,settings:{rootDirectory}}));
    assert.equal(check(dir,web).status,0);
  }
}));
test('missing or malformed prebuilt config is denied',()=>fixture(({dir,web,write})=>{
  write('.vercel/output/config.json','{broken');
  denies(check(dir,web,'prebuilt'),'JSON_INVALID');
  write('.vercel/output/config.json',JSON.stringify({version:2}));
  denies(check(dir,web,'prebuilt'),'PREBUILT_OUTPUT_INVALID');
}));
test('the exact duplicated root from the failed Vercel log is denied if emitted in output',()=>fixture(({dir,web,write})=>{
  write('.vercel/output/config.json',JSON.stringify({version:3,routes:[{src:'/vercel/path0/vercel/path0/.next/routes-manifest.json'}]}));
  denies(check(dir,web,'prebuilt'),'DUPLICATE_BUILD_ROOT');
}));
test('a wrapped Next source directory is denied',()=>fixture(({dir,web})=>{
  mkdirSync(join(web,'src','src','app'),{recursive:true});
  writeFileSync(join(web,'src','next.config.mjs'),'export default {}');
  denies(check(dir,web),'APP_LAYOUT_INVALID');
}));
test('a misnamed package cannot stand in for Content',()=>fixture(({dir,web,write})=>{
  write('package.json',JSON.stringify({name:'urai-app',scripts:{build:'next build'}}));
  denies(check(dir,web),'APP_WRONG');
}));
