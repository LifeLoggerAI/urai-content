// Public catalog membership is a separate, denormalized Firestore index.
// The flag is never authority to publish by itself: status, visibility, deletion
// state, provenance and reviewer-approved release policy remain separate gates.
export const PUBLIC_CATALOG_ELIGIBILITY_FIELD = 'publicCatalogEligible' as const;

export function isPublicCatalogEligible(item: { status: string; visibility: string }): boolean {
  return item.status === 'published' && item.visibility === 'public';
}

/**
 * The persisted index must be explicitly true AND agree with the content state.
 * This is only a negative public-read gate: a caller-supplied boolean is not
 * a signed publication decision, owner consent, provenance, or rights evidence.
 */
export function isExplicitlyIndexedPublicRecord(record: {
  status: string;
  visibility: string;
  publicCatalogEligible?: boolean;
  deletion?: { state?: string } | null;
}): boolean {
  return record.publicCatalogEligible === true
    && isPublicCatalogEligible(record)
    && record.deletion?.state !== 'retained_for_restore';
}
