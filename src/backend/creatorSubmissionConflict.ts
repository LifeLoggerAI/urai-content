/** Creation conflicts are deliberately independent of the stored owner.
 * Server-side Firestore Admin SDK bypasses client security rules; a POST must
 * never upsert into a caller-selected existing document ID.
 */
export class CreatorSubmissionConflictError extends Error {
  constructor() {
    super('Creator submission ID is not available');
    this.name = 'CreatorSubmissionConflictError';
  }
}
