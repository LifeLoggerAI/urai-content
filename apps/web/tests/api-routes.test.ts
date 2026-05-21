import { afterEach, describe, expect, it } from 'vitest';

import { GET as getCatalog } from '../src/app/api/catalog/route';
import { GET as getContent } from '../src/app/api/content/[[...slug]]/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { POST as postSeedCanonicalContent } from '../src/app/api/admin/seed/canonical-content/route';
import { GET as getVersion } from '../src/app/api/version/route';

type ContentRouteContext = Parameters<typeof getContent>[1];

const originalNodeEnv = process.env.NODE_ENV;
const originalHeaderAuth = process.env.URAI_ENABLE_HEADER_AUTH;
const originalSeedToken = process.env.URAI_CONTENT_SEED_TOKEN;
const originalProjectId = process.env.FIREBASE_PROJECT_ID;
const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function restoreEnv() {
  process.env.NODE_ENV = originalNodeEnv;

  if (originalHeaderAuth === undefined) delete process.env.URAI_ENABLE_HEADER_AUTH;
  else process.env.URAI_ENABLE_HEADER_AUTH = originalHeaderAuth;

  if (originalSeedToken === undefined) delete process.env.URAI_CONTENT_SEED_TOKEN;
  else process.env.URAI_CONTENT_SEED_TOKEN = originalSeedToken;

  if (originalProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
  else process.env.FIREBASE_PROJECT_ID = originalProjectId;

  if (originalClientEmail === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
  else process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;

  if (originalPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
  else process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
}

afterEach(() => {
  restoreEnv();
});

describe('runtime API route handlers', () => {
  it('returns health status with service metadata', async () => {
    const response = getHealth();
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      service: 'urai-content-web',
      status: 'healthy'
    });
    expect(typeof (body as { timestamp?: unknown }).timestamp).toBe('string');
  });

  it('returns version metadata with environment and package identity', async () => {
    const response = getVersion();
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      service: 'urai-content-web',
      appVersion: '0.1.0',
      packageName: 'urai-content'
    });
    expect(typeof (body as { environment?: unknown }).environment).toBe('string');
  });

  it('returns catalog summaries and count', async () => {
    const response = await getCatalog();
    const body = await readJson(response) as {
      source?: string;
      count?: number;
      items?: Array<{ id: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.source).toBe('canonical-json');
    expect(body.count).toBe(body.items?.length);
    expect(body.items?.some((item) => item.id === 'page-home')).toBe(true);
  });

  it('returns public content detail by slug', async () => {
    const context = {
      params: Promise.resolve({ slug: ['privacy'] })
    } satisfies ContentRouteContext;

    const response = await getContent(new Request('http://localhost/api/content/privacy'), context);
    const body = await readJson(response) as { item?: { id?: string } };

    expect(response.status).toBe(200);
    expect(body.item?.id).toBe('page-privacy');
  });

  it('returns 404 for missing or non-public content detail', async () => {
    const context = {
      params: Promise.resolve({ slug: ['does-not-exist'] })
    } satisfies ContentRouteContext;

    const response = await getContent(new Request('http://localhost/api/content/does-not-exist'), context);
    const body = await readJson(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      source: 'canonical-json',
      error: 'not_found',
      message: 'Content item not found or not public.'
    });
  });
});

describe('admin canonical seed API route authorization', () => {
  it('returns 401 when no seed token or session is provided', async () => {
    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST'
    }));
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 for a non-admin session', async () => {
    process.env.NODE_ENV = 'test';

    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST',
      headers: {
        'x-urai-user-id': 'user-1',
        'x-urai-role': 'user'
      }
    }));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('allows admin authorization before failing on missing Firebase configuration', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST',
      headers: {
        'x-urai-user-id': 'admin-1',
        'x-urai-role': 'admin'
      }
    }));
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: 'firebase_not_configured',
      message: 'Firebase Admin must be configured before canonical content can be seeded.'
    });
  });

  it('preserves seed-token authorization for automation clients', async () => {
    process.env.URAI_CONTENT_SEED_TOKEN = '0123456789abcdef';
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST',
      headers: {
        authorization: 'Bearer 0123456789abcdef'
      }
    }));
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: 'firebase_not_configured',
      message: 'Firebase Admin must be configured before canonical content can be seeded.'
    });
  });
});
