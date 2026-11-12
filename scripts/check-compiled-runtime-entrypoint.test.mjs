import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const entry = resolve(root, manifest.main)
const declaration = resolve(root, manifest.types)

test('published Content package entrypoints exist after production compile', () => {
  assert.equal(manifest.main, 'dist/src/index.js')
  assert.equal(manifest.types, 'dist/src/index.d.ts')
  assert.equal(manifest.exports['.'].default, './dist/src/index.js')
  assert.equal(manifest.exports['.'].types, './dist/src/index.d.ts')
  assert.ok(existsSync(entry), 'compiled JavaScript runtime entrypoint missing')
  assert.ok(existsSync(declaration), 'compiled TypeScript declaration entrypoint missing')
})

test('actual compiled Content module imports and exposes a nonempty API', async () => {
  assert.ok(existsSync(entry), 'run npm run build before this test')
  const exports = await import(pathToFileURL(entry).href)
  const names = Object.keys(exports)
  assert.ok(names.length >= 12, 'compiled Content runtime API unexpectedly small')
  assert.ok(names.some(name => /content|registry|schema|localiz|memory|bundle/i.test(name)), 'expected Content runtime exports absent')
})
