import { createHash } from 'node:crypto';

export type PortableRecordRef = {
  entityType: string;
  entityId: string;
  version: string;
  checksum: string;
  provenanceRecordId: string;
};

export type PortableContentPackage = {
  format: 'urai-portable-content';
  version: '1.0.0';
  packageId: string;
  ownerId: string;
  createdAt: string;
  records: PortableRecordRef[];
  artifactManifestChecksums: string[];
  packageChecksum: string;
};

const checksumPattern = /^sha256:[a-f0-9]{64}$/i;

function sha(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function createPortableContentPackage(
  input: Omit<PortableContentPackage, 'format' | 'version' | 'packageChecksum' | 'records' | 'artifactManifestChecksums'> & {
    records: PortableRecordRef[];
    artifactManifestChecksums: string[];
  },
): PortableContentPackage {
  if (!input.packageId || !input.ownerId || !input.createdAt) {
    throw new Error('Portable package identity is required');
  }

  const records = [...input.records].map((record) => {
    if (!record.entityType || !record.entityId || !record.version || !record.provenanceRecordId || !checksumPattern.test(record.checksum)) {
      throw new Error('Portable record reference is incomplete');
    }
    return { ...record };
  }).sort((a, b) => (a.entityType + ':' + a.entityId).localeCompare(b.entityType + ':' + b.entityId));

  const artifactManifestChecksums = [...new Set(input.artifactManifestChecksums)].sort();
  if (artifactManifestChecksums.some((value) => !checksumPattern.test(value))) {
    throw new Error('Portable package artifact manifest checksum is invalid');
  }

  const payload = {
    format: 'urai-portable-content' as const,
    version: '1.0.0' as const,
    packageId: input.packageId,
    ownerId: input.ownerId,
    createdAt: input.createdAt,
    records,
    artifactManifestChecksums,
  };

  return { ...payload, packageChecksum: sha(payload) };
}

export function verifyPortableContentPackage(pkg: PortableContentPackage): boolean {
  const rebuilt = createPortableContentPackage({
    packageId: pkg.packageId,
    ownerId: pkg.ownerId,
    createdAt: pkg.createdAt,
    records: pkg.records,
    artifactManifestChecksums: pkg.artifactManifestChecksums,
  });
  return rebuilt.packageChecksum === pkg.packageChecksum;
}
