import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const root = JSON.parse(read('package.json'));
const web = JSON.parse(read('apps/web/package.json'));
const workflow = read('.github/workflows/deploy-vercel-production.yml');
const config = read('apps/web/next.config.mjs');

test('controller Firebase client and canonical Privacy source tests are retained', () => {
  assert.ok(web.dependencies.firebase);
  for (const action of ['test:privacy-consumer', 'test:privacy-export', 'test:privacy-export-client']) {
    assert.ok(web.scripts.test.includes(action), 'required Privacy test omitted: ' + action);
  }
  assert.match(root.scripts['web:deploy:preflight:test'], /content-convergence-contract\.test/);
});

test('one compiled SHA supports both controller and publisher build identities', () => {
  assert.match(config, /process\.env\.URAI_CONTENT_BUILD_SHA/);
  assert.match(config, /process\.env\.URAI_CONTENT_RELEASE_SHA/);
  assert.match(config, /URAI_CONTENT_COMPILED_SHA: compiledCommitSha/);
  assert.match(config, /URAI_CONTENT_BUILD_SHA: compiledCommitSha/);
  assert.match(config, /URAI_CONTENT_BUILD_COMMIT_CONFLICT/);
  assert.match(read('apps/web/src/app/api/version/route.ts'), /const builtSha = process\.env\.URAI_CONTENT_COMPILED_SHA/);
});

test('protected deployment workflow keeps production hard stop and source checks in order', () => {
  const order = [
    'Enforce production ADC identity gate',
    'Verify root package and governance',
    'Verify web runtime',
    'Validate pulled Vercel build layout',
    'Verify linked Content Vercel project and source root',
    'Test combined Content source and packaging guards',
    'Build with Vercel',
    'Verify Vercel prebuilt artifact root',
    'Deploy prebuilt preview artifact',
    'Verify deployed artifact and target domain serve exact compiled commit',
    'Verify prebuilt deployment identity and routes',
  ];
  const positions = order.map(name => workflow.indexOf(name));
  assert.ok(positions.every(index => index >= 0), 'deployment guard missing');
  assert.ok(positions.every((index, i) => i === 0 || index > positions[i - 1]), 'guard order changed');
  assert.match(workflow, /DEPLOY_ENVIRONMENT" = "production"/);
  assert.match(workflow, /steps\.deploy\.outcome == 'success'/);
  assert.match(workflow, /npm run smoke:routes --prefix apps\/web/);
});

test('root and web Rules copies remain byte-identical from controller', () => {
  assert.equal(read('firestore.rules'), read('apps/web/firestore.rules'));
  assert.equal(read('storage.rules'), read('apps/web/storage.rules'));
});

test('package hooks fail closed and do not activate production deployment', () => {
  assert.match(root.scripts.deploy, /intentionally blocked/);
  assert.match(root.scripts['web:deploy:preflight:test'], /check-content-build-source\.test/);
  assert.match(web.scripts.prebuild, /check-vercel-web-payload/);
  assert.match(web.scripts.postbuild, /--built/);
  assert.match(root.scripts['check:all'], /web:deploy:preflight:test/);
});
