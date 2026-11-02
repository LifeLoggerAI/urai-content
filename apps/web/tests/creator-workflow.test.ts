import { describe, expect, it, vi } from 'vitest';
import { CreatorWorkflowController, type CreatorActor, type CreatorDraft } from '../src/lib/creatorWorkflow';
// Loaded server-page project contract only; never load or execute SDK networking.
vi.mock('../src/components/CreatorWorkflow', () => ({ CreatorWorkflow: () => null }));
vi.mock('../src/components/PublicPage', () => ({ PublicPage: () => null }));

const draft: CreatorDraft = { title: 'Synthetic private title', body: 'Synthetic content', contentType: 'story', tags: [], locale: 'en-US' };
const item = (uid = 'creator-a') => ({ ...draft, id: 'owned-1', creatorId: uid, status: 'submitted', submittedAt: '2026-10-08T12:00:00.000Z', updatedAt: '2026-10-08T12:00:00.000Z' });
const history = (uid = 'creator-a') => ({ ok: true, stored: true, creatorId: uid, count: 1, submissions: [item(uid)] });
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function actor(uid = 'creator-a'): CreatorActor { return { uid, isCurrent: () => true, getToken: async () => 'synthetic-token' }; }
async function admitted(request = vi.fn<typeof fetch>()) {
  request.mockResolvedValueOnce(response(history()));
  const controller = new CreatorWorkflowController(request); controller.setActor(actor()); await controller.refresh(); controller.setConsent(true);
  return { controller, request };
}

describe('creator controller with declared synthetic transport, no provider requests', () => {
  it('default transport preserves the browser-global receiver for history and saving', async () => {
    const receivers: unknown[] = [];
    const request = vi.fn(function (this: unknown, _input: RequestInfo | URL, init?: RequestInit) {
      receivers.push(this);
      // Web IDL accepts a free/global call and rejects an incompatible receiver.
      // This is an in-memory browser-contract model, never a network request.
      if (this != null && this !== globalThis) throw new TypeError('Illegal invocation');
      const writing = init?.method === 'POST';
      return Promise.resolve(response(writing ? { ok: true, stored: true, submission: item() } : history(), writing ? 201 : 200));
    });
    vi.stubGlobal('fetch', request);
    try {
      const controller = new CreatorWorkflowController(); controller.setActor(actor());
      const admitted = await controller.refresh();
      expect(receivers.map((receiver) => receiver === controller ? 'controller' : 'global-compatible')).not.toContain('controller');
      expect(admitted).toBe(true); expect(controller.snapshot().authorized).toBe(true);
      controller.setConsent(true); expect(await controller.submit(draft)).toBe(true);
      expect(controller.snapshot().saved).toEqual(item()); expect(request).toHaveBeenCalledTimes(2);
      expect(receivers.every((receiver) => receiver == null || receiver === globalThis)).toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });
  it('keeps signed-out and unverified SDK accounts neutral', async () => {
    const request = vi.fn<typeof fetch>(); const controller = new CreatorWorkflowController(request);
    await controller.submit(draft); controller.setActor(actor()); controller.setConsent(true); await controller.submit(draft);
    expect(request).not.toHaveBeenCalled(); expect(controller.snapshot().authorized).toBe(false);
  });
  it('admits only a complete current own-history durable server response', async () => {
    const { controller } = await admitted();
    expect(controller.snapshot()).toMatchObject({ phase: 'ready', authorized: true, busy: false, submissions: [item()] });
  });
  for (const [name, value, status] of [
    ['missing ok', { ...history(), ok: undefined }, 200], ['false ok', { ...history(), ok: false }, 200],
    ['missing storage', { ...history(), stored: undefined }, 200], ['memory preview', { ...history(), stored: false }, 200],
    ['foreign UID', history('creator-b'), 200], ['foreign record', { ...history(), submissions: [item('creator-b')] }, 200],
    ['wrong count', { ...history(), count: 2 }, 200], ['duplicate ids', { ...history(), count: 2, submissions: [item(), item()] }, 200],
    ['malformed record', { ...history(), submissions: [{ ...item(), submittedAt: 'bad' }] }, 200],
    ['non-list', { ...history(), submissions: {} }, 200], ['wrong success status', history(), 201],
    ['revoked authentication', {}, 401], ['wrong role', {}, 403], ['unavailable storage', {}, 503]
  ] as const) {
    it('denies history: ' + name, async () => {
      const request = vi.fn<typeof fetch>().mockResolvedValue(response(value, status));
      const controller = new CreatorWorkflowController(request); controller.setActor(actor()); await controller.refresh(); controller.setConsent(true); await controller.submit(draft);
      expect(controller.snapshot()).toMatchObject({ authorized: false, busy: false, saved: null, submissions: [] }); expect(request).toHaveBeenCalledTimes(1);
    });
  }
  it('sends only the current own draft fields and accepts an awaited stored review record', async () => {
    const { controller, request } = await admitted(); request.mockResolvedValueOnce(response({ ok: true, stored: true, submission: item() }, 201));
    expect(await controller.submit({ ...draft, id: 'foreign-id', creatorId: 'foreign', stored: true, status: 'approved' } as CreatorDraft)).toBe(true);
    const options = request.mock.calls[1][1]!;
    expect(JSON.parse(String(options.body))).toEqual({ ...draft, creatorId: 'creator-a' });
    expect(options.headers).toMatchObject({ authorization: 'Bearer synthetic-token' });
    expect(controller.snapshot()).toMatchObject({ phase: 'saved', authorized: true, busy: false, saved: item() });
    await controller.submit(draft); expect(request).toHaveBeenCalledTimes(2);
  });
  for (const [name, value, status] of [
    ['missing ok', { stored: true, submission: item() }, 201], ['nonstored', { ok: true, stored: false, submission: item() }, 201],
    ['foreign record', { ok: true, stored: true, submission: item('creator-b') }, 201],
    ['wrong lifecycle', { ok: true, stored: true, submission: { ...item(), status: 'approved' } }, 201],
    ['wrong success status', { ok: true, stored: true, submission: item() }, 200], ['post-write denial', {}, 401]
  ] as const) {
    it('does not accept POST: ' + name, async () => {
      const { controller, request } = await admitted(); request.mockResolvedValueOnce(response(value, status));
      expect(await controller.submit(draft)).toBe(false); expect(controller.snapshot()).toMatchObject({ authorized: false, saved: null, submissions: [] });
      expect(controller.snapshot().message).toContain('may already have been saved');
    });
  }
  it('deduplicates a pending write and permits consent withdrawal while saving', async () => {
    const gate = deferred<Response>(); const { controller, request } = await admitted(); request.mockReturnValueOnce(gate.promise);
    const pending = controller.submit(draft); await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(controller.snapshot()).toMatchObject({ phase: 'saving', authorized: true, busy: true });
    expect(await controller.submit(draft)).toBe(false); controller.setConsent(false);
    expect((request.mock.calls[1][1]!.signal as AbortSignal).aborted).toBe(true);
    gate.resolve(response({ ok: true, stored: true, submission: item() }, 201)); expect(await pending).toBe(false);
    expect(controller.snapshot()).toMatchObject({ authorized: false, saved: null, submissions: [], busy: false });
    expect(controller.snapshot().message).toContain('Cancellation does not undo storage');
  });
  it('denies a request cancelled during token await before dispatch', async () => {
    const token = deferred<string>(); const { controller, request } = await admitted();
    const current = actor(); current.getToken = () => token.promise; controller.setActor(current);
    const pending = controller.refresh(); controller.setActor(null); token.resolve('late-token'); await pending;
    expect(request).toHaveBeenCalledTimes(1); expect(controller.snapshot().phase).toBe('signed-out');
  });
  it('drops late JSON on account replacement and preserves the new actor result', async () => {
    const json = deferred<unknown>(); const request = vi.fn<typeof fetch>().mockResolvedValueOnce({ ok: true, status: 200, json: () => json.promise } as Response);
    const controller = new CreatorWorkflowController(request); controller.setActor(actor()); const pending = controller.refresh();
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1)); controller.setActor(actor('creator-b'));
    request.mockResolvedValueOnce(response(history('creator-b'))); await controller.refresh(); json.resolve(history()); await pending;
    expect(controller.snapshot().submissions).toEqual([item('creator-b')]); expect(controller.snapshot().authorized).toBe(true);
  });
  it('clears private history and consent on the same UID token authority boundary', async () => {
    const { controller, request } = await admitted(); controller.setActor(actor()); await controller.submit(draft);
    expect(controller.snapshot()).toMatchObject({ authorized: false, submissions: [], saved: null }); expect(request).toHaveBeenCalledTimes(1);
  });
  it('drops a late write after account switch without overwriting new actor state', async () => {
    const gate = deferred<Response>(); const { controller, request } = await admitted(); request.mockReturnValueOnce(gate.promise);
    const pending = controller.submit(draft); await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2)); controller.setActor(actor('creator-b'));
    request.mockResolvedValueOnce(response(history('creator-b'))); await controller.refresh(); gate.resolve(response({ ok: true, stored: true, submission: item() }, 201));
    expect(await pending).toBe(false); expect(controller.snapshot().submissions).toEqual([item('creator-b')]);
  });
  it('clears a silently changed SDK actor at the post-await boundary', async () => {
    const gate = deferred<Response>(); const request = vi.fn<typeof fetch>().mockReturnValue(gate.promise); let current = true;
    const controller = new CreatorWorkflowController(request); controller.setActor({ ...actor(), isCurrent: () => current }); const pending = controller.refresh();
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1)); current = false; gate.resolve(response(history())); await pending;
    expect(controller.snapshot()).toMatchObject({ phase: 'signed-out', authorized: false, submissions: [] });
  });
  it('drops unmounted work and supports a fresh StrictMode observer setup', async () => {
    const gate = deferred<Response>(); const request = vi.fn<typeof fetch>().mockReturnValueOnce(gate.promise);
    const controller = new CreatorWorkflowController(request); controller.setActor(actor()); const pending = controller.refresh();
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1)); controller.dispose(); controller.start(); controller.setActor(actor('creator-b'));
    request.mockResolvedValueOnce(response(history('creator-b'))); await controller.refresh(); gate.resolve(response(history())); await pending;
    expect(controller.snapshot().submissions).toEqual([item('creator-b')]);
  });
  it('does not dispatch with an empty or failed SDK token', async () => {
    for (const getToken of [async () => '', async () => { throw new Error('synthetic token failure'); }]) {
      const request = vi.fn<typeof fetch>(); const controller = new CreatorWorkflowController(request); controller.setActor({ ...actor(), getToken }); await controller.refresh();
      expect(request).not.toHaveBeenCalled(); expect(controller.snapshot().authorized).toBe(false);
    }
  });
  it('requires new confirmation after denied write and a successful authority reload', async () => {
    const { controller, request } = await admitted();
    request.mockResolvedValueOnce(response({}, 401)); await controller.submit(draft);
    request.mockResolvedValueOnce(response(history())); await controller.refresh();
    expect(await controller.submit(draft)).toBe(false); expect(request).toHaveBeenCalledTimes(3);
    controller.setConsent(true); request.mockResolvedValueOnce(response({ ok: true, stored: true, submission: item() }, 201));
    expect(await controller.submit(draft)).toBe(true);
  });
  it('consumes old confirmation before a same-actor history reload', async () => {
    const { controller, request } = await admitted(); request.mockResolvedValueOnce(response(history())); await controller.refresh();
    expect(await controller.submit(draft)).toBe(false); expect(request).toHaveBeenCalledTimes(2);
  });
});

it('both loaded server pages deny missing or mismatched project and allow only canonical match', async () => {
  const { default: SubmitPage } = await import('../src/app/creator/submit/page');
  const { default: HistoryPage } = await import('../src/app/creator/submissions/page');
  const originalServer = process.env.FIREBASE_PROJECT_ID;
  const originalPublic = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  try {
    for (const page of [SubmitPage, HistoryPage]) {
      delete process.env.FIREBASE_PROJECT_ID; delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      expect(page().props.children.props.projectMatches).toBe(false);
      process.env.FIREBASE_PROJECT_ID = 'canonical-fixture'; process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'foreign-fixture';
      expect(page().props.children.props.projectMatches).toBe(false);
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'canonical-fixture';
      expect(page().props.children.props.projectMatches).toBe(true);
    }
  } finally {
    if (originalServer === undefined) delete process.env.FIREBASE_PROJECT_ID; else process.env.FIREBASE_PROJECT_ID = originalServer;
    if (originalPublic === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = originalPublic;
  }
});
