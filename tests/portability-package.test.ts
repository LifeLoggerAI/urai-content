import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createPortableContentPackage, verifyPortableContentPackage } from '../src/portability/package.js';

const digest = (v: string) => 'sha256:' + createHash('sha256').update(v).digest('hex');

describe('portable content package', () => {
  it('creates a deterministic, provenance-bound manifest suitable for future re-import', () => {
    const pkg = createPortableContentPackage({
      packageId: 'portable-1',
      ownerId: 'synthetic-user',
      createdAt: '2026-09-23T12:00:00.000Z',
      records: [
        { entityType: 'content', entityId: 'b', version: '1', checksum: digest('b'), provenanceRecordId: 'pb' },
        { entityType: 'content', entityId: 'a', version: '1', checksum: digest('a'), provenanceRecordId: 'pa' },
      ],
      artifactManifestChecksums: [digest('artifact')],
    });
    expect(pkg.records.map((r) => r.entityId)).toEqual(['a', 'b']);
    expect(verifyPortableContentPackage(pkg)).toBe(true);
  });

  it('rejects unverifiable record checksums', () => {
    expect(() => createPortableContentPackage({
      packageId: 'portable-2',
      ownerId: 'synthetic-user',
      createdAt: '2026-09-23T12:00:00.000Z',
      records: [{ entityType: 'content', entityId: 'a', version: '1', checksum: 'unknown', provenanceRecordId: 'pa' }],
      artifactManifestChecksums: [],
    })).toThrow('incomplete');
  });
});
