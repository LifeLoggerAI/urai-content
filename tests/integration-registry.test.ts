import { describe, expect, it } from 'vitest';
import { CONTENT_INTEGRATION_REGISTRY, validateContentIntegrationRegistry } from '../src/integrations/registry.js';

describe('Content system-of-systems registry',()=>{
 it('locks single domain owners instead of duplicating Privacy, Jobs or Asset Factory',()=>{
   const registry=validateContentIntegrationRegistry();
   expect(registry.find((x)=>x.ownsPrivateUserDataPolicy)?.system).toBe('urai-privacy');
   expect(registry.find((x)=>x.ownsDurableJobs)?.system).toBe('urai-jobs');
   expect(registry.find((x)=>x.ownsAssetPromotion)?.system).toBe('asset-factory');
 });
 it('rejects duplicate domain systems',()=>{
   expect(()=>validateContentIntegrationRegistry([...CONTENT_INTEGRATION_REGISTRY,{...CONTENT_INTEGRATION_REGISTRY[0],id:'duplicate'}])).toThrow('Duplicate integration system');
 });
});
