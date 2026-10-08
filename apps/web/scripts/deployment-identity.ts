export interface DeploymentIdentityReceipt {
  origin: string;
  service: 'urai-content-web';
  packageName: 'urai-content';
  commitSha: string;
}

export function getDeploymentOrigin(baseUrl: string): { origin: string; remote: boolean } {
  const url = new URL(baseUrl);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Deployment base URL must be an origin without credentials, path, query or fragment.');
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error('Deployment base URL must use HTTPS; HTTP is allowed only for local loopback checks.');
  }
  return { origin: url.origin, remote: !loopback };
}

export async function verifyDeploymentIdentity(baseUrl: string, expectedSha: string): Promise<DeploymentIdentityReceipt> {
  if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error('Deployment identity verification requires a complete lowercase expected Git SHA.');
  }
  const { origin } = getDeploymentOrigin(baseUrl);
  const response = await fetch(new URL('/api/version', origin), {
    redirect: 'error',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`/api/version returned ${response.status}.`);
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('/api/version did not return JSON.');
  }
  const value: unknown = await response.json();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('/api/version returned an invalid identity.');
  }
  const identity = value as Record<string, unknown>;
  if (identity.service !== 'urai-content-web' || identity.packageName !== 'urai-content') {
    throw new Error('/api/version belongs to another service.');
  }
  if (identity.commitSha !== expectedSha) {
    throw new Error('/api/version does not match the requested Content source.');
  }
  if (identity.environment !== 'production') {
    throw new Error('/api/version is not a production-built Content runtime.');
  }
  return { origin, service: 'urai-content-web', packageName: 'urai-content', commitSha: expectedSha };
}

export async function verifyAnonymousReadBoundaries(baseUrl: string): Promise<void> {
  const { origin } = getDeploymentOrigin(baseUrl);
  for (const route of ['/api/admin/creator-submissions', '/api/creator/submissions']) {
    const response = await fetch(new URL(route, origin), {
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000)
    });
    if (response.status !== 401) throw new Error(`Anonymous ${route} did not return the required 401 denial.`);
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value) || (value as Record<string, unknown>).error !== 'unauthenticated') {
      throw new Error(`Anonymous ${route} did not return its authentication denial.`);
    }
  }
  const missing = await fetch(new URL('/__urai_content_unimplemented_route__', origin), {
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  if (missing.status !== 404) throw new Error('Unimplemented Content routes must return 404.');
}
