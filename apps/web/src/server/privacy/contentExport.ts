import 'server-only';
import { createHash } from 'node:crypto';
import {
  contentVersionRecordSchema, creatorSubmissionSchema, marketplaceItemSchema,
  parseStoredRuntimeContentRecord, telemetryEventSchema, userContentEntitlementSchema
} from '../content/schemas';

export const CONTENT_EXPORT_LIMITS = Object.freeze({ pageSize: 100, records: 1000, queries: 100, bytes: 2 * 1024 * 1024, milliseconds: 20_000 });
const directSources = [
  { collection: 'contentItems', field: 'createdBy', parse: parseStoredRuntimeContentRecord },
  { collection: 'creatorSubmissions', field: 'creatorId', parse: (value: unknown) => {
    const { moderatedBy, moderationNotes, migrationSource, ...subjectFields } = creatorSubmissionSchema.parse(value);
    void moderatedBy; void moderationNotes; void migrationSource;
    return subjectFields;
  } },
  { collection: 'marketplaceItems', field: 'creatorId', parse: (value: unknown) => marketplaceItemSchema.parse(value) },
  { collection: 'userContentEntitlements', field: 'userId', parse: (value: unknown) => userContentEntitlementSchema.parse(value) },
  { collection: 'telemetryEvents', field: 'userId', parse: (value: unknown) => telemetryEventSchema.parse(value) }
] as const;

export const CONTENT_EXPORT_PENDING_SCOPES = Object.freeze([
  { collection: 'moderationQueue', reason: 'Cross-user reviewer/subject fields require a governed disclosure mapping.' },
  { collection: 'publishingReleases', reason: 'Multi-owner publishing releases require a governed disclosure mapping.' },
  { collection: 'narratorPrompts', reason: 'Current schema has no subject ownership or consent reference.' },
  { collection: 'storyTemplates', reason: 'Current schema has no subject ownership or consent reference.' },
  { collection: 'ritualTemplates', reason: 'Current schema has no subject ownership or consent reference.' },
  { collection: 'exportTemplates', reason: 'Current schema has no subject ownership or consent reference.' }
]);

export type ContentExportPage = {
  collection: string; field: string; value: string; afterId: string | null; limit: number;
};
export type ContentExportRow = { id: string; data: unknown };
export type ContentExportStore = { readPage(page: ContentExportPage): Promise<ContentExportRow[]> };

export class ContentExportError extends Error {
  constructor(public readonly code: 'export_limit' | 'export_cancelled' | 'export_source_invalid' | 'export_unavailable') { super(code); }
}
/** Bounds every await, including Auth. Already submitted SDK I/O may settle,
 * but cancellation prevents later collection dispatch and any export response. */
export function createContentExportOperation(signal: AbortSignal, now: () => number = Date.now) {
  const startedAt = now();
  const controller = new AbortController();
  let expired = false;
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const check = () => {
    if (signal.aborted) throw new ContentExportError('export_cancelled');
    if (expired || now() - startedAt >= CONTENT_EXPORT_LIMITS.milliseconds) {
      expired = true; controller.abort(); throw new ContentExportError('export_limit');
    }
  };
  return {
    signal: controller.signal, check,
    async wait<T>(dispatch: () => Promise<T>): Promise<T> {
      check();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let stop = () => {};
      const stopped = new Promise<never>((_resolve, reject) => {
        stop = () => reject(new ContentExportError(expired ? 'export_limit' : 'export_cancelled'));
        controller.signal.addEventListener('abort', stop, { once: true });
        timer = setTimeout(() => { expired = true; controller.abort(); },
          Math.max(1, CONTENT_EXPORT_LIMITS.milliseconds - (now() - startedAt)));
      });
      try {
        check();
        const value = await Promise.race([dispatch(), stopped]);
        check();
        return value;
      } finally { if (timer) clearTimeout(timer); controller.signal.removeEventListener('abort', stop); }
    },
    dispose() { signal.removeEventListener('abort', cancel); }
  };
}
export type ContentExportOperation = ReturnType<typeof createContentExportOperation>;
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonical(entry)]));
  return value;
}
export function serializeContentExport(value: unknown): string { return JSON.stringify(canonical(value)); }
const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && !id.includes('/') && id !== '.' && id !== '..' && Buffer.byteLength(id) <= 1500;

/** Bounded schema-defined subject data only; never a full estate export claim. */
export async function collectContentSubjectExport(args: {
  uid: string; requestId: string; store: ContentExportStore; signal: AbortSignal;
  requireCurrent: () => Promise<void>; now?: () => number; operation?: ContentExportOperation;
}) {
  if (!validId(args.uid) || !validId(args.requestId)) throw new ContentExportError('export_source_invalid');
  const operation = args.operation ?? createContentExportOperation(args.signal, args.now);
  let records = 0, queries = 0, bytes = 0;
  const collections: Record<string, Array<{ id: string; record: Record<string, unknown> }>> = {};
  const authority = async () => { await operation.wait(args.requireCurrent); };

  async function readPage(page: ContentExportPage) {
    await authority();
    if (++queries > CONTENT_EXPORT_LIMITS.queries) throw new ContentExportError('export_limit');
    const result = await operation.wait(() => args.store.readPage(page));
    await authority();
    if (!Array.isArray(result) || result.length > page.limit) throw new ContentExportError('export_source_invalid');
    return result;
  }
  try {
    function append(collection: string, id: string, record: Record<string, unknown>) {
      const row = { id, record };
      bytes += Buffer.byteLength(serializeContentExport(row));
      if (++records > CONTENT_EXPORT_LIMITS.records || bytes > CONTENT_EXPORT_LIMITS.bytes) throw new ContentExportError('export_limit');
      collections[collection].push(row);
    }
    async function collect(collection: string, field: string, value: string, parse: (data: unknown, id: string) => Record<string, unknown>) {
      collections[collection] ??= [];
      let afterId: string | null = null;
      while (true) {
        const page = await readPage({ collection, field, value, afterId, limit: CONTENT_EXPORT_LIMITS.pageSize });
        for (const row of page) {
          // UTF-8 byte ordering matches Firestore document-name pagination.
          if (!validId(row.id) || (afterId !== null && Buffer.compare(Buffer.from(row.id), Buffer.from(afterId)) <= 0)) throw new ContentExportError('export_source_invalid');
          let record: Record<string, unknown>;
          try { record = parse(row.data, row.id); }
          catch { throw new ContentExportError('export_source_invalid'); }
          append(collection, row.id, record);
          afterId = row.id;
        }
        if (page.length < CONTENT_EXPORT_LIMITS.pageSize) break;
      }
    }

    for (const source of directSources) {
      await collect(source.collection, source.field, args.uid, (data, id) => {
        const record = source.parse(data) as Record<string, unknown>;
        if (record[source.field] !== args.uid || ('id' in record && record.id !== id)) throw new ContentExportError('export_source_invalid');
        return record;
      });
    }
    collections.contentVersions = [];
    for (const content of collections.contentItems) {
      await collect('contentVersions', 'contentId', content.id, (data, id) => {
        const record = contentVersionRecordSchema.parse(data);
        if (record.contentId !== content.id || record.snapshot.id !== content.id || record.snapshot.createdBy !== args.uid
          || id !== `${content.id}-v${record.version}`) throw new ContentExportError('export_source_invalid');
        return record;
      });
    }
    await authority();
    // Collection snapshots can change during pagination; this describes the
    // actual bounded scan, not a transaction-wide point-in-time backup.
    const payload = {
      schemaVersion: 'urai-content-subject-export-v1', contributorId: 'urai-content',
      subjectUid: args.uid, collections,
      coverage: { complete: false, scope: 'schema-defined-owned-content-records',
        pendingCollections: CONTENT_EXPORT_PENDING_SCOPES, consistency: 'bounded-current-authority-scan',
        fields: 'Canonical schema-defined subject fields; unrecognized stored fields, reviewer identities, internal moderation notes and migration annotations are not exported.' }
    };
    const payloadJson = serializeContentExport(payload);
    const payloadBytes = Buffer.byteLength(payloadJson);
    if (payloadBytes > CONTENT_EXPORT_LIMITS.bytes) throw new ContentExportError('export_limit');
    const payloadSha256 = createHash('sha256').update(payloadJson).digest('hex');
    const manifest = {
      requestId: args.requestId, contributorId: 'urai-content', subjectUid: args.uid,
      complete: false, collectionCounts: Object.fromEntries(Object.entries(collections).map(([key, value]) => [key, value.length])),
      recordCount: records, payloadBytes, payloadSha256,
      scope: payload.coverage.scope, pendingCollections: CONTENT_EXPORT_PENDING_SCOPES,
      artifactPersisted: false, providerDeliveryVerified: false
    };
    const body = serializeContentExport({ manifest, payload });
    if (Buffer.byteLength(body) > CONTENT_EXPORT_LIMITS.bytes) throw new ContentExportError('export_limit');
    await authority();
    return { body, payloadSha256, manifest };
  } finally { if (!args.operation) operation.dispose(); }
}
