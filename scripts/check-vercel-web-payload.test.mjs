import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-vercel-web-payload.mjs', import.meta.url))
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
  return spawnSync(process.execPath, [script, '--source-root', root, ...args], { encoding: 'utf8' })
}
test('accepts the correct root for Next.js Content web source', () => fixture(root => {
  makeWeb(root)
  const result = run(root)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /PASS_WEB_DEPLOY_PAYLOAD/)
}))
test('rejects the May 2026 source upload shape: a single src/ wrapper', () => fixture(root => {
  makeWeb(join(root, 'src'))
  const result = run(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /WRAPPED_SOURCE_ROOT/)
}))
test('denies an unrelated package masquerading as the web app', () => fixture(root => {
  makeWeb(root)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'urai-content', scripts: { build: 'tsc' } }))
  const result = run(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /WRONG_WEB_PACKAGE/)
}))
test('denies missing built route manifest', () => fixture(root => {
  makeWeb(root)
  const result = run(root, '--built')
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /MISSING_NEXT_ROUTES_MANIFEST/)
}))
test('accepts the route manifest at the actual Next.js root after build', () => fixture(root => {
  makeWeb(root)
  mkdirSync(join(root, '.next'), { recursive: true })
  writeFileSync(join(root, '.next', 'routes-manifest.json'), JSON.stringify({ version: 3 }))
  const result = run(root, '--built')
  assert.equal(result.status, 0, result.stderr)
}))
test('denies invalid route manifest payload', () => fixture(root => {
  makeWeb(root)
  mkdirSync(join(root, '.next'), { recursive: true })
  writeFileSync(join(root, '.next', 'routes-manifest.json'), 'nope')
  const result = run(root, '--built')
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /INVALID_NEXT_ROUTES_MANIFEST/)
}))
