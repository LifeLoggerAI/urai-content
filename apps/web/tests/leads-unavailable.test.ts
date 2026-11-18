import { afterEach, describe, expect, it } from 'vitest';
import { POST as submitLead } from '../src/app/api/leads/route';

const keys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const;
const saved = keys.map((key) => [key, process.env[key]] as const);
afterEach(() => {
  for (const [key, value] of saved) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('nonpersistent public lead intake', () => {
  it.each(['waitlist', 'contact'] as const)('%s fails closed without Firebase Admin', async (kind) => {
    for (const key of keys) delete process.env[key];
    const response = await submitLead(new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, email: 'safe-test@example.invalid', leadType: 'user' })
    }));
    const body = await response.json() as { ok: boolean; stored: boolean; error: string; message: string };
    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, stored: false, error: 'intake_unavailable' });
    expect(body.message).toMatch(/not saved/i);
  });

  it('still rejects invalid input with HTTP 400', async () => {
    for (const key of keys) delete process.env[key];
    const response = await submitLead(new Request('http://localhost/api/leads', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'contact', email: 'not-an-email' })
    }));
    expect(response.status).toBe(400);
  });
});
