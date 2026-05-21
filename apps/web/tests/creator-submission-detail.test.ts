import { afterEach, describe, expect, it } from 'vitest';
import { GET as getCreatorSubmission } from '../src/app/api/creator/submissions/[id]/route';
import { POST as postCreatorSubmission } from '../src/app/api/creator/submissions/route';
import { resetRuntimeMemoryRepositoryForTests } from '../src/server/content/service';
import { setNodeEnvForTests } from './testEnv';

type DetailRouteContext = Parameters<typeof getCreatorSubmission>[1];

const originalNodeEnv = process.env.NODE_ENV;

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function context(id = 'detail-submission-1'): DetailRouteContext {
  return { params: Promise.resolve({ id }) };
}

async function createSubmission(id = 'detail-submission-1', creatorId = 'creator-1') {
  setNodeEnvForTests('test');
  await postCreatorSubmission(new Request('http://localhost/api/creator/submissions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-urai-user-id': creatorId,
      'x-urai-role': 'creator'
    },
    body: JSON.stringify({
      id,
      creatorId,
      title: 'Detail Submission',
      body: 'Ready for review.',
      contentType: 'story',
      tags: ['review'],
      locale: 'en-US'
    })
  }));
}

afterEach(() => {
  setNodeEnvForTests(originalNodeEnv);
  resetRuntimeMemoryRepositoryForTests();
});

describe('creator submission detail route', () => {
  it('returns 404 when the submission does not exist', async () => {
    const response = await getCreatorSubmission(new Request('http://localhost/api/creator/submissions/missing'), context('missing'));
    const body = await readJson(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'not_found', message: 'Creator submission not found.' });
  });

  it('returns 401 for anonymous access to an existing submission', async () => {
    await createSubmission();

    const response = await getCreatorSubmission(new Request('http://localhost/api/creator/submissions/detail-submission-1'), context());
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 when a creator reads another creator submission', async () => {
    await createSubmission();

    const response = await getCreatorSubmission(new Request('http://localhost/api/creator/submissions/detail-submission-1', {
      headers: {
        'x-urai-user-id': 'creator-2',
        'x-urai-role': 'creator'
      }
    }), context());
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('returns the submission for the owning creator', async () => {
    await createSubmission();

    const response = await getCreatorSubmission(new Request('http://localhost/api/creator/submissions/detail-submission-1', {
      headers: {
        'x-urai-user-id': 'creator-1',
        'x-urai-role': 'creator'
      }
    }), context());
    const body = await readJson(response) as { ok?: boolean; submission?: { id?: string; creatorId?: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.submission).toMatchObject({ id: 'detail-submission-1', creatorId: 'creator-1' });
  });

  it('allows admin access to a creator submission', async () => {
    await createSubmission();

    const response = await getCreatorSubmission(new Request('http://localhost/api/creator/submissions/detail-submission-1', {
      headers: {
        'x-urai-user-id': 'admin-1',
        'x-urai-role': 'admin'
      }
    }), context());
    const body = await readJson(response) as { ok?: boolean; submission?: { id?: string; creatorId?: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.submission).toMatchObject({ id: 'detail-submission-1', creatorId: 'creator-1' });
  });
});
