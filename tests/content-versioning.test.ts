import { describe, expect, it } from 'vitest';
import {
  CURRENT_CONTENT_SCHEMA_VERSION,
  canReadContentSchemaVersion,
  migrateContentRecord,
  stripContentSchemaEnvelope,
} from '../src/schemas/versioning.js';

const base = {
  id: 'content-1',
  slug: 'content-1',
  title: 'Content',
  body: 'Body',
  tags: [],
  locale: 'en-US',
  status: 'draft' as const,
  visibility: 'private' as const,
  createdBy: 'operator',
  updatedAt: '2026-09-23T12:00:00.000Z',
  createdAt: '2026-09-23T12:00:00.000Z',
  sourceLabel: 'fixture',
  whyShownCopy: 'fixture',
  safetyNotes: [],
  contentType: 'story' as const,
};

describe('content schema versioning', () => {
  it('migrates legacy unversioned records deterministically to v1', () => {
    const migrated = migrateContentRecord(base);
    expect(migrated.schemaVersion).toBe(CURRENT_CONTENT_SCHEMA_VERSION);
    expect(stripContentSchemaEnvelope(migrated)).toMatchObject(base);
  });

  it('is idempotent for current-version records', () => {
    const once = migrateContentRecord(base);
    const twice = migrateContentRecord(once);
    expect(twice).toEqual(once);
  });

  it('fails closed for malformed and future schema versions', () => {
    expect(() => migrateContentRecord(null)).toThrow('must be an object');
    expect(() => migrateContentRecord({ ...base, schemaVersion: 999 })).toThrow('Unsupported content schema version');
    expect(canReadContentSchemaVersion(999)).toBe(false);
  });
});
