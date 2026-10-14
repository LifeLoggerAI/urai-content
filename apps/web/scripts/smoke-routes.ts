import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { implementedPublicRoutes } from '../src/lib/publicRoutes';
import { getDeploymentOrigin, verifyAnonymousReadBoundaries, verifyDeploymentIdentity } from './deployment-identity';

function getCliValue(name: string): string | undefined {
  const argPrefix = `--${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(argPrefix));

  if (inlineValue) {
    return inlineValue.slice(argPrefix.length);
  }

  const valueIndex = process.argv.indexOf(`--${name}`);
  if (valueIndex >= 0) {
    return process.argv[valueIndex + 1];
  }

  return undefined;
}

const cliBaseUrl = getCliValue('base-url') ?? process.env.npm_config_base_url;
const port = Number(getCliValue('port') ?? process.env.npm_config_port ?? process.env.WEB_SMOKE_PORT ?? 3000);
const baseUrl = cliBaseUrl ?? process.env.WEB_SMOKE_BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldManageServer = !cliBaseUrl && !process.env.WEB_SMOKE_BASE_URL && process.env.WEB_SMOKE_MANAGE_SERVER !== 'false';
const expectedSha = getCliValue('expected-sha') ?? process.env.WEB_SMOKE_EXPECTED_SHA ?? process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;
const deploymentOrigin = getDeploymentOrigin(baseUrl);
const apiRoutes = ['/api/health', '/api/version', '/api/catalog', '/api/content', '/api/system/firebase'];
const metadataRoutes = ['/robots.txt', '/sitemap.xml'];
const routes = [...implementedPublicRoutes, ...metadataRoutes, ...apiRoutes];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionFailure(error: unknown): boolean {
  return error instanceof Error && /ECONNREFUSED|fetch failed/i.test(error.message + ' ' + String((error as { cause?: unknown }).cause ?? ''));
}

async function probeServer(): Promise<boolean> {
  try {
    const response = await fetch(new URL('/api/health', baseUrl));
    return response.ok;
  } catch (error) {
    if (isConnectionFailure(error)) return false;
    throw error;
  }
}

function startServer(): ChildProcess {
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmBin, ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  child.stdout?.on('data', (chunk) => process.stdout.write(`[next] ${chunk}`));
  child.stderr?.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));
  child.on('error', (error) => {
    console.error(`Unable to start Next smoke server with ${npmBin}: ${error.message}`);
  });

  return child;
}

async function waitForServer(timeoutMs = 30000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await probeServer()) return;
    await sleep(750);
  }

  throw new Error(`Timed out waiting for Next server at ${baseUrl}. Run npm run build --prefix apps/web before smoke testing.`);
}

async function checkRoute(route: string): Promise<void> {
  const response = await fetch(new URL(route, baseUrl));

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }

  console.log(`[OK] ${route} ${response.status}`);
}

async function main() {
  if (deploymentOrigin.remote && !expectedSha) {
    throw new Error('Remote route smoke requires --expected-sha or WEB_SMOKE_EXPECTED_SHA.');
  }
  console.log(`Smoke testing ${routes.length} routes against ${baseUrl}`);

  let server: ChildProcess | null = null;

  if (!(await probeServer())) {
    if (!shouldManageServer) {
      throw new Error(`No server is listening at ${baseUrl}. Start the web app or omit --base-url / WEB_SMOKE_BASE_URL so this script can manage Next locally.`);
    }

    console.log(`No server detected at ${baseUrl}; starting Next locally for smoke test.`);
    server = startServer();
    await waitForServer();
  }

  try {
    if (expectedSha) {
      const receipt = await verifyDeploymentIdentity(baseUrl, expectedSha);
      console.log(`[IDENTITY] ${JSON.stringify(receipt)}`);
    }
    for (const route of routes) {
      await checkRoute(route);
    }
    await verifyAnonymousReadBoundaries(baseUrl);
    console.log('[OK] Anonymous Admin/creator reads denied and unknown route returned 404.');
  } finally {
    if (server) {
      if (process.platform === 'win32' && server.pid) {
        spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        server.kill('SIGTERM');
      }
      server.stdout?.destroy();
      server.stderr?.destroy();
      server.unref();
    }
  }
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
