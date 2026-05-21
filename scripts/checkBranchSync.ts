import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function run(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const branch = run('git branch --show-current');
const status = run('git status --short --branch');
const smokeScript = readFileSync('apps/web/scripts/smoke-routes.ts', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const hasManagedSmoke = smokeScript.includes('No server detected') && smokeScript.includes('startServer');
const rootBuildsBeforeSmoke = packageJson.includes('"web:smoke:routes": "npm run web:build && npm run smoke:routes --prefix apps/web"');

console.log(JSON.stringify({
  branch,
  status,
  hasManagedSmoke,
  rootBuildsBeforeSmoke,
  expectedBranch: 'feat/complete-public-route-shells',
  nextCommands: [
    'git fetch origin',
    'git pull --rebase origin feat/complete-public-route-shells',
    'npm run branch:sync:check',
    'npm run web:smoke:routes'
  ]
}, null, 2));

if (!hasManagedSmoke || !rootBuildsBeforeSmoke) {
  process.exitCode = 1;
}
