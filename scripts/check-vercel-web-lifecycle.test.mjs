import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const standaloneScript = fileURLToPath(new URL('../apps/web/scripts/check-vercel-web-payload.mjs', import.meta.url))
function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'urai-content-vercel-'))
  try { return fn(root) } finally { rmSync(root, { recursive: true, force: true }) }
}
function makeWeb(root) {
  mkdirSync(join(root, 'src', 'app'), { recursive: true })
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'urai-content-web', scripts: { build: 'next build' } }))
  writeFileSync(join(root, 'next.config.mjs'), 'export default {}')
}
function run(root, ...args) {
  return spawnSync(process.execPath, [standaloneScript, '--source-root', root, ...args], { encoding: 'utf8' })
}

test('rejects parseable but invalid Next.js manifest objects', () => fixture(root => {
  makeWeb(root)
  mkdirSync(join(root, '.next'), { recursive: true })
  for (const invalid of [null, [], {}, { version: 2 }, { version: '3' }]) {
    writeFileSync(join(root, '.next', 'routes-manifest.json'), JSON.stringify(invalid))
    const result = run(root, '--built')
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /INVALID_NEXT_ROUTES_MANIFEST/)
  }
}))
function lifecycleFixture(root, emitManifest) {
  makeWeb(root)
  const pkg = {name: 'urai-content-web', type: 'module', scripts: {
    prebuild: `node \"${standaloneScript}\" --source-root .`,
    build: 'next build',
    postbuild: `node \"${standaloneScript}\" --source-root . --built`,
  }}
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg))
  mkdirSync(join(root, 'node_modules', '.bin'), {recursive:true})
  const bin=join(root,'node_modules','.bin','next')
  const body=emitManifest ?
    `#!/usr/bin/env node\nconst fs=require('node:fs'); fs.mkdirSync('.next',{recursive:true}); fs.writeFileSync('.next/routes-manifest.json',JSON.stringify({version:3}));\n` :
    `#!/usr/bin/env node\nrequire('node:fs').writeFileSync('fake-next-ran', 'yes');\n`
  writeFileSync(bin,body)
  chmodSync(bin,0o755)
}
test('npm build invokes prebuild and refuses missing deployment config before Next executes', () => fixture(root => {
  lifecycleFixture(root, false)
  unlinkSync(join(root, 'next.config.mjs'))
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], {cwd:root,encoding:'utf8'})
  assert.notEqual(result.status,0)
  assert.match(result.stderr, /MISSING_WEB_APP_COMPONENT:next.config.mjs/)
  assert.equal(existsSync(join(root,'fake-next-ran')),false)
}))
test('npm build invokes postbuild and rejects absent route manifest', () => fixture(root => {
  lifecycleFixture(root, false)
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], {cwd:root,encoding:'utf8'})
  assert.notEqual(result.status,0)
  assert.match(result.stderr, /MISSING_NEXT_ROUTES_MANIFEST/)
  assert.equal(existsSync(join(root,'fake-next-ran')),true)
}))
test('npm build runs both hooks successfully when Next writes a valid manifest', () => fixture(root => {
  lifecycleFixture(root, true)
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], {cwd:root,encoding:'utf8'})
  assert.equal(result.status,0,result.stderr)
  assert.match(result.stdout,/PASS_WEB_DEPLOY_PAYLOAD/)
}))
