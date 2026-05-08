import type {
  AssetManifest,
  ConsentRecord,
  ContentLicense,
  ContentPack,
  ExportJob,
  ProvenanceRecord,
  SeoPage
} from '../schemas/production.js';

const now = '2026-05-07T00:00:00.000Z';

const audit = {
  createdBy: 'system-seed',
  updatedBy: 'system-seed',
  reviewedBy: 'admin-seed',
  reviewNotes: 'Production-demo seed record for URAI Content OS validation.',
  source: 'seed' as const
};

export const provenanceRecords: ProvenanceRecord[] = [
  {
    id: 'prov-content-pack-memory-weather',
    entityId: 'pack-memory-weather',
    entityType: 'contentPack',
    action: 'seeded',
    actorId: 'system-seed',
    sourceSystem: 'urai-content',
    timestamp: now,
    evidence: ['AUDIT_REPORT.md', 'docs/STANDALONE_SYSTEM_PLAN.md'],
    metadata: { version: 'v1' }
  },
  {
    id: 'prov-license-studio-preview',
    entityId: 'license-studio-preview',
    entityType: 'contentLicense',
    action: 'seeded',
    actorId: 'system-seed',
    sourceSystem: 'urai-content',
    timestamp: now,
    evidence: ['DEPLOYMENT_BLOCKERS.md'],
    metadata: { scope: 'studioCampaign' }
  },
  {
    id: 'prov-export-demo-srt',
    entityId: 'export-demo-srt',
    entityType: 'exportJob',
    action: 'queued',
    actorId: 'demo-user',
    sourceSystem: 'urai-content',
    timestamp: now,
    evidence: ['src/seed/productionData.ts'],
    metadata: { type: 'srtCaptions' }
  }
];

export const consentRecords: ConsentRecord[] = [
  {
    id: 'consent-demo-export-generation',
    userId: 'demo-user',
    consentType: 'exportGeneration',
    granted: true,
    grantedAt: now,
    revokedAt: null,
    policyVersion: '2026-05-privacy-v1',
    notes: 'Demo user consent for export job generation.'
  },
  {
    id: 'consent-demo-analytics',
    userId: 'demo-user',
    consentType: 'analytics',
    granted: true,
    grantedAt: now,
    revokedAt: null,
    policyVersion: '2026-05-privacy-v1',
    notes: 'Demo analytics consent for seed workflows.'
  },
  {
    id: 'consent-creator-submission',
    userId: 'creator-seed',
    consentType: 'creatorSubmission',
    granted: true,
    grantedAt: now,
    revokedAt: null,
    policyVersion: '2026-05-creator-v1',
    notes: 'Creator accepts submission review and licensing workflow.'
  }
];

export const assetManifests: AssetManifest[] = [
  {
    id: 'assets-memory-weather-preview',
    slug: 'memory-weather-preview-assets',
    title: 'Memory Weather Preview Assets',
    status: 'published',
    version: '1.0.0',
    assets: [
      {
        id: 'asset-og-memory-weather',
        kind: 'image',
        path: '/assets/og/memory-weather-preview.png',
        mimeType: 'image/png',
        checksum: 'sha256-demo-og-memory-weather',
        altText: 'URAI Content memory weather preview card with soft aura gradients.'
      },
      {
        id: 'asset-srt-memory-weather',
        kind: 'caption',
        path: '/exports/demo/memory-weather.srt',
        mimeType: 'text/plain',
        checksum: 'sha256-demo-srt-memory-weather',
        altText: 'Caption file for demo memory weather story export.'
      }
    ],
    createdAt: now,
    updatedAt: now,
    audit
  },
  {
    id: 'assets-ritual-card-preview',
    slug: 'ritual-card-preview-assets',
    title: 'Ritual Card Preview Assets',
    status: 'published',
    version: '1.0.0',
    assets: [
      {
        id: 'asset-ritual-png',
        kind: 'image',
        path: '/assets/cards/ritual-card-preview.png',
        mimeType: 'image/png',
        checksum: 'sha256-demo-ritual-png',
        altText: 'A polished ritual preview card for URAI Content.'
      }
    ],
    createdAt: now,
    updatedAt: now,
    audit
  }
];

export const contentPacks: ContentPack[] = [
  {
    id: 'pack-memory-weather',
    slug: 'memory-weather-pack',
    title: 'Memory Weather Pack',
    description: 'A demo-ready content pack for Digital Mood Weather, memory reflection, narrator copy, and export previews.',
    status: 'published',
    version: '1.0.0',
    tierVisibility: ['free', 'plus', 'pro', 'creator', 'studio', 'enterprise', 'internalAdmin'],
    safetyClassification: 'standard',
    itemIds: ['digital-mood-weather-content', 'cognitive-mirror-content'],
    assetManifestId: 'assets-memory-weather-preview',
    localization: {
      'en-US': {
        title: 'Memory Weather Pack',
        description: 'A cinematic demo pack for mood, memory, and narrator content.'
      }
    },
    tags: ['mood', 'memory', 'narrator', 'demo'],
    createdAt: now,
    updatedAt: now,
    audit
  },
  {
    id: 'pack-ritual-library-starter',
    slug: 'ritual-library-starter',
    title: 'Ritual Library Starter',
    description: 'Starter rituals, safety copy, share-card text, and export metadata for URAI ritual flows.',
    status: 'published',
    version: '1.0.0',
    tierVisibility: ['plus', 'pro', 'creator', 'studio', 'enterprise', 'foundation', 'internalAdmin'],
    safetyClassification: 'sensitive',
    itemIds: ['ritual-library', 'foundation-public-good-content'],
    assetManifestId: 'assets-ritual-card-preview',
    localization: {},
    tags: ['ritual', 'export', 'wellbeing'],
    createdAt: now,
    updatedAt: now,
    audit
  },
  {
    id: 'pack-licensing-evidence',
    slug: 'licensing-evidence-pack',
    title: 'Licensing Evidence Pack',
    description: 'Partner-facing license evidence, provenance, asset manifest, and distribution-ready copy records.',
    status: 'review',
    version: '0.9.0',
    tierVisibility: ['enterprise', 'licensingPartner', 'internalAdmin'],
    safetyClassification: 'licensingSensitive',
    itemIds: ['licensing-ip-content', 'enterprise-content-packs'],
    assetManifestId: null,
    localization: {},
    tags: ['licensing', 'partner', 'provenance'],
    createdAt: now,
    updatedAt: now,
    audit
  }
];

export const contentLicenses: ContentLicense[] = [
  {
    id: 'license-studio-preview',
    contentPackId: 'pack-memory-weather',
    licenseeId: 'studio-demo-client',
    scope: 'studioCampaign',
    status: 'published',
    startsAt: now,
    expiresAt: null,
    territory: ['US'],
    allowedUses: ['private campaign preview', 'internal pitch deck', 'demo export'],
    prohibitedUses: ['clinical claims', 'resale', 'third-party model training'],
    royaltyNotes: 'Demo record only; production royalty terms must be generated by URAI Licensing.',
    provenanceRecordId: 'prov-license-studio-preview',
    audit
  },
  {
    id: 'license-foundation-accessibility',
    contentPackId: 'pack-ritual-library-starter',
    licenseeId: 'foundation-demo-program',
    scope: 'publicGood',
    status: 'review',
    startsAt: now,
    expiresAt: null,
    territory: ['US', 'CA'],
    allowedUses: ['accessibility pilot', 'community education'],
    prohibitedUses: ['paid resale', 'medical treatment representation'],
    royaltyNotes: 'Foundation/public-good use pending admin approval.',
    provenanceRecordId: 'prov-content-pack-memory-weather',
    audit
  }
];

export const exportJobs: ExportJob[] = [
  {
    id: 'export-demo-srt',
    userId: 'demo-user',
    type: 'srtCaptions',
    status: 'queued',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    outputUrls: [],
    checksum: null,
    entitlementKey: 'tier:plus',
    provenanceRecordId: 'prov-export-demo-srt',
    errorMessage: null,
    metadata: { storyTemplateId: 'memory-weather-story' }
  },
  {
    id: 'export-demo-ritual-card',
    userId: 'demo-user',
    type: 'pngRitualCard',
    status: 'complete',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    outputUrls: ['https://www.uraicontent.com/demo/exports/ritual-card-preview.png'],
    checksum: 'sha256-demo-ritual-card-output',
    entitlementKey: 'tier:free',
    provenanceRecordId: 'prov-content-pack-memory-weather',
    errorMessage: null,
    metadata: { ritualTemplateId: 'ritual-library-starter' }
  },
  {
    id: 'export-demo-license-evidence',
    userId: 'licensing-partner-demo',
    type: 'licenseEvidencePack',
    status: 'failed',
    retryCount: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    outputUrls: [],
    checksum: null,
    entitlementKey: 'tier:licensingPartner',
    provenanceRecordId: 'prov-license-studio-preview',
    errorMessage: 'Blocked until production licensing vault and partner credentials are configured.',
    metadata: { blocker: 'licensing-vault-unconfigured' }
  }
];

export const seoPages: SeoPage[] = [
  {
    id: 'seo-home',
    path: '/',
    title: 'URAI Content | The Publishing Engine for the URAI Emotional OS',
    description: 'Transform memory, mood, rituals, voice, insight, and story into beautiful exportable content with URAI Content.',
    canonicalUrl: 'https://www.uraicontent.com/',
    openGraphImage: '/og/urai-content-home.png',
    status: 'published',
    schemaOrgType: 'WebSite',
    noIndex: false,
    updatedAt: now,
    audit
  },
  {
    id: 'seo-marketplace',
    path: '/marketplace',
    title: 'URAI Content Marketplace',
    description: 'Browse URAI story templates, ritual packs, narrator scripts, voice packs, and licensing-ready content bundles.',
    canonicalUrl: 'https://www.uraicontent.com/marketplace',
    openGraphImage: '/og/urai-content-marketplace.png',
    status: 'published',
    schemaOrgType: 'CollectionPage',
    noIndex: false,
    updatedAt: now,
    audit
  },
  {
    id: 'seo-admin',
    path: '/admin',
    title: 'URAI Content Admin',
    description: 'Protected internal admin surface for URAI Content moderation, releases, tiers, exports, and licensing.',
    canonicalUrl: 'https://www.uraicontent.com/admin',
    openGraphImage: '/og/urai-content-admin.png',
    status: 'draft',
    schemaOrgType: 'WebPage',
    noIndex: true,
    updatedAt: now,
    audit
  }
];
