import { describe, expect, it } from 'vitest';
import { assertCreatorModerationIntegrity } from '../src/backend/creatorModerationIntegrity.js';

const old = { id:'submission-1', creatorId:'owner-1', status:'submitted', updatedAt:'2026-11-08T11:00:00.000Z' };
const next = { ...old, status:'approved', moderatedAt:'2026-11-08T11:01:00.000Z', updatedAt:'2026-11-08T11:01:00.000Z', moderatedBy:'moderator-1' };
const audit = { id:'audit-1', entityType:'creatorSubmission', entityId:next.id, status:'approved', decision:'approved', moderatedAt:next.moderatedAt, moderatedBy:next.moderatedBy };

describe('creator moderation and audit integrity',()=>{
  it('admits internally consistent audited transition',()=>{
    expect(()=>assertCreatorModerationIntegrity(old,next,audit,old.updatedAt)).not.toThrow();
  });
  it('rejects stale owner revisions without altering a state',()=>{
    expect(()=>assertCreatorModerationIntegrity({...old,updatedAt:'2026-11-08T11:00:30.000Z'},next,audit,old.updatedAt)).toThrow('stale');
  });
  it('rejects owner and record reassignment',()=>{
    for(const changed of [null,{...old,creatorId:'other'},{...old,id:'other'}])
      expect(()=>assertCreatorModerationIntegrity(changed,next,audit,old.updatedAt)).toThrow('identity mismatch');
  });
  it('rejects wrong audit binding, decision or actor',()=>{
    for(const changed of [{entityId:'other'},{entityType:'contentItem'},{decision:'rejected'},{moderatedBy:'other'}])
      expect(()=>assertCreatorModerationIntegrity(old,next,{...audit,...changed},old.updatedAt)).toThrow();
  });
  it('rejects altered moderation timestamp and nonmoderation status',()=>{
    expect(()=>assertCreatorModerationIntegrity(old,{...next,updatedAt:'2026-11-08T11:03:00.000Z'},audit,old.updatedAt)).toThrow('actor/time');
    expect(()=>assertCreatorModerationIntegrity(old,{...next,status:'submitted'},audit,old.updatedAt)).toThrow('decision');
  });
  it('rejects unchanged revision timestamps to prevent same-millisecond races',()=>{
    const same = { ...next, updatedAt: old.updatedAt, moderatedAt: old.updatedAt };
    expect(()=>assertCreatorModerationIntegrity(old, same, { ...audit, moderatedAt: old.updatedAt }, old.updatedAt)).toThrow('nonmonotonic');
  });
});
