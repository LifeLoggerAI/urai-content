import { creatorSubmissionSchema } from '../../../../src/schemas/content';
import type { z } from 'zod';

export type Submission = z.output<typeof creatorSubmissionSchema>;
export type CreatorActor = { uid: string; isCurrent(): boolean; getToken(): Promise<string> };
export type CreatorDraft = {
  title: string; body: string;
  contentType: 'story' | 'ritual' | 'narrator' | 'marketplace' | 'export';
  tags: string[]; locale: string;
};
export type WorkflowState = {
  phase: 'signed-out' | 'checking' | 'ready' | 'loading' | 'saving' | 'saved' | 'error';
  busy: boolean; authorized: boolean; submissions: Submission[]; saved: Submission | null; message: string;
};
const empty = (): WorkflowState => ({ phase: 'signed-out', busy: false, authorized: false, submissions: [], saved: null, message: '' });
const uncertainWrite = 'A submission may already have been saved. Cancellation does not undo storage. Reload your history before trying again.';
const records = (value: unknown, uid: string): Submission[] => {
  if (!Array.isArray(value)) throw new Error('Invalid submission response.');
  const parsed = value.map((item) => creatorSubmissionSchema.parse(item));
  if (parsed.some((item) => item.creatorId !== uid) || new Set(parsed.map((item) => item.id)).size !== parsed.length) {
    throw new Error('Invalid submission ownership response.');
  }
  return parsed;
};
export class CreatorWorkflowController {
  private actor: CreatorActor | null = null;
  private epoch = 0;
  private consent = false;
  private disposed = false;
  private dispatchedWrite = false;
  private aborts = new Set<AbortController>();
  private listeners = new Set<() => void>();
  private state: WorkflowState = empty();
  constructor(private readonly request: typeof fetch = (input, init) => fetch(input, init)) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  get busy() { return this.state.busy; }
  private emit(next: WorkflowState) { this.state = next; this.listeners.forEach((listener) => listener()); }
  private invalidate() { this.epoch++; this.aborts.forEach((abort) => abort.abort()); this.aborts.clear(); }
  start() { this.disposed = false; this.setActor(null); }
  setActor(actor: CreatorActor | null) {
    const uncertain = (this.state.busy && this.dispatchedWrite) || (!actor && this.state.message === uncertainWrite);
    this.invalidate(); this.actor = actor; this.consent = false; this.dispatchedWrite = false;
    this.emit({ ...empty(), phase: actor ? 'checking' : 'signed-out', message: uncertain ? uncertainWrite : '' });
  }
  setConsent(value: boolean) {
    this.consent = value;
    if (!value) {
      const uncertain = this.state.busy && this.dispatchedWrite;
      this.invalidate(); this.dispatchedWrite = false;
      this.emit({ ...empty(), phase: this.actor ? 'checking' : 'signed-out', message: uncertain ? uncertainWrite : 'Confirmation withdrawn. Reload your history to continue.' });
    }
  }
  dispose() { this.disposed = true; this.setActor(null); }
  async refresh() { return this.run('GET'); }
  async submit(draft: CreatorDraft): Promise<boolean> {
    if (!this.consent || !this.state.authorized || this.state.busy) return false;
    return this.run('POST', draft);
  }
  private async run(method: 'GET' | 'POST', draft?: CreatorDraft): Promise<boolean> {
    const actor = this.actor;
    if (!actor || this.disposed || this.state.busy || !actor.isCurrent()) return false;
    const epoch = this.epoch;
    if (method === 'GET') this.consent = false;
    const active = () => {
      if (this.actor === actor && epoch === this.epoch && !actor.isCurrent()) this.setActor(null);
      return !this.disposed && this.actor === actor && epoch === this.epoch && actor.isCurrent() && (method !== 'POST' || this.consent);
    };
    const abort = new AbortController(); this.aborts.add(abort); this.dispatchedWrite = false;
    this.emit({ ...this.state, busy: true, phase: method === 'POST' ? 'saving' : 'loading', authorized: method === 'POST', saved: null, submissions: method === 'POST' ? this.state.submissions : [], message: '' });
    try {
      const token = await actor.getToken();
      if (!active()) return false;
      if (!token.trim()) throw new Error('Sign in again to continue.');
      if (method === 'POST') this.dispatchedWrite = true;
      const response = await this.request('/api/creator/submissions', {
        method, signal: abort.signal,
        headers: { authorization: 'Bearer ' + token, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) },
        ...(draft ? { body: JSON.stringify({ title: draft.title, body: draft.body, contentType: draft.contentType, tags: draft.tags, locale: draft.locale, creatorId: actor.uid }) } : {})
      });
      if (!active()) return false;
      if (!response.ok) throw new Error('The request could not be confirmed.');
      const data: unknown = await response.json();
      if (!active()) return false;
      if (!data || typeof data !== 'object') throw new Error('Invalid submission response.');
      const result = data as Record<string, unknown>;
      if (result.ok !== true || result.stored !== true) throw new Error('Durable saving could not be confirmed.');
      if (method === 'GET') {
        const items = records(result.submissions, actor.uid);
        if (response.status !== 200 || result.creatorId !== actor.uid || result.count !== items.length) throw new Error('Invalid submission response.');
        this.emit({ phase: 'ready', busy: false, authorized: true, submissions: items, saved: null, message: '' });
      } else {
        const item = records([result.submission], actor.uid)[0];
        if (response.status !== 201 || item.status !== 'submitted') throw new Error('Invalid saved submission response.');
        this.consent = false;
        this.emit({ phase: 'saved', busy: false, authorized: true, submissions: [item, ...this.state.submissions.filter((prior) => prior.id !== item.id)], saved: item, message: 'Saved for review. This does not publish your content.' });
      }
      this.dispatchedWrite = false;
      return true;
    } catch {
      if (active()) {
        this.consent = false;
        this.emit({ ...empty(), phase: 'error', message: method === 'POST' && this.dispatchedWrite ? uncertainWrite : 'Access or durable history could not be confirmed. Sign in and reload to try again.' });
      }
      return false;
    } finally {
      this.aborts.delete(abort);
      if (epoch === this.epoch && this.state.busy) this.emit({ ...this.state, busy: false });
    }
  }
}
