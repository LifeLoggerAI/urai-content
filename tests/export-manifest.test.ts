import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createExportManifest,
  deriveIdempotencyKey,
  verifyExportManifest,
} from '../src/exports/manifest.js';

const digest = (value: string) => 'sha256:' + createHash('sha256').update(value).digest('hex');

describe('deterministic export manifests', () => {
  it('produces stable artifact ordering and manifest hashes', () => {
    const input = {
      jobId: 'export-synthetic-001',
      userId: 'synthetic-user',
      exportType: 'srtCaptions',
      generatedAt: '2026-09-23T12:00:00.000Z',
      provenanceRecordId: 'prov-synthetic-001',
      providerMode: 'mock' as const,
      artifacts: [
        {
          kind: 'script' as const,
          filename: 'story.txt',
          mimeType: 'text/plain',
          byteLength: 12,
          checksum: digest('story'),
          sourceRefs: ['memory-2', 'memory-1', 'memory-1'],
        },
        {
          kind: 'srt' as const,
          filename: 'story.srt',
          mimeType: 'application/x-subrip',
          byteLength: 24,
          checksum: digest('captions'),
          sourceRefs: ['memory-1'],
        },
      ],
    };

    const a = createExportManifest(input);
    const b = createExportManifest({ ...input, artifacts: [...input.artifacts].reverse() });

    expect(a.manifestChecksum).toBe(b.manifestChecksum);
    expect(a.artifacts.map((x) => x.kind)).toEqual(['script', 'srt']);
    expect(a.artifacts[0].sourceRefs).toEqual(['memory-1', 'memory-2']);
    expect(verifyExportManifest(a)).toBe(true);
  });

  it('rejects invalid or path-traversing artifacts', () => {
    expect(() => createExportManifest({
      jobId: 'job',
      userId: 'user',
      exportType: 'pdfWeeklyRecap',
      generatedAt: '2026-09-23T12:00:00.000Z',
      provenanceRecordId: 'prov',
      providerMode: 'local',
      artifacts: [{
        kind: 'pdf',
        filename: '../escape.pdf',
        mimeType: 'application/pdf',
        byteLength: 1,
        checksum: digest('x'),
        sourceRefs: [],
      }],
    })).toThrow('Invalid export filename');
  });

  it('derives idempotency independent of source ordering', () => {
    expect(deriveIdempotencyKey('job-1', 'srtCaptions', ['b', 'a']))
      .toBe(deriveIdempotencyKey('job-1', 'srtCaptions', ['a', 'b', 'a']));
  });
});
