import { expect, test, type Page, type Route } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

// Actual mounted compiled UI and installed Firebase SDK. Auth/API responses are
// intercepted synthetic fixtures, not provider, cloud storage or private E2E proof.
const projectId = 'synthetic-content-fixture';
const output = process.env.URAI_CONTENT_VISUAL_DIR ?? 'artifacts/content-visual';
const appOrigin = 'http://127.0.0.1:3000';
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ baseURL }) => { expect(baseURL).toBe(appOrigin); });
const record = (uid: string, title = 'Synthetic saved title') => ({ id: 'synthetic-' + uid, creatorId: uid, title, body: 'Synthetic private content', contentType: 'story', tags: [], locale: 'en-US', status: 'submitted', submittedAt: '2026-10-08T12:00:00.000Z', updatedAt: '2026-10-08T12:00:00.000Z' });
function token(uid: string) {
  const now = Math.floor(Date.now() / 1000);
  return [ { alg: 'none', typ: 'JWT' }, { sub: uid, user_id: uid, aud: projectId, iss: 'https://securetoken.google.com/' + projectId, iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'password' } } ].map((part) => Buffer.from(JSON.stringify(part)).toString('base64url')).join('.') + '.synthetic';
}
function requestUid(route: Route) {
  const bearer = route.request().headers().authorization ?? '';
  try { return String(JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).sub); } catch { return ''; }
}
type ApiFixture = (route: Route, uid: string) => Promise<void>;
async function fixture(page: Page, api?: ApiFixture) {
  const writes: Record<string, unknown>[] = [];
  const unexpected: string[] = [];
  const errors: string[] = [];
  const counters = { authFulfills: 0, apiIntercepts: 0, localContinues: 0, externalAborts: 0, externalContinues: 0, handlerErrors: 0 };
  page.on('pageerror', (error) => errors.push(error.message));
  // Context-wide default deny is installed before goto and SDK initialization.
  await page.context().route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const deny = async () => { unexpected.push(url.origin + url.pathname); if (url.origin !== appOrigin) counters.externalAborts++; await route.abort().catch(() => {}); };
    const authReply = async (json: unknown) => { await route.fulfill({ headers: { 'access-control-allow-origin': appOrigin }, json }); counters.authFulfills++; };
    try {
      const identity = url.origin === 'https://identitytoolkit.googleapis.com' && ['/v1/accounts:signInWithPassword', '/v1/accounts:lookup'].includes(url.pathname);
      const refresh = url.origin === 'https://securetoken.googleapis.com' && url.pathname === '/v1/token';
      if (identity || refresh) {
        if (url.searchParams.get('key') !== 'synthetic-content-api-key') { await deny(); return; }
        if (route.request().method() === 'OPTIONS' && route.request().headers()['access-control-request-method'] === 'POST') {
          await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': appOrigin, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': route.request().headers()['access-control-request-headers'] ?? 'content-type' } }); counters.authFulfills++; return;
        }
        if (route.request().method() !== 'POST') { await deny(); return; }
        if (identity) {
          const value: unknown = route.request().postDataJSON();
          if (!value || typeof value !== 'object' || Array.isArray(value)) { await deny(); return; }
          const body = value as Record<string, unknown>;
          if (url.pathname === '/v1/accounts:signInWithPassword') {
            if (!['creator-a@example.invalid', 'creator-b@example.invalid'].includes(String(body.email)) || body.password !== 'synthetic-password') { await deny(); return; }
            const uid = body.email === 'creator-b@example.invalid' ? 'creator-b' : 'creator-a';
            await authReply({ localId: uid, email: body.email, registered: true, idToken: token(uid), refreshToken: 'synthetic-refresh-' + uid, expiresIn: '3600' }); return;
          }
          if (typeof body.idToken !== 'string' || !body.idToken.endsWith('.synthetic')) { await deny(); return; }
          const claims: unknown = JSON.parse(Buffer.from(body.idToken.split('.')[1], 'base64url').toString());
          if (!claims || typeof claims !== 'object' || Array.isArray(claims)) { await deny(); return; }
          const uid = (claims as Record<string, unknown>).sub;
          if (!['creator-a', 'creator-b'].includes(String(uid)) || (claims as Record<string, unknown>).aud !== projectId) { await deny(); return; }
          await authReply({ users: [{ localId: uid, email: uid + '@example.invalid', emailVerified: true, providerUserInfo: [{ providerId: 'password', email: uid + '@example.invalid', rawId: uid + '@example.invalid' }], createdAt: '1700000000000', lastLoginAt: '1700000000000' }] }); return;
        }
        const fields = new URLSearchParams(route.request().postData() ?? '');
        const refreshToken = fields.get('refresh_token');
        if (fields.get('grant_type') !== 'refresh_token' || !['synthetic-refresh-creator-a', 'synthetic-refresh-creator-b'].includes(refreshToken ?? '')) { await deny(); return; }
        const uid = refreshToken === 'synthetic-refresh-creator-b' ? 'creator-b' : 'creator-a';
        await authReply({ access_token: token(uid), id_token: token(uid), refresh_token: 'synthetic-refresh-' + uid, expires_in: '3600', user_id: uid, project_id: projectId, token_type: 'Bearer' }); return;
      }
      if (url.origin !== appOrigin) { await deny(); return; }
      if (url.pathname === '/api/creator/submissions') {
        const uid = requestUid(route);
        if (!['creator-a', 'creator-b'].includes(uid) || !route.request().headers().authorization?.endsWith('.synthetic')) { await deny(); return; }
        if (route.request().method() === 'POST') writes.push(route.request().postDataJSON());
        counters.apiIntercepts++;
        if (api) { await api(route, uid); return; }
        await route.fulfill({ json: { ok: true, stored: true, creatorId: uid, count: 0, submissions: [] } }); return;
      }
      await route.continue(); counters.localContinues++;
    } catch { counters.handlerErrors++; await deny(); }
  });
  return { writes, unexpected, errors, counters };
}
async function login(page: Page, uid = 'creator-a') {
  await page.getByLabel('Email', { exact: true }).fill(uid + '@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function fillDraft(page: Page) {
  await page.getByLabel('Title', { exact: true }).fill('Synthetic draft title');
  await page.getByLabel('Content', { exact: true }).fill('Synthetic draft content');
  await page.getByRole('checkbox').check();
}
async function settle(page: Page, captured: Awaited<ReturnType<typeof fixture>>) {
  await expect.poll(() => captured.unexpected).toEqual([]);
  expect(captured.errors).toEqual([]); expect(captured.counters.externalContinues).toBe(0); expect(captured.counters.handlerErrors).toBe(0);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
}

if (process.env.URAI_CONTENT_CREATOR_FIXTURE === '1') {
test('actual SDK sign-in stays neutral until own server history, then accepts only a stored review response', async ({ page }, info) => {
  let historyRelease!: () => void;
  const gate = new Promise<void>((resolve) => { historyRelease = resolve; });
  const captured = await fixture(page, async (route, uid) => {
    if (route.request().method() === 'GET') { await gate; await route.fulfill({ json: { ok: true, stored: true, creatorId: uid, count: 0, submissions: [] } }); }
    else await route.fulfill({ status: 201, json: { ok: true, stored: true, submission: record(uid) } });
  });
  expect((await page.goto('/creator/submit'))?.status()).toBe(200);
  await expect(page.getByLabel('Title', { exact: true })).toHaveCount(0);
  await login(page);
  await expect(page.getByText('Checking your current access and history…')).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveCount(0);
  historyRelease(); await fillDraft(page);
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
  await expect(page.getByText('Saved for review. This does not publish your content.')).toBeVisible();
  expect(captured.writes).toEqual([{ title: 'Synthetic draft title', body: 'Synthetic draft content', contentType: 'story', tags: [], locale: 'en-US', creatorId: 'creator-a' }]);
  await expect(page.getByRole('list', { name: 'Your saved submissions' })).toContainText('Synthetic saved title');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Submit for review', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Your saved submissions' })).toHaveCount(0);
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await settle(page, captured);
  await fs.mkdir(output, { recursive: true });
  await page.screenshot({ path: path.join(output, info.project.name + '-creator-signed-out.png'), fullPage: true });
  await fs.writeFile(path.join(output, info.project.name + '-creator-source-scope.json'), JSON.stringify({ exactHead: process.env.EXACT_HEAD ?? null, mountedProductionUI: process.env.URAI_CONTENT_VISUAL_PRODUCTION === '1', sdk: 'Firebase12.19.0', transport: 'intercepted synthetic Auth and API', observedTransportCounters: captured.counters, unexpectedEndpoints: captured.unexpected, cloudPersistenceProven: false, privateAcceptanceProven: false }, null, 2));
});

for (const [name, status, body] of [
  ['auth denied', 401, { error: 'unauthenticated' }], ['role denied', 403, { error: 'forbidden' }], ['storage unavailable', 503, { error: 'persistence_not_configured' }],
  ['memory preview', 200, { ok: true, stored: false, creatorId: 'creator-a', count: 0, submissions: [] }],
  ['foreign scope', 200, { ok: true, stored: true, creatorId: 'creator-b', count: 1, submissions: [record('creator-b')] }],
  ['missing success', 200, { stored: true, creatorId: 'creator-a', count: 0, submissions: [] }]
] as const) {
  test('mounted UI denies ' + name + ' without a creator form or private data', async ({ page }) => {
    const captured = await fixture(page, async (route) => { await route.fulfill({ status, json: body }); });
    await page.goto('/creator/submit'); await login(page);
    await expect(page.getByText('Access or durable history could not be confirmed. Sign in and reload to try again.')).toBeVisible();
    await expect(page.getByLabel('Title', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Your saved submissions' })).toHaveCount(0); expect(captured.writes).toEqual([]); await settle(page, captured);
  });
}

test('mounted pending consent withdrawal cancels output and makes no storage rollback claim', async ({ page }) => {
  let writeStarted!: () => void; const started = new Promise<void>((resolve) => { writeStarted = resolve; });
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
  const captured = await fixture(page, async (route, uid) => {
    if (route.request().method() === 'GET') await route.fulfill({ json: { ok: true, stored: true, creatorId: uid, count: 0, submissions: [] } });
    else { writeStarted(); await gate; await route.fulfill({ status: 201, json: { ok: true, stored: true, submission: record(uid) } }).catch(() => {}); }
  });
  await page.goto('/creator/submit'); await login(page); await fillDraft(page);
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click(); await started;
  await expect(page.getByRole('checkbox')).toBeVisible(); await page.getByRole('checkbox').uncheck();
  await expect(page.getByText(/Cancellation does not undo storage/)).toBeVisible();
  release(); await expect(page.getByRole('list', { name: 'Your saved submissions' })).toHaveCount(0);
  await expect(page.getByText('Saved for review. This does not publish your content.')).toHaveCount(0); expect(captured.writes).toHaveLength(1); await settle(page, captured);
});

test('mounted account switch discards late old-account success and preserves the new draft', async ({ page }) => {
  let writeStarted!: () => void; const started = new Promise<void>((resolve) => { writeStarted = resolve; });
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
  const captured = await fixture(page, async (route, uid) => {
    if (route.request().method() === 'GET') await route.fulfill({ json: { ok: true, stored: true, creatorId: uid, count: 0, submissions: [] } });
    else { writeStarted(); await gate; await route.fulfill({ status: 201, json: { ok: true, stored: true, submission: record(uid) } }).catch(() => {}); }
  });
  await page.goto('/creator/submit'); await login(page); await fillDraft(page);
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click(); await started;
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByText(/Cancellation does not undo storage/)).toBeVisible();
  await login(page, 'creator-b'); await fillDraft(page); await page.getByLabel('Title', { exact: true }).fill('New actor draft');
  release(); await expect(page.getByLabel('Title', { exact: true })).toHaveValue('New actor draft'); await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('list', { name: 'Your saved submissions' })).toHaveCount(0); expect(captured.writes).toHaveLength(1); await settle(page, captured);
});

test('mounted own history is plain text and navigation unmount clears its actor lease', async ({ page }) => {
  const captured = await fixture(page, async (route, uid) => { await route.fulfill({ json: { ok: true, stored: true, creatorId: uid, count: 1, submissions: [record(uid, '<img src=x onerror=alert(1)>')] } }); });
  await page.goto('/creator/submissions'); await login(page);
  await expect(page.getByRole('list', { name: 'Your saved submissions' })).toContainText('<img src=x onerror=alert(1)>');
  expect(await page.getByRole('list', { name: 'Your saved submissions' }).locator('img').count()).toBe(0);
  await page.getByRole('link', { name: 'Submit for review', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible(); await expect(page.getByRole('checkbox')).not.toBeChecked(); await settle(page, captured);
});

} else {
  test('unconfigured creator routes keep sign-in and submission unavailable', async ({ page }) => {
    const unexpected: string[] = [];
    await page.context().route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== appOrigin) { unexpected.push(url.origin + url.pathname); await route.abort(); }
      else await route.continue();
    });
    for (const route of ['/creator/submit', '/creator/submissions']) {
      expect((await page.goto(route))?.status()).toBe(200);
      await expect(page.getByText('Creator sign-in is unavailable here.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
      await expect(page.getByLabel('Title', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('list', { name: 'Your saved submissions' })).toHaveCount(0);
    }
    expect(unexpected).toEqual([]);
  });
}
