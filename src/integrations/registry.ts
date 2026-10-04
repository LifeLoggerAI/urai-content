import type { ContentIntegrationMode, ContentIntegrationOwner } from './envelope.js';

export type ContentIntegrationRegistration = {
  id: string;
  system: ContentIntegrationOwner;
  domainAuthority: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  launchMaxMode: ContentIntegrationMode;
  ownsPrivateUserDataPolicy: boolean;
  ownsDurableJobs: boolean;
  ownsAssetPromotion: boolean;
};

export const CONTENT_INTEGRATION_REGISTRY: ContentIntegrationRegistration[] = [
  {id:'privacy',system:'urai-privacy',domainAuthority:'consent-retention-export-delete',direction:'bidirectional',launchMaxMode:'disabled',ownsPrivateUserDataPolicy:true,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'jobs',system:'urai-jobs',domainAuthority:'durable-async-execution',direction:'bidirectional',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:true,ownsAssetPromotion:false},
  {id:'assets',system:'asset-factory',domainAuthority:'generated-asset-production-promotion',direction:'bidirectional',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:true},
  {id:'spatial',system:'urai-spatial',domainAuthority:'immersive-runtime-scene-consumption',direction:'outbound',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'studio',system:'urai-studio',domainAuthority:'creator-admin-authoring-orchestration',direction:'bidirectional',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'storytime',system:'urai-storytime',domainAuthority:'private-story-generation-share-lifecycle',direction:'bidirectional',launchMaxMode:'disabled',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'analytics',system:'urai-analytics',domainAuthority:'analytics-signal-processing',direction:'outbound',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'marketing',system:'urai-marketing',domainAuthority:'campaign-publication',direction:'outbound',launchMaxMode:'synthetic',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'communications',system:'urai-communications',domainAuthority:'provider-delivery',direction:'outbound',launchMaxMode:'disabled',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
  {id:'b2b',system:'b2bportal',domainAuthority:'enterprise-intake-account-operations',direction:'outbound',launchMaxMode:'disabled',ownsPrivateUserDataPolicy:false,ownsDurableJobs:false,ownsAssetPromotion:false},
];

export function validateContentIntegrationRegistry(registry=CONTENT_INTEGRATION_REGISTRY): ContentIntegrationRegistration[] {
  const ids=new Set<string>();
  const systems=new Set<string>();
  for(const item of registry){
    if(ids.has(item.id)) throw new Error('Duplicate integration id: '+item.id);
    if(systems.has(item.system)) throw new Error('Duplicate integration system: '+item.system);
    ids.add(item.id); systems.add(item.system);
  }
  if(registry.filter((item)=>item.ownsPrivateUserDataPolicy).length!==1) throw new Error('Exactly one privacy authority is required');
  if(registry.filter((item)=>item.ownsDurableJobs).length!==1) throw new Error('Exactly one durable Jobs authority is required');
  if(registry.filter((item)=>item.ownsAssetPromotion).length!==1) throw new Error('Exactly one asset-promotion authority is required');
  return registry.map((item)=>({...item}));
}
