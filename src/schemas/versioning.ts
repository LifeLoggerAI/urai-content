import { z } from 'zod';
import { contentItemSchema, type ContentItem } from './content.js';

export const CURRENT_CONTENT_SCHEMA_VERSION = 1 as const;

export const versionedContentItemSchema = contentItemSchema.extend({
  schemaVersion: z.literal(CURRENT_CONTENT_SCHEMA_VERSION),
});

export type VersionedContentItem = z.infer<typeof versionedContentItemSchema>;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Content record must be an object');
  }
  return value as UnknownRecord;
}

export function migrateContentRecord(input: unknown): VersionedContentItem {
  const record = asRecord(input);
  const rawVersion = record.schemaVersion;

  if (rawVersion === undefined || rawVersion === 0) {
    return versionedContentItemSchema.parse({ ...record, schemaVersion: CURRENT_CONTENT_SCHEMA_VERSION });
  }

  if (rawVersion !== CURRENT_CONTENT_SCHEMA_VERSION) {
    throw new Error('Unsupported content schema version: ' + String(rawVersion));
  }

  return versionedContentItemSchema.parse(record);
}

export function stripContentSchemaEnvelope(input: unknown): ContentItem {
  const migrated = migrateContentRecord(input);
  const { schemaVersion, ...content } = migrated;
  void schemaVersion;
  return contentItemSchema.parse(content);
}

export function canReadContentSchemaVersion(version: unknown): boolean {
  return version === undefined || version === 0 || version === CURRENT_CONTENT_SCHEMA_VERSION;
}
