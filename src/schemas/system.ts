import { z } from 'zod';

export const uraiTierSchema = z.enum([
  'free',
  'plus',
  'pro',
  'creator',
  'studio',
  'enterprise',
  'foundation',
  'licensingPartner',
  'internalAdmin'
]);

export const lifecycleStatusSchema = z.enum([
  'planned',
  'design',
  'implementation',
  'review',
  'ready',
  'live',
  'blocked',
  'archived'
]);

export const deploymentSurfaceSchema = z.enum([
  'package',
  'standaloneWeb',
  'firebaseFunctions',
  'firebaseHosting',
  'adminApp',
  'creatorPortal',
  'marketplace',
  'externalAdapter'
]);

export const exportKindSchema = z.enum([
  'pdfWeeklyRecap',
  'pdfStoryPack',
  'pngRitualCard',
  'pngInsightCard',
  'srtCaptions',
  'narratorScriptPack',
  'voiceScriptPack',
  'capcutMetadataBundle',
  'creatorMediaKit',
  'contentPackManifest',
  'licenseEvidencePack',
  'socialSharePreview'
]);

export const tierConfigSchema = z.object({
  id: uraiTierSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  publicContentAccess: z.array(z.string()),
  marketplaceAccess: z.array(z.string()),
  exportLimits: z.record(exportKindSchema, z.number().int().nonnegative()),
  creatorTools: z.array(z.string()),
  adminRights: z.array(z.string()),
  licensingRights: z.array(z.string()),
  analyticsVisibility: z.array(z.string()),
  storageGbLimit: z.number().nonnegative(),
  upgradePrompt: z.string().min(1),
  stripePriceKey: z.string().nullable(),
  entitlementKeys: z.array(z.string())
});

export const roadmapPhaseSchema = z.object({
  id: z.string().min(1),
  version: z.enum(['v1', 'v2', 'v3', 'v4', 'v5']),
  title: z.string().min(1),
  status: lifecycleStatusSchema,
  summary: z.string().min(1),
  goals: z.array(z.string().min(1)),
  doneCriteria: z.array(z.string().min(1)),
  surfaces: z.array(deploymentSurfaceSchema),
  requiredForStandalone: z.boolean(),
  requiredForEcosystem: z.boolean()
});

export const expansionModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: lifecycleStatusSchema,
  summary: z.string().min(1),
  tierMapping: z.array(uraiTierSchema),
  publicVisibility: z.enum(['public', 'authenticated', 'adminOnly', 'partnerOnly']),
  integrationNotes: z.string().min(1),
  seedExample: z.object({
    contentSlug: z.string().min(1),
    previewTitle: z.string().min(1),
    previewCopy: z.string().min(1)
  }),
  adminControls: z.array(z.string()),
  safetyClass: z.enum(['standard', 'sensitive', 'clinicalAdjacent', 'licensingSensitive'])
});

export const systemIntegrationSchema = z.object({
  id: z.string().min(1),
  systemName: z.string().min(1),
  status: lifecycleStatusSchema,
  direction: z.enum(['inbound', 'outbound', 'bidirectional']),
  contractOwner: z.string().min(1),
  adapterInterface: z.string().min(1),
  requiredSecrets: z.array(z.string()),
  requiredCollections: z.array(z.string()),
  fallbackMode: z.string().min(1),
  testStrategy: z.string().min(1)
});

export const deploymentStatusSchema = z.object({
  id: z.string().min(1),
  surface: deploymentSurfaceSchema,
  status: lifecycleStatusSchema,
  url: z.string().url().nullable(),
  blockers: z.array(z.string()),
  verificationCommand: z.string().min(1),
  lastVerifiedAt: z.string().datetime().nullable(),
  ownerActionRequired: z.array(z.string())
});

export type UraiTier = z.infer<typeof uraiTierSchema>;
export type TierConfig = z.infer<typeof tierConfigSchema>;
export type RoadmapPhase = z.infer<typeof roadmapPhaseSchema>;
export type ExpansionModule = z.infer<typeof expansionModuleSchema>;
export type SystemIntegration = z.infer<typeof systemIntegrationSchema>;
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;
