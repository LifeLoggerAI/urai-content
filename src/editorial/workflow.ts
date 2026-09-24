export type EditorialRole = 'author' | 'editor' | 'reviewer' | 'approver' | 'admin';
export type EditorialState = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type EditorialAction = 'edit' | 'submit_review' | 'request_changes' | 'approve' | 'publish' | 'archive' | 'restore';

export type EditorialDecision = {
  action: EditorialAction;
  actorId: string;
  actorRole: EditorialRole;
  notes: string | null;
  decidedAt: string;
};

const allowedRoles: Record<EditorialAction, EditorialRole[]> = {
  edit: ['author','editor','admin'],
  submit_review: ['author','editor','admin'],
  request_changes: ['reviewer','approver','admin'],
  approve: ['approver','admin'],
  publish: ['approver','admin'],
  archive: ['editor','approver','admin'],
  restore: ['approver','admin'],
};

const transitions: Record<EditorialAction, Partial<Record<EditorialState, EditorialState>>> = {
  edit: { draft:'draft', review:'review' },
  submit_review: { draft:'review' },
  request_changes: { review:'draft', approved:'review' },
  approve: { review:'approved' },
  publish: { approved:'published' },
  archive: { published:'archived' },
  restore: { archived:'approved' },
};

export function applyEditorialDecision(state: EditorialState, decision: EditorialDecision): EditorialState {
  if (!decision.actorId || !decision.decidedAt) throw new Error('Editorial decision requires actor identity and timestamp');
  if (!allowedRoles[decision.action].includes(decision.actorRole)) {
    throw new Error('Editorial role is not authorized for action');
  }
  if (decision.action === 'request_changes' && !decision.notes?.trim()) {
    throw new Error('Request changes requires decision notes');
  }
  const next=transitions[decision.action][state];
  if (!next) throw new Error('Illegal editorial transition: '+state+' via '+decision.action);
  return next;
}
