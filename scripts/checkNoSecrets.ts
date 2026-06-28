import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.next', 'coverage', '.turbo', '.idx']);
const ignoredExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.pdf', '.zip', '.gz', '.mp4', '.mov', '.mp3', '.wav']);
const ignoredFiles = new Set(['scripts/checkNoSecrets.ts', 'apps/web/.env.local', '.env.local']);
const allowedDummySecretValues = new Set(['0123456789abcdef']);

const suspiciousPatterns: Array<[string, RegExp]> = [
  ['Firebase private key', /-----BEGIN PRIVATE KEY-----/],
  ['Google service account JSON', /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/],
  ['Stripe secret key', /sk_(live|test)_[A-Za-z0-9]{12,}/],
  ['Stripe restricted key', /rk_(live|test)_[A-Za-z0-9]{12,}/],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9_]{20,}/],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{20,}/],
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['Generic API key assignment', /(api[_-]?key|secret|token|password)\s*=\s*['"][^'"\n]{16,}['"]/i]
];

function shouldSkip(path: string): boolean {
  const parts = path.split('/');
  if (parts.some((part) => ignoredDirs.has(part))) return true;
  if (ignoredFiles.has(path)) return true;
  if (path.endsWith('.env.local')) return true;
  return [...ignoredExtensions].some((ext) => path.endsWith(ext));
}

function redactAllowedDummyFixtures(content: string): string {
  let redacted = content;
  for (const value of allowedDummySecretValues) {
    redacted = redacted.replaceAll(value, 'redacted');
  }
  return redacted;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = relative(root, abs).replaceAll('\\', '/');
    if (shouldSkip(rel)) continue;
    const stats = statSync(abs);
    if (stats.isDirectory()) {
      files.push(...walk(abs));
    } else if (stats.isFile()) {
      files.push(abs);
    }
  }
  return files;
}

const failures: string[] = [];

for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/');
  let content = '';
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const contentToScan = redactAllowedDummyFixtures(content);
  for (const [name, pattern] of suspiciousPatterns) {
    if (pattern.test(contentToScan)) {
      failures.push(`${rel}: possible ${name}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Secret leakage check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Secret leakage check passed.');
