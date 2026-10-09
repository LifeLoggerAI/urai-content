import 'server-only';
import { randomUUID } from 'node:crypto';

// Canonical contract: urai-privacy@3c28e41, consent-api.ts and
// consent-decision.ts. No local receipt, token claim or successful HTTP status
// can replace the canonical service's current consent and deletion decision.
export type ContentConsentPurpose = 'memory.storage' | 'data.export' | 'behavior.passive-context';
const tiers: Record<ContentConsentPurpose, string> = {
  'memory.storage': 'C1', 'data.export': 'C7', 'behavior.passive-context': 'C2'
};
const POLICY_VERSION = '1.0.0';
const MAX_RESPONSE_BYTES = 16_384;

export function contentRequestConsentPurpose(request: Request): ContentConsentPurpose | null {
  const path = new URL(request.url).pathname;
  // These are the actual mounted private creator-source consumers. Public
  // catalog, login, account recovery and administrative queues are not blanket
  // processing consent gates. Other consumers require their own target binding.
  return /^\/api\/creator\/submissions(?:\/[^/]+)?\/?$/.test(path) ? 'memory.storage' : null;
}

export async function evaluateContentCanonicalConsent(
  request: Request,
  uid: string,
  purpose: ContentConsentPurpose,
  transport: typeof fetch = fetch
): Promise<boolean> {
  const project = process.env.URAI_CONTENT_PRIVACY_PROJECT_ID;
  const region = process.env.URAI_CONTENT_PRIVACY_REGION;
  // Bind explicitly only after protected runtime authority is provisioned.
  // Never infer that the Content database is the canonical Privacy project.
  if (!project || !/^[a-z][a-z0-9-]{4,62}$/.test(project)
    || !region || !/^[a-z]+-[a-z]+[0-9]$/.test(region)) return false;
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim() || !uid) return false;
  const correlationId = randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await transport(`https://${region}-${project}.cloudfunctions.net/evaluateCanonicalConsent`, {
      method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit',
      headers: { authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ data: { targetUid: uid, purpose, correlationId } }),
      signal: controller.signal
    });
    if (!response.ok || !response.body) return false;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); return false; }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const envelope = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const result = envelope?.result;
    const evaluatedAt = typeof result?.evaluatedAt === 'string' ? Date.parse(result.evaluatedAt) : NaN;
    const age = Date.now() - evaluatedAt;
    return !envelope.error && result?.allowed === true && result.reason === 'ALLOWED'
      && result.targetUid === uid && result.purpose === purpose && result.correlationId === correlationId
      && result.policyVersion === POLICY_VERSION && result.requiredTier === tiers[purpose]
      && typeof result.decisionEventId === 'string' && result.decisionEventId.length > 0
      && Number.isFinite(age) && age >= -5000 && age <= 30_000;
  } catch {
    // Return no provider payload, source detail, endpoint, or Bearer token.
    return false;
  } finally { clearTimeout(timeout); }
}
