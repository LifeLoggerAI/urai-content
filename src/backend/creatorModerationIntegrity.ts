/** Validate one moderator status transition against its immutable audit record.
 * This pure assertion must run inside the persistence transaction before writes.
 * It is not a substitute for current authenticated role/consent checks.
 */
type Submission = {
  id: string; creatorId: string; updatedAt: string; status: string;
  moderatedAt?: string; moderatedBy?: string | null;
};
type Audit = {
  id: string; entityId: string; entityType: string; status: string;
  decision?: string; moderatedAt?: string; moderatedBy?: string;
};
const decisions = new Set(['approved', 'rejected', 'changes_requested']);

export function assertCreatorModerationIntegrity(
  previous: Submission | null,
  next: Submission,
  audit: Audit,
  expectedUpdatedAt: string,
): void {
  if (!previous || !previous.id || !next || previous.id !== next.id || previous.creatorId !== next.creatorId) {
    throw new Error('Creator moderation identity mismatch');
  }
  if (!expectedUpdatedAt || previous.updatedAt !== expectedUpdatedAt) {
    throw new Error('Creator moderation stale submission revision');
  }
  if (!decisions.has(next.status) || !audit || !audit.id || audit.entityType !== 'creatorSubmission' ||
      audit.entityId !== next.id || audit.status !== next.status || audit.decision !== next.status) {
    throw new Error('Creator moderation audit decision mismatch');
  }
  if (!next.moderatedAt || !next.moderatedBy || !Number.isFinite(Date.parse(next.updatedAt)) ||
      !Number.isFinite(Date.parse(previous.updatedAt)) || Date.parse(next.updatedAt) <= Date.parse(previous.updatedAt)) {
    throw new Error('Creator moderation nonmonotonic revision timestamp');
  }
  if (next.updatedAt !== next.moderatedAt ||
      audit.moderatedAt !== next.moderatedAt || audit.moderatedBy !== next.moderatedBy) {
    throw new Error('Creator moderation audit actor/time mismatch');
  }
}
