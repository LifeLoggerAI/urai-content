import { createHash } from 'node:crypto';

export type ContentIntegrationOwner =
  | 'urai-content'
  | 'urai-privacy'
  | 'urai-jobs'
  | 'asset-factory'
  | 'urai-spatial'
  | 'urai-studio'
  | 'urai-storytime'
  | 'urai-analytics'
  | 'urai-marketing'
  | 'urai-communications'
  | 'b2bportal';

export type ContentIntegrationMode = 'disabled' | 'synthetic' | 'staging' | 'production';

export type ContentIntegrationEnvelope<T> = {
  contractVersion: '1.0.0';
  requestId: string;
  traceId: string;
  idempotencyKey: string;
  producer: ContentIntegrationOwner;
  consumer: ContentIntegrationOwner;
  mode: ContentIntegrationMode;
  contentId: string;
  contentVersion: string;
  locale: string;
  provenanceRecordId: string;
  consentRecordId: string | null;
  payloadChecksum: string;
  payload: T;
};

function checksum(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function createContentIntegrationEnvelope<T>(
  input: Omit<ContentIntegrationEnvelope<T>, 'contractVersion' | 'payloadChecksum'>,
): ContentIntegrationEnvelope<T> {
  if (!input.requestId || !input.traceId || !input.idempotencyKey || !input.contentId || !input.contentVersion || !input.locale || !input.provenanceRecordId) {
    throw new Error('Integration envelope identity, version, locale and provenance are required');
  }
  if (input.producer === input.consumer) throw new Error('Integration producer and consumer must be distinct');
  return { ...input, contractVersion: '1.0.0', payloadChecksum: checksum(input.payload) };
}

export function verifyContentIntegrationEnvelope<T>(envelope: ContentIntegrationEnvelope<T>): boolean {
  return envelope.contractVersion === '1.0.0' && envelope.payloadChecksum === checksum(envelope.payload);
}

export function assertIntegrationActivation(
  envelope: ContentIntegrationEnvelope<unknown>,
  allowedMode: ContentIntegrationMode,
): void {
  const rank: Record<ContentIntegrationMode, number> = { disabled: 0, synthetic: 1, staging: 2, production: 3 };
  if (rank[envelope.mode] > rank[allowedMode]) {
    throw new Error('Integration mode exceeds authorized activation boundary');
  }
}
