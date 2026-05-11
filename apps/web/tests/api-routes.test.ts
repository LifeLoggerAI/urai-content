import { describe, expect, it } from 'vitest';

import { GET as getCatalog } from '../src/app/api/catalog/route';
import { GET as getContent } from '../src/app/api/content/[[...slug]]/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getVersion } from '../src/app/api/version/route';

type ContentRouteContext = Parameters<typeof getContent>[1];

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

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
