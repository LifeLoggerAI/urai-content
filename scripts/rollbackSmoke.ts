const baseUrl = (process.env.URAI_CONTENT_BASE_URL ?? process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1])?.replace(/\/$/, '');
const expectedSha = process.env.URAI_EXPECTED_RELEASE_SHA ?? process.argv.find((arg) => arg.startsWith('--expected-sha='))?.split('=')[1];

if (!baseUrl) {
  console.error('Missing base URL. Provide URAI_CONTENT_BASE_URL or --base-url=https://example.com');
  process.exit(1);
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

const failures: string[] = [];

if (!baseUrl.startsWith('https://')) {
  failures.push(`${baseUrl} is not HTTPS`);
}

try {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  if (!healthResponse.ok) failures.push(`/api/health returned HTTP ${healthResponse.status}`);
} catch (error) {
  failures.push(`/api/health failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const version = await fetchJson('/api/version');
  const serialized = JSON.stringify(version);
  if (expectedSha && !serialized.includes(expectedSha)) {
    failures.push(`/api/version did not include expected rollback SHA ${expectedSha}`);
  }
} catch (error) {
  failures.push(`/api/version failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (failures.length > 0) {
  console.error('Rollback smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Rollback smoke check passed for ${baseUrl}.`);
if (expectedSha) console.log(`Expected rollback SHA observed: ${expectedSha}`);
