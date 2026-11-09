import 'server-only';

/**
 * Review-only release interlock for Content's private creator mutations.
 *
 * Privacy's canonical C1 decision and Content's Firestore writes currently
 * live in separate consistency domains. Checking C1 before/after the write
 * does NOT stop a transaction already started before revocation.
 *
 * No environment variable or caller-supplied receipt may override this gate.
 * Replace it only with an independently reviewed, tested commit-time
 * authority protocol coordinated with canonical Privacy, including a
 * revocation acknowledgement barrier and downstream purge guarantees.
 */
export const PRIVATE_MUTATION_HOLD_ERROR = 'private_mutation_fence_unavailable' as const;

export function isPrivateContentMutationHeld(runtime: string | undefined = process.env.NODE_ENV): boolean {
  return runtime === 'production';
}
