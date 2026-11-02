#!/usr/bin/env node
// A source/artifact preflight, not a deployment or production release receipt.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRoot = resolve(fileURLToPath(new URL('../', import.meta.url)))
const args = process.argv.slice(2)
let sourceRoot = defaultRoot
let built = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source-root' && args[i + 1]) sourceRoot = resolve(args[++i])
  else if (args[i] === '--built') built = true
  else throw Error(`UNKNOWN_OPTION:${args[i]}`)
}

const packagePath = join(sourceRoot, 'package.json')
if (!existsSync(packagePath)) {
  if (existsSync(join(sourceRoot, 'src', 'package.json')) && existsSync(join(sourceRoot, 'src', 'next.config.mjs'))) {
    throw Error('WRAPPED_SOURCE_ROOT:the Next.js app is nested under src/; select the web app directory as the deployment root')
  }
  throw Error('MISSING_WEB_PACKAGE_ROOT:expected package.json at the deployment root')
}
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
if (pkg.name !== 'urai-content-web' || pkg.scripts?.build !== 'next build') {
  throw Error('WRONG_WEB_PACKAGE:expected urai-content-web with its original Next.js build command')
}
for (const required of ['next.config.mjs', join('src', 'app')]) {
  if (!existsSync(join(sourceRoot, required))) throw Error(`MISSING_WEB_APP_COMPONENT:${required}`)
}
if (!statSync(join(sourceRoot, 'src', 'app')).isDirectory()) throw Error('INVALID_WEB_APP_DIRECTORY')
if (built) {
  const manifest = join(sourceRoot, '.next', 'routes-manifest.json')
  if (!existsSync(manifest)) throw Error('MISSING_NEXT_ROUTES_MANIFEST:require a Next.js build in the selected web app root')
  try { JSON.parse(readFileSync(manifest, 'utf8')) }
  catch { throw Error('INVALID_NEXT_ROUTES_MANIFEST') }
}
console.log(`PASS_WEB_DEPLOY_PAYLOAD root=${sourceRoot} built=${built}`)
