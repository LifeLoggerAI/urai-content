// Test-only fetch stub. Never performs network requests.
const config = JSON.parse(process.env.URAI_ROLLBACK_FIXTURE || '{}');
const seen = [];
globalThis.fetch = async (url, options) => {
  const parsed = new URL(url);
  seen.push({ path: parsed.pathname, origin: parsed.origin });
  if (options?.redirect !== 'error' || options?.cache !== 'no-store') {
    throw new Error('REQUEST_NOT_PROTECTED');
  }
  if (parsed.origin !== 'https://candidate.example.test') {
    throw new Error('UNEXPECTED_ORIGIN');
  }
  const descriptor = config[parsed.pathname];
  if (!descriptor) throw new Error('NO_FIXTURE_FOR_PATH');
  if (descriptor.throw) throw new Error(descriptor.throw);
  const body = Object.hasOwn(descriptor, 'raw') ? descriptor.raw : JSON.stringify(descriptor.body);
  const headers = {
    'content-type': descriptor.contentType || 'application/json',
    ...(descriptor.contentLength ? { 'content-length': descriptor.contentLength } : {}),
  };
  const response = new Response(body, { status: descriptor.status || 200, headers });
  if (descriptor.redirected) Object.defineProperty(response, 'redirected', { value: true });
  return response;
};
process.on('exit', () => {
  if (config.expectedRequests) {
    const actual = seen.map((item) => item.path);
    if (actual.join(',') !== config.expectedRequests.join(',')) process.exitCode = 76;
  }
});
