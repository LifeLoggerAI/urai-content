/** Canonical seed identity checks. Durable seed publication remains disabled. */
export type CanonicalSeedIdentity = {
  id: string; slug: string; createdBy: string; sourceLabel: string;
};
export class CanonicalSeedIdentityError extends Error {
  constructor() {
    super('Canonical seed identity collision');
    this.name = 'CanonicalSeedIdentityError';
  }
}
/** Check only matching canonical JSON identities; this preflight is not an atomic durable fence. */
export function assertCanonicalSeedIdentity(
  existing: Partial<CanonicalSeedIdentity> | null | undefined,
  proposed: CanonicalSeedIdentity
): void {
  if (!proposed.id || !proposed.slug || proposed.createdBy !== 'canonical-json' || !proposed.sourceLabel) {
    throw new CanonicalSeedIdentityError();
  }
  if (existing == null) return;
  if (existing.id !== proposed.id || existing.slug !== proposed.slug ||
      existing.createdBy !== 'canonical-json' || existing.sourceLabel !== proposed.sourceLabel) {
    throw new CanonicalSeedIdentityError();
  }
}
