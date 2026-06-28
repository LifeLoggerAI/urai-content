import { afterEach, describe, expect, it } from 'vitest';

import { POST as postCreatorSubmission } from '../src/app/api/creator/submissions/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getFirebaseStatus } from '../src/app/api/system/firebase/route';
import { getRuntimePersistenceStatus } from '../src/server/content/service';
import { setNodeEnvForTests } from './testEnv';

const originalNodeEnv = process.env.NODE_ENV;
const originalHeaderAuth = process.env.URAI_ENABLE_HEADER_AUTH;
const originalProjectId = process.env.FIREBASE_PROJECT_ID;
const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

function restoreEnv() {
  setNodeEnvForTests(originalNodeEnv);

  if (originalHeaderAuth === undefined) delete process.env.URAI_ENABLE_HEADER_AUTH;
  else process.env.URAI_ENABLE_HEADER_AUTH = originalHeaderAuth;

  if (originalProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
  else process.env.FIREBASE_PROJECT_ID = originalProjectId;

  if (originalClientEmail === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
  else process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;

  if (originalPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
  else process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
}

function clearFirebaseAdminEnv() {
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

afterEach(() => {
  restoreEnv();
});

describe('runtime persistence status', () => {
  it('allows non-durable memory persistence only outside production', () => {
    setNodeEnvForTests('test');
    clearFirebaseAdminEnv();

    expect(getRuntimePersistenceStatus()).toMatchObject({
      mode: 'memory',
      writable: true,
      previewMode: true,
      productionSafe: true
    });
  });

  it('fails closed for production writes when Firebase Admin is absent', () => {
    setNodeEnvForTests('production');
    clearFirebaseAdminEnv();

    expect(getRuntimePersistenceStatus()).toMatchObject({
      mode: 'memory',
      writable: false,
      previewMode: true,
      productionSafe: false
    });
  });

  it('exposes degraded persistence in health and Firebase status responses', async () => {
    setNodeEnvForTests('production');
    clearFirebaseAdminEnv();

    const health = await readJson(getHealth()) as { ok?: boolean; status?: string; persistence?: { writable?: boolean } };
    const firebase = await readJson(getFirebaseStatus()) as { productionSafe?: boolean; persistenceWritable?: boolean; runtimeContentMode?: string };

    expect(health.ok).toBe(false);
    expect(health.status).toBe('degraded');
    expect(health.persistence?.writable).toBe(false);
    expect(firebase.runtimeContentMode).toBe('memory');
    expect(firebase.persistenceWritable).toBe(false);
    expect(firebase.productionSafe).toBe(false);
  });

  it('returns 503 instead of accepting creator submissions into memory in production', async () => {
    setNodeEnvForTests('production');
    process.env.URAI_ENABLE_HEADER_AUTH = '1';
    clearFirebaseAdminEnv();

    const response = await postCreatorSubmission(new Request('http://localhost/api/creator/submissions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-urai-user-id': 'creator-1',
        'x-urai-role': 'creator'
      },
      body: JSON.stringify({
        creatorId: 'creator-1',
        title: 'Production Persistence Gate',
        body: 'This submission must not be accepted into non-durable memory persistence in production.',
        contentType: 'story',
        tags: ['persistence'],
        locale: 'en-US'
      })
    }));
    const body = await readJson(response) as { error?: string; persistence?: { writable?: boolean } };

    expect(response.status).toBe(503);
    expect(body.error).toBe('persistence_not_configured');
    expect(body.persistence?.writable).toBe(false);
  });
});
