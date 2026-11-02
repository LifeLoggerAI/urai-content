'use client';
import { contentVersionRecordSchema, creatorSubmissionSchema, marketplaceItemSchema, parseStoredRuntimeContentRecord,
  telemetryEventSchema, userContentEntitlementSchema } from '../../../../src/schemas/content';

export type ExportActor = { uid: string; isCurrent(): boolean; getToken(): Promise<string> };
export type ContentDataExportState = { phase: 'signed-out' | 'ready' | 'preparing' | 'saved' | 'error' | 'cancelled';
  busy: boolean; confirmed: boolean; message: string; recordCount: number | null };
const pending = ['moderationQueue', 'publishingReleases', 'narratorPrompts', 'storyTemplates', 'ritualTemplates', 'exportTemplates'];
const collections = ['contentItems', 'creatorSubmissions', 'marketplaceItems', 'userContentEntitlements', 'telemetryEvents', 'contentVersions'];
const empty = (): ContentDataExportState => ({ phase: 'signed-out', busy: false, confirmed: false, message: '', recordCount: null });
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonical(entry)])) : value;
const object = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_export'); return value as Record<string, unknown>; };
const sameKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).sort().join(',') === [...keys].sort().join(',');
function checkPending(value: unknown) {
  if (!Array.isArray(value) || value.length !== pending.length || value.some(entry => typeof object(entry).reason !== 'string')
    || value.map(entry => object(entry).collection).sort().join(',') !== [...pending].sort().join(',')) throw new Error('invalid_export');
}
function validateExport(value: unknown, uid: string) {
  const envelope = object(value), manifest = object(envelope.manifest), payload = object(envelope.payload), coverage = object(payload.coverage), rows = object(payload.collections);
  if (!sameKeys(envelope, ['manifest', 'payload']) || payload.schemaVersion !== 'urai-content-subject-export-v1'
    || payload.contributorId !== 'urai-content' || manifest.contributorId !== 'urai-content' || payload.subjectUid !== uid || manifest.subjectUid !== uid
    || manifest.complete !== false || coverage.complete !== false || manifest.scope !== 'schema-defined-owned-content-records'
    || coverage.scope !== manifest.scope || coverage.consistency !== 'bounded-current-authority-scan'
    || manifest.artifactPersisted !== false || manifest.providerDeliveryVerified !== false || !sameKeys(rows, collections)) throw new Error('invalid_export');
  checkPending(coverage.pendingCollections); checkPending(manifest.pendingCollections);
  const counts = object(manifest.collectionCounts);
  if (!sameKeys(counts, collections)) throw new Error('invalid_export');
  const owned = new Set<string>();
  let total = 0;
  for (const collection of collections) {
    const entries = rows[collection];
    if (!Array.isArray(entries) || entries.length !== counts[collection]) throw new Error('invalid_export');
    const seen = new Set<string>();
    for (const value of entries) {
      const entry = object(value), record = object(entry.record);
      if (typeof entry.id !== 'string' || !entry.id || entry.id.includes('/') || seen.has(entry.id)) throw new Error('invalid_export');
      seen.add(entry.id);
      if (collection === 'contentItems') { const parsed = parseStoredRuntimeContentRecord(record); if (parsed.id !== entry.id || parsed.createdBy !== uid) throw new Error('invalid_export'); owned.add(parsed.id); }
      if (collection === 'creatorSubmissions') { const parsed = creatorSubmissionSchema.parse(record); if (parsed.id !== entry.id || parsed.creatorId !== uid || 'moderatedBy' in record || 'moderationNotes' in record || 'migrationSource' in record) throw new Error('invalid_export'); }
      if (collection === 'marketplaceItems') { const parsed = marketplaceItemSchema.parse(record); if (parsed.id !== entry.id || parsed.creatorId !== uid) throw new Error('invalid_export'); }
      if (collection === 'userContentEntitlements' && userContentEntitlementSchema.parse(record).userId !== uid) throw new Error('invalid_export');
      if (collection === 'telemetryEvents' && telemetryEventSchema.parse(record).userId !== uid) throw new Error('invalid_export');
      if (collection === 'contentVersions') { const parsed = contentVersionRecordSchema.parse(record); if (!owned.has(parsed.contentId) || parsed.snapshot.id !== parsed.contentId || parsed.snapshot.createdBy !== uid || entry.id !== `${parsed.contentId}-v${parsed.version}`) throw new Error('invalid_export'); }
    }
    total += entries.length;
  }
  if (total > 1000 || manifest.recordCount !== total || typeof manifest.payloadSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.payloadSha256)) throw new Error('invalid_export');
  const payloadBytes = new TextEncoder().encode(JSON.stringify(canonical(payload)));
  if (manifest.payloadBytes !== payloadBytes.byteLength) throw new Error('invalid_export');
  return { total, payloadBytes, hash: manifest.payloadSha256 };
}
export function saveContentExport(blob: Blob) {
  const url = URL.createObjectURL(blob);
  let link: HTMLAnchorElement | undefined;
  try {
    link = document.createElement('a');
    link.href = url; link.download = 'urai-content-records.json'; link.rel = 'noopener';
    document.body.appendChild(link); link.click();
  } finally { link?.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
}
export class ContentDataExportController {
  private actor: ExportActor | null = null;
  private epoch = 0;
  private abort: AbortController | null = null;
  private disposed = false;
  private downloadRequested = false;
  private state = empty();
  private listeners = new Set<() => void>();
  constructor(private readonly request: typeof fetch = (input, init) => fetch(input, init), private readonly save: (blob: Blob) => void = saveContentExport) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  private emit(state: ContentDataExportState) { this.state = state; this.listeners.forEach(listener => listener()); }
  private invalidate() { this.epoch++; this.abort?.abort(); this.abort = null; }
  start() { this.disposed = false; this.setActor(null); }
  setActor(actor: ExportActor | null) { this.invalidate(); this.actor = actor; this.downloadRequested = false; this.emit({ ...empty(), phase: actor ? 'ready' : 'signed-out' }); }
  setConfirmed(confirmed: boolean) {
    if (!confirmed && this.state.busy) { this.cancel(); return; }
    this.emit({ ...this.state, confirmed });
  }
  cancel() {
    const alreadyRequested = this.downloadRequested || this.state.phase === 'saved'; this.invalidate();
    this.emit({ ...empty(), phase: this.actor ? 'cancelled' : 'signed-out', message: alreadyRequested
      ? 'A Content file may already be saved on your device. Cancellation cannot recall it.'
      : 'Export cancelled. No file was downloaded. You can confirm and try again.' });
  }
  dispose() { this.disposed = true; this.setActor(null); }
  async download(): Promise<boolean> {
    const actor = this.actor;
    if (!actor || this.disposed || this.state.busy || !this.state.confirmed || !actor.isCurrent()) return false;
    const epoch = this.epoch, abort = new AbortController(); this.abort = abort; this.downloadRequested = false;
    let expired = false;
    const timer = setTimeout(() => { expired = true; abort.abort(); }, 30_000);
    const active = () => {
      if (epoch === this.epoch && this.actor === actor && !actor.isCurrent()) this.setActor(null);
      return !this.disposed && epoch === this.epoch && this.actor === actor && actor.isCurrent() && !abort.signal.aborted;
    };
    const wait = async <T>(dispatch: () => Promise<T>): Promise<T> => {
      if (!active()) throw new Error('cancelled');
      let stop = () => {};
      const cancelled = new Promise<never>((_resolve, reject) => { stop = () => reject(new Error('cancelled')); abort.signal.addEventListener('abort', stop, { once: true }); });
      try { if (!active()) throw new Error('cancelled'); const value = await Promise.race([dispatch(), cancelled]); if (!active()) throw new Error('cancelled'); return value; }
      finally { abort.signal.removeEventListener('abort', stop); }
    };
    this.emit({ ...this.state, phase: 'preparing', busy: true, recordCount: null, message: 'Checking current access and preparing your partial Content export…' });
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      let token: string;
      try { token = await wait(() => actor.getToken()); }
      catch (failure) { if (active()) throw new Error('authority'); throw failure; }
      if (!token.trim()) throw new Error('authority');
      const response = await wait(() => this.request('/api/privacy/export', { method: 'GET', cache: 'no-store', credentials: 'omit', redirect: 'error', signal: abort.signal, headers: { authorization: 'Bearer ' + token } }));
      if (response.status === 413) throw new Error('limit');
      if (response.status === 401 || response.status === 403) throw new Error('authority');
      if (response.status !== 200 || response.headers.get('x-urai-export-scope') !== 'partial-content-records' || response.headers.get('content-type')?.split(';')[0] !== 'application/json' || !response.body) throw new Error('unavailable');
      reader = response.body.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const part = await wait(() => reader!.read()); if (part.done) break;
        size += part.value.byteLength; if (size > 2 * 1024 * 1024) throw new Error('limit'); chunks.push(part.value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const result = validateExport(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), actor.uid);
      const digest = await wait(() => crypto.subtle.digest('SHA-256', new Uint8Array(result.payloadBytes)));
      const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== result.hash || !active()) throw new Error('invalid_export');
      this.downloadRequested = true; // Browser request boundary: a later failure cannot prove no device copy.
      this.save(new Blob([bytes], { type: 'application/json' }));
      if (!active()) return false; // Do not publish an old actor summary after a synchronous browser event.
      this.emit({ phase: 'saved', busy: false, confirmed: false, recordCount: result.total,
        message: `Download requested: ${result.total} Content records. This partial file excludes the six listed scopes; browser saving is not confirmed.` });
      return true;
    } catch (failure) {
      if (!this.disposed && epoch === this.epoch && this.actor === actor) {
        const code = failure instanceof Error ? failure.message : '';
        if (code === 'authority') { this.actor = null; this.invalidate(); }
        this.emit({ ...empty(), phase: code === 'authority' ? 'signed-out' : 'error', message: this.downloadRequested
          ? 'The browser download may already have been requested. Check your device before trying again. UrAi cannot recall a saved copy.'
          : expired || code === 'limit'
          ? 'The export exceeds its safe size or time limit. No file was downloaded. Contact privacy support for a governed larger export.'
          : code === 'authority' ? 'Current sign-in or export consent could not be confirmed. Check your account and privacy controls before trying again.'
          : 'The export could not be verified. No file was downloaded. Confirm again to retry, or contact privacy support.' });
      }
      return false;
    } finally {
      clearTimeout(timer);
      if (abort.signal.aborted || this.state.phase !== 'saved') void reader?.cancel().catch(() => undefined);
      if (epoch === this.epoch) this.abort = null;
    }
  }
}

export type ContentExportIdentity = { uid: string; getIdToken(forceRefresh?: boolean): Promise<string> };
/** Same SDK identity refresh retains its pending operation; replacing the
 * User object, even at the same UID, is a fresh account boundary. */
export class ContentExportAccountObserver<T extends ContentExportIdentity> {
  private user: T | null = null;
  private ended = false;
  constructor(private readonly controller: ContentDataExportController, private readonly expectedUid: string,
    private readonly current: () => T | null, private readonly changed: (user: T | null) => void) {}
  observe(user: T | null) {
    if (this.ended || user === this.user) return;
    this.user = user;
    this.controller.setActor(user?.uid === this.expectedUid ? {
      uid: user.uid, isCurrent: () => !this.ended && this.current() === user,
      getToken: async () => { const token = await user.getIdToken(true); if (this.ended || this.current() !== user) throw new Error('Account changed.'); return token; }
    } : null);
    this.changed(user);
  }
  clearLocal() { if (this.user) { this.user = null; this.controller.setActor(null); this.changed(null); } }
  endSession() { this.ended = true; this.user = null; this.controller.setActor(null); this.changed(null); }
}

export function restoreContentExportFocus(root: HTMLElement | null, previous: HTMLElement | null, doc: Document = document): boolean {
  if (!root || !previous || doc.contains(previous) || doc.activeElement !== doc.body) return false;
  const target = root.querySelector<HTMLElement>('[data-export-recovery-focus]:not(:disabled)');
  if (!target) return false;
  target.focus(); return true;
}
