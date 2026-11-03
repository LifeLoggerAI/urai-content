#!/usr/bin/env node
// Non-deploying, fail-closed guard for the Content project's linked build root.
// Do not infer provider-side rootDirectory solely from local project.json.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

const APPROVED_PROJECT = 'prj_tcHThuSZ0Zpm4fXp5jHif2EbOdpv';
const APPROVED_TEAM = 'team_w8p5bf3ufFzHRnb9QykJmjVR';
const fail = code => { throw Error('CONTENT_VERCEL_ROOT_' + code); };
const phase = process.argv[2] ?? 'linked';
if (!['linked', 'prebuilt'].includes(phase) || process.argv.length > 3) fail('INVALID_PHASE');
const workspace = process.env.GITHUB_WORKSPACE;
if (!workspace || !existsSync(workspace)) fail('WORKSPACE_MISSING');
const root = realpathSync(process.cwd());
if (root !== join(realpathSync(workspace), 'apps', 'web')) fail('WORKSPACE_MISMATCH');
for (const file of ['package.json', 'next.config.mjs']) {
  if (!existsSync(join(root, file))) fail('APP_MISSING');
}
if (!existsSync(join(root, 'src', 'app')) ||
    existsSync(join(root, 'src', 'next.config.mjs'))) fail('APP_LAYOUT_INVALID');
const load = file => {
  try { return JSON.parse(readFileSync(join(root, file), 'utf8')); }
  catch { fail('JSON_INVALID'); }
};
const packageJson = load('package.json');
if (packageJson.name !== 'urai-content-web' || packageJson.scripts?.build !== 'next build') fail('APP_WRONG');
if (!existsSync(join(root, '.vercel', 'project.json'))) fail('PROJECT_LINK_MISSING');
const project = load('.vercel/project.json');
if (project.projectId !== APPROVED_PROJECT || project.orgId !== APPROVED_TEAM ||
    (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID !== APPROVED_PROJECT) ||
    (process.env.VERCEL_ORG_ID && process.env.VERCEL_ORG_ID !== APPROVED_TEAM)) fail('PROJECT_MISMATCH');
// Some Vercel CLI versions include project settings in the local project link.
// If present, forbid absolute or nested roots. An absent setting is NOT proof
// of provider rootDirectory; independently inspect provider configuration.
const configuredRoot = project.settings?.rootDirectory;
if (configuredRoot !== undefined && configuredRoot !== null &&
    !['', '.', 'apps/web'].includes(configuredRoot)) fail('PROVIDER_ROOT_MISMATCH');
if (phase === 'prebuilt') {
  if (!existsSync(join(root, '.next', 'routes-manifest.json'))) fail('NEXT_MANIFEST_MISSING');
  const manifest = load('.next/routes-manifest.json');
  if (!manifest || manifest.version !== 3 || Array.isArray(manifest)) fail('NEXT_MANIFEST_INVALID');
  if (!existsSync(join(root, '.vercel', 'output', 'config.json'))) fail('PREBUILT_OUTPUT_MISSING');
  const output = load('.vercel/output/config.json');
  if (!output || output.version !== 3 || Array.isArray(output)) fail('PREBUILT_OUTPUT_INVALID');
  // Reject an explicitly repeated provider build root if it appears in the
  // adapter output. This does not replace actual Vercel remote build proof.
  if (/\/vercel\/path0\/vercel\/path0\//.test(JSON.stringify(output))) fail('DUPLICATE_BUILD_ROOT');
}
console.log('PASS_CONTENT_VERCEL_ROOT phase=' + phase);
