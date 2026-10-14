import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectVercelBuildLayout, checkPulledProject } from './check-vercel-build-layout.mjs';

const baseline = {
  repositoryRoot: '/vercel/path0', invocationDirectory: '/vercel/path0/apps/web',
  expectedProjectId: 'prj_fixture', expectedOrgId: 'team_fixture', pathApi: path.posix,
  project: { projectId: 'prj_fixture', orgId: 'team_fixture', settings: { framework: 'nextjs', rootDirectory: null, outputDirectory: null, buildCommand: 'npm run build', installCommand: 'npm ci' } }
};
const inspect = (settings = {}, other = {}) => inspectVercelBuildLayout({ ...baseline, ...other, project: { ...baseline.project, settings: { ...baseline.project.settings, ...settings } } });
const removeFixture = async (directory) => {
  const absolute = path.resolve(directory);
  assert.equal(path.dirname(absolute), path.resolve(os.tmpdir()));
  assert.ok(path.basename(absolute).startsWith('content-'));
  await rm(absolute, { recursive: true, force: true });
};

test('accepts app-local Next defaults without claiming deployment', () => assert.deepEqual(inspect(), { ok: true, failures: [] }));
test('accepts empty root directory as the pinned CLI app-local default', () => assert.deepEqual(inspect({ rootDirectory: '' }), { ok: true, failures: [] }));
test('accepts a repository-root invocation with one apps/web prefix', () => assert.equal(inspect({ rootDirectory: 'apps/web' }, { invocationDirectory: '/vercel/path0' }).ok, true));
test('rejects applying the app prefix twice', () => {
  assert.equal(path.posix.join(baseline.invocationDirectory, 'apps/web'), '/vercel/path0/apps/web/apps/web');
  assert.deepEqual(inspect({ rootDirectory: 'apps/web' }).failures, ['WEB_ROOT_MISMATCH']);
});
test('rejects the repository package as the web runtime', () => assert.deepEqual(inspect({}, { invocationDirectory: '/vercel/path0' }).failures, ['WEB_ROOT_MISMATCH']));
for (const output of ['/vercel/path0/.next', 'C:\\vercel\\path0\\.next', '../.next', 'apps/web/.next']) {
  test(`rejects invalid Next output ${output}`, () => assert.equal(inspect({ outputDirectory: output }).ok, false));
}
test('retains historical doubled absolute output as a synthetic symptom fixture', () => {
  assert.equal(path.posix.join('/vercel/path0', '/vercel/path0/.next', 'routes-manifest.json'), '/vercel/path0/vercel/path0/.next/routes-manifest.json');
  assert.ok(inspect({ outputDirectory: '/vercel/path0/.next' }).failures.includes('OUTPUT_DIRECTORY_INVALID'));
});
test('accepts relative .next output', () => assert.equal(inspect({ outputDirectory: '.next' }).ok, true));
for (const command of ['npm run web:build', 'npm run build --prefix apps/web', 'cd apps/web && npm run build']) {
  test(`rejects nested app command ${command}`, () => assert.ok(inspect({ buildCommand: command }).failures.includes('NESTED_WEB_COMMAND')));
}
test('rejects missing settings and identity mismatch', () => {
  assert.deepEqual(inspectVercelBuildLayout({ ...baseline, project: {} }).failures, ['PROJECT_SETTINGS_MISSING']);
  assert.ok(inspect({}, { expectedProjectId: 'prj_different' }).failures.includes('PROJECT_IDENTITY_MISMATCH'));
});
for (const command of ['pnpm --dir apps/web build', 'yarn --cwd apps/web build', 'npm --prefix ./apps/web run build', 'npm run build && cd ../..', '']) {
  test(`requires review of unsupported custom command ${command}`, () => assert.ok(inspect({ buildCommand: command }).failures.includes('CUSTOM_COMMAND_REQUIRES_REVIEW')));
}
test('rejects an unknown framework and missing expected authority', () => {
  assert.ok(inspect({ framework: null }).failures.includes('NEXT_FRAMEWORK_UNVERIFIED'));
  assert.ok(inspect({}, { expectedOrgId: '' }).failures.includes('EXPECTED_PROJECT_IDENTITY_MISSING'));
});

test('reads only the exact pulled project and detects a new config override', async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), 'content-build-layout-'));
  try {
    const app = path.join(repo, 'apps', 'web');
    const projectFile = path.join(app, '.vercel', 'project.json');
    await mkdir(path.dirname(projectFile), { recursive: true });
    await writeFile(path.join(repo, 'package.json'), '{"private":true}');
    await writeFile(projectFile, JSON.stringify(baseline.project));
    const args = { repositoryRoot: repo, invocationDirectory: app, projectFile, expectedProjectId: 'prj_fixture', expectedOrgId: 'team_fixture' };
    assert.equal((await checkPulledProject(args)).ok, true);
    await writeFile(path.join(app, 'vercel.json'), '{}');
    assert.deepEqual((await checkPulledProject(args)).failures, ['LAYOUT_OVERRIDE_REQUIRES_REVIEW']);
  } finally { await removeFixture(repo); }
});

test('CLI fails closed without echoing malformed settings values', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'content-layout-malformed-'));
  try {
    await mkdir(path.join(cwd, '.vercel'));
    await writeFile(path.join(cwd, '.vercel', 'project.json'), '{"token":"private-fixture-must-not-print",');
    const run = spawnSync(process.execPath, [fileURLToPath(new URL('./check-vercel-build-layout.mjs', import.meta.url))], { cwd, encoding: 'utf8', env: { ...process.env, VERCEL_PROJECT_ID: 'prj_fixture', VERCEL_ORG_ID: 'team_fixture' } });
    assert.equal(run.status, 1);
    assert.ok(run.stderr.includes('PROJECT_READ_FAILED'));
    assert.ok(!`${run.stdout}${run.stderr}`.includes('private-fixture-must-not-print'));
  } finally { await removeFixture(cwd); }
});

test('actual CLI permits valid layout and stops duplicate layout before a following build', async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), 'content-layout-cli-'));
  try {
    const app = path.join(repo, 'apps', 'web');
    const script = path.join(repo, 'scripts', 'check-vercel-build-layout.mjs');
    await mkdir(path.dirname(script), { recursive: true });
    await mkdir(path.join(app, '.vercel'), { recursive: true });
    await writeFile(path.join(repo, 'package.json'), '{"private":true}');
    await writeFile(script, await readFile(new URL('./check-vercel-build-layout.mjs', import.meta.url)));
    const projectFile = path.join(app, '.vercel', 'project.json');
    const env = { ...process.env, VERCEL_PROJECT_ID: 'prj_fixture', VERCEL_ORG_ID: 'team_fixture' };
    await writeFile(projectFile, JSON.stringify(baseline.project));
    const valid = spawnSync(process.execPath, [script], { cwd: app, env, encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(valid.stdout).deploymentVerified, false);
    await writeFile(projectFile, JSON.stringify({ ...baseline.project, settings: { ...baseline.project.settings, rootDirectory: 'apps/web' } }));
    const invalid = spawnSync(process.execPath, [script], { cwd: app, env, encoding: 'utf8' });
    let nextBuildExecutions = 0;
    if (invalid.status === 0) nextBuildExecutions += 1;
    assert.equal(invalid.status, 1);
    assert.deepEqual(JSON.parse(invalid.stdout).failures, ['WEB_ROOT_MISMATCH']);
    assert.equal(nextBuildExecutions, 0);
  } finally { await removeFixture(repo); }
});
