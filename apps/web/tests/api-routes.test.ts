import { afterEach, describe, expect, it } from 'vitest';

import { GET as getCatalog } from '../src/app/api/catalog/route';
import { GET as getContent } from '../src/app/api/content/[[...slug]]/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { POST as postModerateCreatorSubmission } from '../src/app/api/admin/creator-submissions/[id]/moderate/route';
import { POST as postSeedCanonicalContent } from '../src/app/api/admin/seed/canonical-content/route';
import { GET as getCreatorSubmissions, POST as postCreatorSubmission } from '../src/app/api/creator/submissions/route';
import { GET as getVersion } from '../src/app/api/version/route';

type ContentRouteContext = Parameters<typeof getContent>[1];
type ModerationRouteContext = Parameters<typeof postModerateCreatorSubmission>[1];

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
    expect(body).toMatchObject({ ok: true, service: 'urai-content-web', status: 'healthy' });
    expect(typeof (body as { timestamp?: unknown }).timestamp).toBe('string');
  });

  it('returns version metadata with environment and package identity', async () => {
    const response = getVersion();
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ service: 'urai-content-web', appVersion: '0.1.0', packageName: 'urai-content' });
    expect(typeof (body as { environment?: unknown }).environment).toBe('string');
  });

  it('returns catalog summaries and count', async () => {
    const response = await getCatalog();
    const body = await readJson(response) as { source?: string; count?: number; items?: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.source).toBe('canonical-json');
    expect(body.count).toBe(body.items?.length);
    expect(body.items?.some((item) => item.id === 'page-home')).toBe(true);
  });

  it('returns public content detail by slug', async () => {
    const context = { params: Promise.resolve({ slug: ['privacy'] }) } satisfies ContentRouteContext;
    const response = await getContent(new Request('http://localhost/api/content/privacy'), context);
    const body = await readJson(response) as { item?: { id?: string } };

    expect(response.status).toBe(200);
    expect(body.item?.id).toBe('page-privacy');
  });

  it('returns 404 for missing or non-public content detail', async () => {
    const context = { params: Promise.resolve({ slug: ['does-not-exist'] }) } satisfies ContentRouteContext;
    const response = await getContent(new Request('http://localhost/api/content/does-not-exist'), context);
    const body = await readJson(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({ source: 'canonical-json', error: 'not_found', message: 'Content item not found or not public.' });
  });
});

describe('admin canonical seed API route authorization', () => {
  it('returns 401 when no seed token or session is provided', async () => {
    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', { method: 'POST' }));
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 for a non-admin session', async () => {
    process.env.NODE_ENV = 'test';

    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST', headers: { 'x-urai-user-id': 'user-1', 'x-urai-role': 'user' }
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
      method: 'POST', headers: { 'x-urai-user-id': 'admin-1', 'x-urai-role': 'admin' }
    }));
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: 'firebase_not_configured', message: 'Firebase Admin must be configured before canonical content can be seeded.' });
  });

  it('preserves seed-token authorization for automation clients', async () => {
    process.env.URAI_CONTENT_SEED_TOKEN = '0123456789abcdef';
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const response = await postSeedCanonicalContent(new Request('http://localhost/api/admin/seed/canonical-content', {
      method: 'POST', headers: { authorization: 'Bearer 0123456789abcdef' }
    }));
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: 'firebase_not_configured', message: 'Firebase Admin must be configured before canonical content can be seeded.' });
  });
});

describe('creator submissions API route authorization', () => {
  const validSubmissionBody = {
    id: 'submission-1', creatorId: 'creator-1', title: 'Moonlit Ritual Draft', body: 'A creator-owned content submission.',
    contentType: 'story', tags: ['moonlit'], locale: 'en-US'
  };

  function makeCreatorPostRequest(body: unknown, headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/creator/submissions', {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body)
    });
  }

  function makeCreatorGetRequest(headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/creator/submissions', { method: 'GET', headers });
  }

  it('returns 400 for invalid submission bodies before auth work', async () => {
    const response = await postCreatorSubmission(makeCreatorPostRequest({ creatorId: 'creator-1' }));
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'invalid_request', message: 'Creator submissions require a valid JSON body.' });
  });

  it('returns 401 for anonymous creator submissions', async () => {
    const response = await postCreatorSubmission(makeCreatorPostRequest(validSubmissionBody));
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 for non-creator users', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postCreatorSubmission(makeCreatorPostRequest(validSubmissionBody, { 'x-urai-user-id': 'creator-1', 'x-urai-role': 'user' }));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('returns 403 when a creator submits for another creator', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postCreatorSubmission(makeCreatorPostRequest(validSubmissionBody, { 'x-urai-user-id': 'different-creator', 'x-urai-role': 'creator' }));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('creates a submission for a creator submitting for themselves', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postCreatorSubmission(makeCreatorPostRequest(validSubmissionBody, { 'x-urai-user-id': 'creator-1', 'x-urai-role': 'creator' }));
    const body = await readJson(response) as { ok?: boolean; submission?: { id?: string; creatorId?: string; status?: string } };

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.submission).toMatchObject({ id: 'submission-1', creatorId: 'creator-1', status: 'submitted' });
  });

  it('returns 401 when listing submissions anonymously', async () => {
    const response = await getCreatorSubmissions(makeCreatorGetRequest());
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 when listing submissions as a non-creator user', async () => {
    process.env.NODE_ENV = 'test';
    const response = await getCreatorSubmissions(makeCreatorGetRequest({ 'x-urai-user-id': 'user-1', 'x-urai-role': 'user' }));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('lists only the current creator submissions', async () => {
    process.env.NODE_ENV = 'test';

    await postCreatorSubmission(makeCreatorPostRequest(validSubmissionBody, { 'x-urai-user-id': 'creator-1', 'x-urai-role': 'creator' }));
    await postCreatorSubmission(makeCreatorPostRequest({ ...validSubmissionBody, id: 'submission-2', creatorId: 'creator-2' }, { 'x-urai-user-id': 'creator-2', 'x-urai-role': 'creator' }));

    const response = await getCreatorSubmissions(makeCreatorGetRequest({ 'x-urai-user-id': 'creator-1', 'x-urai-role': 'creator' }));
    const body = await readJson(response) as { ok?: boolean; creatorId?: string; count?: number; submissions?: Array<{ id?: string; creatorId?: string }> };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.creatorId).toBe('creator-1');
    expect(body.count).toBe(body.submissions?.length);
    expect(body.submissions?.every((item) => item.creatorId === 'creator-1')).toBe(true);
  });
});

describe('admin creator submission moderation API route authorization', () => {
  const context = { params: Promise.resolve({ id: 'moderation-submission-1' }) } satisfies ModerationRouteContext;

  function makeModerationRequest(body: unknown, headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/admin/creator-submissions/moderation-submission-1/moderate', {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body)
    });
  }

  async function createModerationFixture() {
    process.env.NODE_ENV = 'test';
    await postCreatorSubmission(new Request('http://localhost/api/creator/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-urai-user-id': 'creator-1', 'x-urai-role': 'creator' },
      body: JSON.stringify({
        id: 'moderation-submission-1', creatorId: 'creator-1', title: 'Moderation Draft', body: 'Ready for moderation.',
        contentType: 'story', tags: ['review'], locale: 'en-US'
      })
    }));
  }

  it('returns 401 when moderation is anonymous', async () => {
    const response = await postModerateCreatorSubmission(makeModerationRequest({ decision: 'approved' }), context);
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 when moderation is attempted by a non-admin', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postModerateCreatorSubmission(makeModerationRequest({ decision: 'approved' }, { 'x-urai-user-id': 'creator-1', 'x-urai-role': 'creator' }), context);
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('returns 400 for invalid moderation decisions', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postModerateCreatorSubmission(makeModerationRequest({ decision: 'publish' }, { 'x-urai-user-id': 'admin-1', 'x-urai-role': 'admin' }), context);
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'invalid_request', message: 'Moderation requires a valid JSON body with a supported decision.' });
  });

  it('returns 404 when the target submission does not exist', async () => {
    process.env.NODE_ENV = 'test';
    const response = await postModerateCreatorSubmission(makeModerationRequest({ decision: 'approved' }, { 'x-urai-user-id': 'admin-1', 'x-urai-role': 'admin' }), context);
    const body = await readJson(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'not_found', message: 'Creator submission not found.' });
  });

  it('moderates an existing creator submission as an admin', async () => {
    await createModerationFixture();

    const response = await postModerateCreatorSubmission(makeModerationRequest({ decision: 'approved', notes: 'Looks good.' }, { 'x-urai-user-id': 'admin-1', 'x-urai-role': 'admin' }), context);
    const body = await readJson(response) as { ok?: boolean; submission?: { id?: string; status?: string; moderatedBy?: string; moderationNotes?: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.submission).toMatchObject({
      id: 'moderation-submission-1', status: 'approved', moderatedBy: 'admin-1', moderationNotes: 'Looks good.'
    });
  });
});
