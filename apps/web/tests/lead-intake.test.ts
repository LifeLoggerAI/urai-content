import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistence = vi.hoisted(() => ({
  configured: false,
  fail: false,
  operations: [] as Array<{ collection: string; value: Record<string, unknown> }>,
  committed: false
}));

vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => persistence.configured,
  getFirebaseAdminDb: () => ({
    collection: (name: string) => ({ doc: () => ({ collection: name }) }),
    batch: () => ({
      create: (reference: { collection: string }, value: Record<string, unknown>) => persistence.operations.push({ collection: reference.collection, value }),
      commit: async () => {
        if (persistence.fail) throw new Error('private-provider-detail');
        persistence.committed = true;
      }
    })
  })
}));

import { POST } from '../src/app/api/leads/route';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://uraicontent.com/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
}

describe('durable Content intake', () => {
  beforeEach(() => {
    persistence.configured = false;
    persistence.fail = false;
    persistence.operations = [];
    persistence.committed = false;
  });

  it('refuses success when persistence is unavailable', async () => {
    const response = await POST(request({ email: 'partner@example.test', leadType: 'partner' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, stored: false });
    expect(persistence.operations).toEqual([]);
  });

  it('atomically persists licensing partner intake and strips referring query/fragment data', async () => {
    persistence.configured = true;
    const response = await POST(request({ email: 'Partner@Example.test', leadType: 'partner', message: 'License the reviewed asset.' }, {
      origin: 'https://uraicontent.com',
      referer: 'https://uraicontent.com/licensing?private=secret#private'
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, stored: true });
    expect(persistence.committed).toBe(true);
    expect(persistence.operations.map((operation) => operation.collection)).toEqual(['leads', 'partner_inquiries']);
    expect(persistence.operations[0].value).toMatchObject({ email: 'partner@example.test', sourcePath: '/licensing', consentToUpdates: false });
  });

  it('does not report success or expose provider detail on failed commit', async () => {
    persistence.configured = true;
    persistence.fail = true;
    const response = await POST(request({ email: 'partner@example.test', leadType: 'partner' }));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, stored: false });
    expect(JSON.stringify(body)).not.toContain('private-provider-detail');
    expect(persistence.committed).toBe(false);
  });

  it('discards same-origin nonpublic paths from inquiry attribution', async () => {
    persistence.configured = true;
    await POST(request({ email: 'user@example.test' }, { referer: 'https://uraicontent.com/creator/private-user-id?secret=token' }));
    expect(persistence.operations[0].value.sourcePath).toBe('direct');
  });

  it('rejects foreign browser origins before persistence', async () => {
    persistence.configured = true;
    const response = await POST(request({ email: 'partner@example.test' }, { origin: 'https://foreign.example.test' }));
    expect(response.status).toBe(403);
    expect(persistence.operations).toEqual([]);
  });

  it('requires explicit waitlist updates consent but not marketing consent for contact', async () => {
    persistence.configured = true;
    const denied = await POST(request({ kind: 'waitlist', email: 'user@example.test' }));
    expect(denied.status).toBe(400);
    expect(persistence.operations).toEqual([]);
    const accepted = await POST(request({ kind: 'waitlist', email: 'user@example.test', consentToUpdates: 'true' }));
    expect(accepted.status).toBe(200);
    expect(persistence.operations[0].value.consentToUpdates).toBe(true);
  });

  it('bounds public bodies and rejects malformed content before persistence', async () => {
    persistence.configured = true;
    const tooLarge = await POST(request({ email: 'user@example.test', message: 'x'.repeat(9000) }));
    expect(tooLarge.status).toBe(413);
    const invalid = await POST(new Request('https://uraicontent.com/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }));
    expect(invalid.status).toBe(400);
    expect(persistence.operations).toEqual([]);
  });
});
