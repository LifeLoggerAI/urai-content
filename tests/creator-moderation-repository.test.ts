import { describe, expect, it } from 'vitest';
import { InMemoryContentRepository } from '../src/backend/inMemoryRepository.js';

const source = {
  id: 'submission-1', creatorId: 'owner-1', title: 'Synthetic story', body: 'Fixture, not user data',
  contentType: 'story' as const, tags: ['fixture'], locale: 'en-US',
  status: 'submitted' as const, submittedAt: '2026-11-08T11:00:00.000Z', updatedAt: '2026-11-08T11:00:00.000Z'
};
const updated = '2026-11-08T11:01:00.000Z';
const next = { ...source, status: 'approved' as const, updatedAt: updated, moderatedAt: updated, moderatedBy: 'moderator-1' };
const audit = {
  id: 'audit-1', entityType: 'creatorSubmission' as const, entityId: source.id,
  status: 'approved' as const, decision: 'approved' as const,
  moderatedAt: updated, moderatedBy: 'moderator-1'
};

describe('in-memory moderation transaction parity for nonproduction fixture', () => {
  it('persists one status and one audit ID as one validated change', async () => {
    const repo = new InMemoryContentRepository();
    await repo.upsertCreatorSubmission(source);
    await repo.moderateCreatorSubmission(next, audit, source.updatedAt);
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({ status: 'approved', moderatedBy: 'moderator-1' });
    // Same-millisecond replay is first rejected by the monotonic revision
    // invariant. A separate newer decision tests duplicate audit ID denial.
    await expect(repo.moderateCreatorSubmission(next, audit, updated)).rejects.toThrow('nonmonotonic');
    const later = '2026-11-08T11:02:00.000Z';
    await expect(repo.moderateCreatorSubmission(
      { ...next, status: 'rejected', updatedAt: later, moderatedAt: later },
      { ...audit, status: 'rejected', decision: 'rejected', moderatedAt: later },
      updated
    )).rejects.toThrow('audit already exists');
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({ status: 'approved' });
  });
  it('denies stale replay before mutating an existing submission', async () => {
    const repo = new InMemoryContentRepository();
    await repo.upsertCreatorSubmission({ ...source, updatedAt: '2026-11-08T11:00:30.000Z' });
    await expect(repo.moderateCreatorSubmission(next, audit, source.updatedAt)).rejects.toThrow('stale submission');
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({ status: 'submitted' });
  });
  it('denies a foreign audit reviewer without persisting a status change', async () => {
    const repo = new InMemoryContentRepository();
    await repo.upsertCreatorSubmission(source);
    await expect(repo.moderateCreatorSubmission(next, { ...audit, moderatedBy: 'other' }, source.updatedAt)).rejects.toThrow('actor/time');
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({ status: 'submitted' });
  });
});

describe('in-memory create-only creator source parity', () => {
  it('does not replace previously saved content on duplicate owner ID', async () => {
    const repo = new InMemoryContentRepository();
    await repo.createCreatorSubmission(source);
    await expect(repo.createCreatorSubmission({...source,body:'updated'})).rejects.toThrow('ID is not available');
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({creatorId:'owner-1',body:'Fixture, not user data'});
  });
  it('does not replace another creator under a caller-supplied ID', async () => {
    const repo = new InMemoryContentRepository();
    await repo.createCreatorSubmission(source);
    await expect(repo.createCreatorSubmission({...source,creatorId:'other-owner'})).rejects.toThrow('ID is not available');
    expect(await repo.getCreatorSubmission(source.id)).toMatchObject({creatorId:'owner-1'});
  });
});
