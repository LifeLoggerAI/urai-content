import { afterEach, describe, expect, it } from 'vitest';
import { GET as getAdminCreatorSubmissionQueue } from '../src/app/api/admin/creator-submissions/route';
import { POST as postCreatorSubmission } from '../src/app/api/creator/submissions/route';
import { POST as postModerateCreatorSubmission } from '../src/app/api/admin/creator-submissions/[id]/moderate/route';
import { resetRuntimeMemoryRepositoryForTests } from '../src/server/content/service';
import { setNodeEnvForTests } from './testEnv';

type ModerationRouteContext = Parameters<typeof postModerateCreatorSubmission>[1];

const originalNodeEnv = process.env.NODE_ENV;

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function adminHeaders() {
  return {
    'x-urai-user-id': 'admin-1',
    'x-urai-role': 'admin'
  };
}

function creatorHeaders(creatorId: string) {
  return {
    'content-type': 'application/json',
    'x-urai-user-id': creatorId,
    'x-urai-role': 'creator'
  };
}

async function createSubmission(id: string, creatorId: string) {
  await postCreatorSubmission(new Request('http://localhost/api/creator/submissions', {
    method: 'POST',
    headers: creatorHeaders(creatorId),
    body: JSON.stringify({
      id,
      creatorId,
      title: `Submission ${id}`,
      body: 'Ready for queue review.',
      contentType: 'story',
      tags: ['queue'],
      locale: 'en-US'
    })
  }));
}

async function moderateSubmission(id: string, decision: 'approved' | 'rejected' | 'changes_requested') {
  const context = { params: Promise.resolve({ id }) } satisfies ModerationRouteContext;
  await postModerateCreatorSubmission(new Request(`http://localhost/api/admin/creator-submissions/${id}/moderate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...adminHeaders()
    },
    body: JSON.stringify({ decision })
  }), context);
}

function queueRequest(search = '', headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/admin/creator-submissions${search}`, {
    headers
  });
}

afterEach(() => {
  setNodeEnvForTests(originalNodeEnv);
  resetRuntimeMemoryRepositoryForTests();
});

describe('admin creator submission queue route', () => {
  it('returns 401 when anonymous', async () => {
    const response = await getAdminCreatorSubmissionQueue(queueRequest());
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'unauthenticated', message: 'Authentication is required.' });
  });

  it('returns 403 for non-admin users', async () => {
    setNodeEnvForTests('test');

    const response = await getAdminCreatorSubmissionQueue(queueRequest('', {
      'x-urai-user-id': 'creator-1',
      'x-urai-role': 'creator'
    }));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden', message: 'You do not have permission to perform this action.' });
  });

  it('returns 400 for unsupported status filters', async () => {
    setNodeEnvForTests('test');

    const response = await getAdminCreatorSubmissionQueue(queueRequest('?status=published', adminHeaders()));
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'invalid_request', message: 'Creator submission queue requires a valid status and limit.' });
  });

  it('returns 400 for invalid limits', async () => {
    setNodeEnvForTests('test');

    const response = await getAdminCreatorSubmissionQueue(queueRequest('?limit=0', adminHeaders()));
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'invalid_request', message: 'Creator submission queue requires a valid status and limit.' });
  });

  it('returns a bounded admin queue', async () => {
    setNodeEnvForTests('test');
    await createSubmission('queue-submission-1', 'creator-1');
    await createSubmission('queue-submission-2', 'creator-2');

    const response = await getAdminCreatorSubmissionQueue(queueRequest('?limit=1', adminHeaders()));
    const body = await readJson(response) as { ok?: boolean; limit?: number; count?: number; submissions?: Array<{ id?: string }> };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.limit).toBe(1);
    expect(body.count).toBe(1);
    expect(body.submissions).toHaveLength(1);
  });

  it('filters the queue by moderation status', async () => {
    setNodeEnvForTests('test');
    await createSubmission('queue-submitted', 'creator-1');
    await createSubmission('queue-approved', 'creator-2');
    await moderateSubmission('queue-approved', 'approved');

    const response = await getAdminCreatorSubmissionQueue(queueRequest('?status=approved', adminHeaders()));
    const body = await readJson(response) as { ok?: boolean; status?: string; submissions?: Array<{ id?: string; status?: string }> };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.status).toBe('approved');
    expect(body.submissions).toEqual([expect.objectContaining({ id: 'queue-approved', status: 'approved' })]);
  });
});
