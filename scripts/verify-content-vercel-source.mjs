#!/usr/bin/env node
// Verify the actual Vercel artifact and the requested domain serve this exact
// GitHub commit. A healthy stale site is NOT proof of the just-built artifact.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const SHA = /^[a-f0-9]{40}$/;
const VERSION_BYTES = 16_384;

function checkedOrigin(raw, provider) {
  if (typeof raw !== 'string' || raw.length > 400) throw Error('CONTENT_RELEASE_URL_INVALID');
  let url;
  try { url = new URL(raw); } catch { throw Error('CONTENT_RELEASE_URL_INVALID'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.search || url.hash || (url.pathname !== '/' && url.pathname !== '') ||
      (raw !== url.origin && raw !== `${url.origin}/`)) throw Error('CONTENT_RELEASE_URL_INVALID');
  if (provider && !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(url.hostname)) {
    throw Error('CONTENT_RELEASE_PROVIDER_URL_INVALID');
  }
  if (!provider && (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.startsWith('['))) {
    throw Error('CONTENT_RELEASE_DOMAIN_INVALID');
  }
  return url.origin;
}

export async function verifyContentReleaseSources({ deploymentUrl, baseUrl, expectedSha, fetchImpl = fetch }) {
  if (typeof expectedSha !== 'string' || !SHA.test(expectedSha)) throw Error('CONTENT_RELEASE_SHA_INVALID');
  const deployed = checkedOrigin(deploymentUrl, true);
  const expected = checkedOrigin(baseUrl, false);
  const checked = [];
  for (const origin of new Set([deployed, expected])) {
    let response;
    try {
      response = await fetchImpl(`${origin}/api/version`, {
        method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000),
      });
    } catch { throw Error('CONTENT_RELEASE_VERSION_UNREACHABLE'); }
    if (!response || response.status !== 200 || response.redirected ||
        !/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) {
      throw Error('CONTENT_RELEASE_VERSION_RESPONSE_INVALID');
    }
    let version;
    let reader;
    try {
      // An untrusted server can stream more than Content-Length or omit it.
      // Never call response.text(): it buffers the entire body before we can
      // enforce VERSION_BYTES, making an oversized response a memory hazard.
      const advertised = response.headers.get('content-length');
      if (advertised !== null &&
          (!/^[0-9]{1,6}$/.test(advertised) || Number(advertised) > VERSION_BYTES)) {
        throw Error('invalid_length');
      }
      if (!response.body || typeof response.body.getReader !== 'function') throw Error('missing_body');
      reader = response.body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!(value instanceof Uint8Array)) throw Error('invalid_chunk');
        total += value.byteLength;
        if (total > VERSION_BYTES) throw Error('oversize');
        chunks.push(Buffer.from(value));
      }
      if (total === 0) throw Error('empty_body');
      version = JSON.parse(Buffer.concat(chunks, total).toString('utf8'));
    } catch { throw Error('CONTENT_RELEASE_VERSION_RESPONSE_INVALID'); }
    finally {
      if (reader) {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    }
    if (!version || typeof version !== 'object' || Array.isArray(version) ||
        version.service !== 'urai-content-web' || version.commitSha !== expectedSha) {
      throw Error('CONTENT_RELEASE_SOURCE_MISMATCH');
    }
    checked.push(origin);
  }
  return { expectedSha, checkedOrigins: checked };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await verifyContentReleaseSources({
      deploymentUrl: process.env.DEPLOYED_URL,
      baseUrl: process.env.EXPECTED_BASE_URL,
      expectedSha: process.env.GITHUB_SHA,
    });
    console.log(`PASS_CONTENT_EXACT_SOURCE sha=${result.expectedSha} origins=${result.checkedOrigins.length}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'CONTENT_RELEASE_SOURCE_UNVERIFIED');
    process.exitCode = 1;
  }
}
