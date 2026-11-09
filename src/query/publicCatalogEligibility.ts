// Public catalog membership is a separate, denormalized Firestore index.
// The flag is never authority to publish by itself: status, visibility, deletion
// state, provenance and reviewer-approved release policy remain separate gates.
export const PUBLIC_CATALOG_ELIGIBILITY_FIELD = 'publicCatalogEligible' as const;

export function isPublicCatalogEligible(item: { status: string; visibility: string }): boolean {
  return item.status === 'published' && item.visibility === 'public';
}
