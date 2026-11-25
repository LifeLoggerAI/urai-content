import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

test('an installed tarball loads its own canonical registry from a consuming app', async () => {
  const temp = mkdtempSync(resolve(tmpdir(), 'urai-content-consumer-'))
  const consumer = resolve(temp, 'app')
  const npm = process.env.npm_execpath
  const runNpm = (args, cwd) => execFileSync(npm ? process.execPath : 'npm', npm ? [npm, ...args] : args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  })
  try {
    mkdirSync(consumer)
    writeFileSync(resolve(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
    const [packed] = JSON.parse(runNpm(['pack', '--ignore-scripts', '--json', '--pack-destination', temp], root))
    runNpm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock',
      resolve(temp, packed.filename), resolve(root, 'node_modules/zod')], consumer)

    const probe = ['--input-type=module', '-e', "import { registry } from 'urai-content'; console.log(JSON.stringify(registry))"]
    const readInstalledRegistry = () => JSON.parse(execFileSync(process.execPath, probe, { cwd: consumer, encoding: 'utf8' }))
    const { registry } = await import(pathToFileURL(entry).href)
    assert.deepEqual(readInstalledRegistry(), registry)

    const consumerPages = resolve(consumer, 'content/pages')
    mkdirSync(consumerPages, { recursive: true })
    writeFileSync(resolve(consumerPages, 'home.json'), JSON.stringify({ id: 'consumer-home' }))
    assert.deepEqual(readInstalledRegistry(), registry)
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})
