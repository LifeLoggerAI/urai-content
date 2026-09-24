import { createHash } from 'node:crypto';

export type ExportArtifact = {
  kind: 'pdf' | 'png' | 'srt' | 'script' | 'bundle' | 'licenseEvidence' | 'videoEditPackage';
  filename: string;
  mimeType: string;
  byteLength: number;
  checksum: string;
  sourceRefs: string[];
};

export type ExportManifest = {
  version: '1.0.0';
  jobId: string;
  userId: string;
  exportType: string;
  generatedAt: string;
  artifacts: ExportArtifact[];
  manifestChecksum: string;
  provenanceRecordId: string;
  providerMode: 'local' | 'mock' | 'provider';
};

function canonicalArtifact(artifact: ExportArtifact): ExportArtifact {
  if (!artifact.filename || artifact.filename.includes('..')) {
    throw new Error('Invalid export filename');
  }
  if (!artifact.mimeType || artifact.byteLength < 0 || !Number.isInteger(artifact.byteLength)) {
    throw new Error('Invalid export artifact metadata');
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(artifact.checksum)) {
    throw new Error('Export artifact checksum must be a full sha256 digest');
  }
  if (artifact.checksum.includes('demo') || artifact.checksum.includes('unverified')) {
    throw new Error('Demo/unverified export checksum is prohibited');
  }

  return {
    ...artifact,
    sourceRefs: [...new Set(artifact.sourceRefs)].sort(),
  };
}

function checksumPayload(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function createExportManifest(input: Omit<ExportManifest, 'version' | 'manifestChecksum' | 'artifacts'> & {
  artifacts: ExportArtifact[];
}): ExportManifest {
  if (!input.jobId || !input.userId || !input.exportType || !input.provenanceRecordId) {
    throw new Error('Export manifest identity and provenance are required');
  }
  if (input.artifacts.length === 0) throw new Error('Export manifest requires at least one artifact');

  const artifacts = input.artifacts
    .map(canonicalArtifact)
    .sort((a, b) => (a.kind + ':' + a.filename).localeCompare(b.kind + ':' + b.filename));

  const withoutChecksum = {
    version: '1.0.0' as const,
    jobId: input.jobId,
    userId: input.userId,
    exportType: input.exportType,
    generatedAt: input.generatedAt,
    artifacts,
    provenanceRecordId: input.provenanceRecordId,
    providerMode: input.providerMode,
  };

  return {
    ...withoutChecksum,
    manifestChecksum: checksumPayload(withoutChecksum),
  };
}

export function verifyExportManifest(manifest: ExportManifest): boolean {
  const rebuilt = createExportManifest({
    jobId: manifest.jobId,
    userId: manifest.userId,
    exportType: manifest.exportType,
    generatedAt: manifest.generatedAt,
    artifacts: manifest.artifacts,
    provenanceRecordId: manifest.provenanceRecordId,
    providerMode: manifest.providerMode,
  });
  return rebuilt.manifestChecksum === manifest.manifestChecksum;
}

export function deriveIdempotencyKey(jobId: string, exportType: string, sourceRefs: string[]): string {
  if (!jobId || !exportType) throw new Error('jobId and exportType are required');
  return checksumPayload({
    jobId,
    exportType,
    sourceRefs: [...new Set(sourceRefs)].sort(),
  });
}
