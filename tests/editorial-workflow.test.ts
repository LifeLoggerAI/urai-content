import { describe, expect, it } from 'vitest';
import { applyEditorialDecision } from '../src/editorial/workflow.js';

describe('editorial role workflow',()=>{
 it('separates author submission from approver publication',()=>{
   const review=applyEditorialDecision('draft',{action:'submit_review',actorId:'author',actorRole:'author',notes:null,decidedAt:'2026-09-23T00:00:00.000Z'});
   expect(review).toBe('review');
   expect(()=>applyEditorialDecision(review,{action:'approve',actorId:'author',actorRole:'author',notes:null,decidedAt:'2026-09-23T00:01:00.000Z'})).toThrow('not authorized');
   const approved=applyEditorialDecision(review,{action:'approve',actorId:'approver',actorRole:'approver',notes:null,decidedAt:'2026-09-23T00:02:00.000Z'});
   expect(applyEditorialDecision(approved,{action:'publish',actorId:'approver',actorRole:'approver',notes:null,decidedAt:'2026-09-23T00:03:00.000Z'})).toBe('published');
 });
 it('requires review notes when returning work',()=>{
   expect(()=>applyEditorialDecision('review',{action:'request_changes',actorId:'reviewer',actorRole:'reviewer',notes:null,decidedAt:'2026-09-23T00:00:00.000Z'})).toThrow('decision notes');
 });
});
