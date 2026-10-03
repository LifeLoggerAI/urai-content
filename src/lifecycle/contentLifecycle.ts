import type { ContentItem } from '../schemas/content.js';

export type ContentLifecycleState = {
  item: ContentItem;
  revision: number;
  publishedRevision: number | null;
  deletedAt: string | null;
  purgeAfter: string | null;
};

export function createContentLifecycleState(item: ContentItem): ContentLifecycleState {
  return { item: { ...item }, revision: 1, publishedRevision: item.status === 'published' ? 1 : null, deletedAt: null, purgeAfter: null };
}

export function applyContentMutation(
  state: ContentLifecycleState,
  patch: Partial<ContentItem>,
  expectedRevision: number,
): ContentLifecycleState {
  if (state.deletedAt) throw new Error('Deleted content cannot be mutated');
  if (expectedRevision !== state.revision) throw new Error('Stale content revision');
  const item = { ...state.item, ...patch, id: state.item.id };
  const revision = state.revision + 1;
  return {
    ...state,
    item,
    revision,
    publishedRevision: item.status === 'published' ? revision : state.publishedRevision,
  };
}

export function softDeleteContent(
  state: ContentLifecycleState,
  deletedAt: string,
  purgeAfter: string,
  expectedRevision: number,
): ContentLifecycleState {
  if (expectedRevision !== state.revision) throw new Error('Stale content revision');
  if (state.deletedAt) return state;
  if (Date.parse(purgeAfter) <= Date.parse(deletedAt)) throw new Error('Purge deadline must follow deletion');
  return { ...state, revision: state.revision + 1, deletedAt, purgeAfter };
}

export function restoreContent(
  state: ContentLifecycleState,
  expectedRevision: number,
): ContentLifecycleState {
  if (expectedRevision !== state.revision) throw new Error('Stale content revision');
  if (!state.deletedAt) return state;
  return { ...state, revision: state.revision + 1, deletedAt: null, purgeAfter: null };
}

export function isPurgeEligible(state: ContentLifecycleState, now: string): boolean {
  return Boolean(state.deletedAt && state.purgeAfter && Date.parse(now) >= Date.parse(state.purgeAfter));
}
