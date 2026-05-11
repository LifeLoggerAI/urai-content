import { implementedPublicRoutes } from '../src/lib/publicRoutes';

function getBaseUrl(): string {
  const argPrefix = '--base-url=';
  const cliValue = process.argv.find((arg) => arg.startsWith(argPrefix));

  if (cliValue) {
    return cliValue.slice(argPrefix.length);
  }

  return process.env.WEB_SMOKE_BASE_URL ?? 'http://localhost:3000';
}

const baseUrl = getBaseUrl();
const apiRoutes = ['/api/health', '/api/version', '/api/catalog', '/api/content', '/api/system/firebase'];
const metadataRoutes = ['/robots.txt', '/sitemap.xml'];
const routes = [...implementedPublicRoutes, ...metadataRoutes, ...apiRoutes];

async function checkRoute(route: string): Promise<void> {
  const response = await fetch(new URL(route, baseUrl));

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }

  console.log(`[OK] ${route} ${response.status}`);
}

async function main() {
  console.log(`Smoke testing ${routes.length} routes against ${baseUrl}`);

  for (const route of routes) {
    await checkRoute(route);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
