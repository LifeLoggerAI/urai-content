import { describe, expect, it } from 'vitest';
import { syndicationIsDeliverable, validateSyndicationGrant } from '../src/syndication/contracts.js';

const grant={
 id:'s1',contentPackageId:'p1',tenantId:'tenant-1',destinationId:'partner-1',state:'active' as const,version:'1',
 licenseId:'lic-1',rightsEvidenceRefs:['e1'],territories:['US'],attribution:null,
 startsAt:'2026-09-01T00:00:00.000Z',expiresAt:'2026-10-01T00:00:00.000Z',revokedAt:null,
 provenanceRecordId:'prov-1',approvedBy:'reviewer',approvedAt:'2026-08-31T00:00:00.000Z'
};

describe('B2B syndication foundation', () => {
 it('allows only active approved grants inside their time boundary',()=>{
   const valid=validateSyndicationGrant(grant);
   expect(syndicationIsDeliverable(valid,'2026-09-23T00:00:00.000Z')).toBe(true);
   expect(syndicationIsDeliverable(valid,'2026-10-02T00:00:00.000Z')).toBe(false);
 });
 it('fails closed when active delivery lacks human approval',()=>{
   expect(()=>validateSyndicationGrant({...grant,approvedBy:null,approvedAt:null})).toThrow('human approval');
 });
});
