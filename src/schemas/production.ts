import { z } from 'zod';
import { exportKindSchema, uraiTierSchema } from './system.js';

export const productionStatusSchema = z.enum(['draft', 'review', 'published', 'archived', 'suspended']);
export const exportJobStatusSchema = z.enum(['queued', 'processing', 'complete', 'failed']);
export const safetyClassificationSchema = z.enum(['standard', 'sensitive', 'clinicalAdjacent', 'licensingSensitive']);
export const licenseScopeSchema = z.enum(['personal', 'creatorPortfolio', 'studioCampaign', 'enterpriseInternal', 'licensedDistribution', 'publicGood']);

export const auditMetadataSchema = z.object({
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  reviewedBy: z.string().nullable(),
  reviewNotes: z.string().optional(),
  source: z.enum(['manual', 'seed', 'import', 'adapter', 'system'])
});

export const provenanceRecordSchema = z.object({
  id: z.string().min(1),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  action: z.string().min(1),
  actorId: z.string().nullable(),
  sourceSystem: z.string().min(1),
  timestamp: z.string().datetime(),
  evidence: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const consentRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  consentType: z.enum(['contentPersonalization', 'marketplacePurchase', 'creatorSubmission', 'exportGeneration', 'analytics', 'licensingReview']),
  granted: z.boolean(),
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  policyVersion: z.string().min(1),
  notes: z.string().optional()
});

export const assetManifestSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  status: productionStatusSchema,
  version: z.string().min(1),
  assets: z.array(z.object({
    id: z.string().min(1),
    kind: z.enum(['image', 'audio', 'video', 'caption', 'pdf', 'json', 'zip', 'fontReferenceOnly']),
    path: z.string().min(1),
    mimeType: z.string().min(1),
    checksum: z.string().min(1),
    altText: z.string().optional()
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  audit: auditMetadataSchema
});

export const contentPackSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  status: productionStatusSchema,
  version: z.string().min(1),
  tierVisibility: z.array(uraiTierSchema),
  safetyClassification: safetyClassificationSchema,
  itemIds: z.array(z.string()),
  assetManifestId: z.string().nullable(),
  localization: z.record(z.string(), z.object({ title: z.string(), description: z.string() })).default({}),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  audit: auditMetadataSchema
});

export const contentLicenseSchema = z.object({
  id: z.string().min(1),
  contentPackId: z.string().min(1),
  licenseeId: z.string().min(1),
  scope: licenseScopeSchema,
  status: productionStatusSchema,
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  territory: z.array(z.string()),
  allowedUses: z.array(z.string()),
  prohibitedUses: z.array(z.string()),
  royaltyNotes: z.string(),
  provenanceRecordId: z.string().min(1),
  audit: auditMetadataSchema
});

export const exportJobSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: exportKindSchema,
  status: exportJobStatusSchema,
  retryCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  outputUrls: z.array(z.string().url()),
  checksum: z.string().nullable(),
  entitlementKey: z.string().min(1),
  provenanceRecordId: z.string().min(1),
  errorMessage: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const seoPageSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  canonicalUrl: z.string().url(),
  openGraphImage: z.string().min(1),
  status: productionStatusSchema,
  schemaOrgType: z.string().min(1),
  noIndex: z.boolean(),
  updatedAt: z.string().datetime(),
  audit: auditMetadataSchema
});

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
export type ProvenanceRecord = z.infer<typeof provenanceRecordSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type ContentPack = z.infer<typeof contentPackSchema>;
export type ContentLicense = z.infer<typeof contentLicenseSchema>;
export type ExportJob = z.infer<typeof exportJobSchema>;
export type SeoPage = z.infer<typeof seoPageSchema>;
