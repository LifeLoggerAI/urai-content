const rawBaseUrl = process.env.URAI_CONTENT_BASE_URL ?? process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1];

if (!rawBaseUrl) {
  console.error('Missing base URL. Provide URAI_CONTENT_BASE_URL or --base-url=https://example.com');
  process.exit(1);
}

const baseUrl = rawBaseUrl.replace(/\/$/, '');
const requiredPaths = [
  '/',
  '/api/health',
  '/api/version',
  '/robots.txt',
  '/sitemap.xml'
];

function urlFor(path: string): string {
  return `${baseUrl}${path}`;
}

async function check(path: string): Promise<string | null> {
  const url = urlFor(path);
  try {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status >= 200 && response.status < 400) {
      return null;
    }
    return `${url} returned HTTP ${response.status}`;
  } catch (error) {
    return `${url} failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const failures: string[] = [];

for (const path of requiredPaths) {
  const failure = await check(path);
  if (failure) failures.push(failure);
}

if (!baseUrl.startsWith('https://')) {
  failures.push(`${baseUrl} is not HTTPS`);
}

if (failures.length > 0) {
  console.error('Production smoke check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Production smoke check passed for ${baseUrl}.`);
for (const path of requiredPaths) {
  console.log(`- ${urlFor(path)}`);
}
