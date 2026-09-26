import { describe, expect, it } from 'vitest';
import { analyzeLocaleCoverage } from '../src/localization/coverage.js';

const digest='sha256:'+'a'.repeat(64);
describe('localization coverage reporting',()=>{
 it('reports missing and stale translations without manufacturing completion',()=>{
   const report=analyzeLocaleCoverage(['a','b'],[{
     entityId:'a',locale:'es',sourceLocale:'en',sourceVersion:'old',sourceChecksum:digest,
     translatedFields:{title:'A'},status:'approved',provenanceRecordId:'p1',reviewerId:'r',reviewedAt:'2026-09-23T00:00:00.000Z'
   }],{a:{version:'new',checksum:digest},b:{version:'1',checksum:digest}});
   const es=report.find((x)=>x.locale==='es')!;
   expect(es.missingEntityIds).toEqual(['b']);
   expect(es.staleEntityIds).toEqual(['a']);
   expect(es.productionReady).toBe(false);
 });
});
