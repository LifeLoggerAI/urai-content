import type { DeploymentStatus, ExpansionModule, RoadmapPhase, SystemIntegration, TierConfig } from '../schemas/system.js';

export const tierConfigs: TierConfig[] = [
  {
    id: 'free',
    label: 'Free',
    description: 'Public URAI Content previews, sample rituals, demo stories, and introductory narrator scripts.',
    publicContentAccess: ['published_public', 'demo_catalog', 'sample_rituals'],
    marketplaceAccess: ['free_items'],
    exportLimits: {
      pdfWeeklyRecap: 0,
      pdfStoryPack: 0,
      pngRitualCard: 3,
      pngInsightCard: 3,
      srtCaptions: 0,
      narratorScriptPack: 1,
      voiceScriptPack: 0,
      capcutMetadataBundle: 0,
      creatorMediaKit: 0,
      contentPackManifest: 1,
      licenseEvidencePack: 0,
      socialSharePreview: 5
    },
    creatorTools: [],
    adminRights: [],
    licensingRights: ['personal_preview'],
    analyticsVisibility: ['own_basic_events'],
    storageGbLimit: 0.25,
    upgradePrompt: 'Unlock deeper story packs, export bundles, and marketplace rituals with Plus.',
    stripePriceKey: null,
    entitlementKeys: ['tier:free']
  },
  {
    id: 'plus',
    label: 'Plus',
    description: 'Expanded rituals, story templates, voice-ready scripts, and lightweight export rights.',
    publicContentAccess: ['published_public', 'plus_catalog', 'ritual_library'],
    marketplaceAccess: ['free_items', 'plus_items'],
    exportLimits: {
      pdfWeeklyRecap: 4,
      pdfStoryPack: 1,
      pngRitualCard: 20,
      pngInsightCard: 20,
      srtCaptions: 4,
      narratorScriptPack: 4,
      voiceScriptPack: 2,
      capcutMetadataBundle: 1,
      creatorMediaKit: 0,
      contentPackManifest: 4,
      licenseEvidencePack: 0,
      socialSharePreview: 50
    },
    creatorTools: [],
    adminRights: [],
    licensingRights: ['personal_use', 'private_share'],
    analyticsVisibility: ['own_basic_events', 'own_export_history'],
    storageGbLimit: 2,
    upgradePrompt: 'Move to Pro for full replay exports, marketplace access, and advanced narrator packs.',
    stripePriceKey: 'STRIPE_PRICE_PLUS',
    entitlementKeys: ['tier:free', 'tier:plus']
  },
  {
    id: 'pro',
    label: 'Pro',
    description: 'Full personal content OS access for advanced story, ritual, narrator, and export workflows.',
    publicContentAccess: ['published_public', 'plus_catalog', 'pro_catalog', 'advanced_replay_content'],
    marketplaceAccess: ['free_items', 'plus_items', 'pro_items', 'paid_items'],
    exportLimits: {
      pdfWeeklyRecap: 20,
      pdfStoryPack: 10,
      pngRitualCard: 100,
      pngInsightCard: 100,
      srtCaptions: 20,
      narratorScriptPack: 20,
      voiceScriptPack: 10,
      capcutMetadataBundle: 10,
      creatorMediaKit: 1,
      contentPackManifest: 20,
      licenseEvidencePack: 2,
      socialSharePreview: 250
    },
    creatorTools: ['draft_private_packs'],
    adminRights: [],
    licensingRights: ['personal_use', 'private_share', 'portfolio_preview'],
    analyticsVisibility: ['own_basic_events', 'own_export_history', 'own_marketplace_history'],
    storageGbLimit: 20,
    upgradePrompt: 'Upgrade to Studio when you are ready to publish, license, and manage creator-grade packs.',
    stripePriceKey: 'STRIPE_PRICE_PRO',
    entitlementKeys: ['tier:free', 'tier:plus', 'tier:pro']
  },
  {
    id: 'creator',
    label: 'Creator',
    description: 'Creator submission, review, marketplace publishing, and royalty-ready content management.',
    publicContentAccess: ['published_public', 'creator_catalog', 'pro_catalog'],
    marketplaceAccess: ['free_items', 'plus_items', 'pro_items', 'creator_items', 'paid_items'],
    exportLimits: {
      pdfWeeklyRecap: 40,
      pdfStoryPack: 25,
      pngRitualCard: 250,
      pngInsightCard: 250,
      srtCaptions: 50,
      narratorScriptPack: 50,
      voiceScriptPack: 25,
      capcutMetadataBundle: 25,
      creatorMediaKit: 10,
      contentPackManifest: 50,
      licenseEvidencePack: 10,
      socialSharePreview: 500
    },
    creatorTools: ['submit_content', 'manage_submissions', 'view_creator_status', 'create_media_kit'],
    adminRights: [],
    licensingRights: ['personal_use', 'commercial_preview', 'marketplace_submission'],
    analyticsVisibility: ['own_basic_events', 'own_export_history', 'creator_submission_metrics'],
    storageGbLimit: 50,
    upgradePrompt: 'Upgrade to Studio for team workflows, brand packs, and higher-volume publishing.',
    stripePriceKey: 'STRIPE_PRICE_CREATOR',
    entitlementKeys: ['tier:free', 'tier:plus', 'tier:pro', 'tier:creator']
  },
  {
    id: 'studio',
    label: 'Studio',
    description: 'Team-ready content operations for URAI Studio, Motion, Cinema, Music, and Visuals pipelines.',
    publicContentAccess: ['published_public', 'studio_catalog', 'creator_catalog', 'pro_catalog'],
    marketplaceAccess: ['all_public_marketplace', 'studio_items'],
    exportLimits: {
      pdfWeeklyRecap: 100,
      pdfStoryPack: 100,
      pngRitualCard: 1000,
      pngInsightCard: 1000,
      srtCaptions: 250,
      narratorScriptPack: 250,
      voiceScriptPack: 100,
      capcutMetadataBundle: 100,
      creatorMediaKit: 50,
      contentPackManifest: 250,
      licenseEvidencePack: 50,
      socialSharePreview: 2000
    },
    creatorTools: ['submit_content', 'manage_team_packs', 'create_brand_systems', 'export_campaigns'],
    adminRights: ['studio_content_review'],
    licensingRights: ['studio_use', 'campaign_use', 'client_preview'],
    analyticsVisibility: ['team_exports', 'campaign_metrics', 'creator_submission_metrics'],
    storageGbLimit: 250,
    upgradePrompt: 'Contact URAI for Enterprise deployment, compliance, and licensing operations.',
    stripePriceKey: 'STRIPE_PRICE_STUDIO',
    entitlementKeys: ['tier:free', 'tier:plus', 'tier:pro', 'tier:creator', 'tier:studio']
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Organization-scale deployment with custom compliance, marketplace, licensing, and admin controls.',
    publicContentAccess: ['enterprise_catalog', 'studio_catalog', 'all_public_content'],
    marketplaceAccess: ['enterprise_items', 'all_public_marketplace'],
    exportLimits: {
      pdfWeeklyRecap: 1000,
      pdfStoryPack: 1000,
      pngRitualCard: 10000,
      pngInsightCard: 10000,
      srtCaptions: 2500,
      narratorScriptPack: 2500,
      voiceScriptPack: 1000,
      capcutMetadataBundle: 1000,
      creatorMediaKit: 500,
      contentPackManifest: 2500,
      licenseEvidencePack: 500,
      socialSharePreview: 20000
    },
    creatorTools: ['organization_workflows', 'brand_governance', 'bulk_exports'],
    adminRights: ['enterprise_admin', 'moderation_review', 'tier_override'],
    licensingRights: ['enterprise_internal_use', 'contracted_distribution'],
    analyticsVisibility: ['organization_analytics', 'audit_logs', 'licensing_reports'],
    storageGbLimit: 2000,
    upgradePrompt: 'Work with URAI Labs for custom licensing and foundation-grade deployments.',
    stripePriceKey: 'STRIPE_PRICE_ENTERPRISE',
    entitlementKeys: ['tier:enterprise']
  },
  {
    id: 'foundation',
    label: 'Foundation',
    description: 'Public-good, research, accessibility, and community support content distribution.',
    publicContentAccess: ['foundation_catalog', 'accessibility_content', 'public_good_packs'],
    marketplaceAccess: ['free_items', 'foundation_items'],
    exportLimits: {
      pdfWeeklyRecap: 250,
      pdfStoryPack: 250,
      pngRitualCard: 2500,
      pngInsightCard: 2500,
      srtCaptions: 500,
      narratorScriptPack: 500,
      voiceScriptPack: 250,
      capcutMetadataBundle: 250,
      creatorMediaKit: 100,
      contentPackManifest: 500,
      licenseEvidencePack: 100,
      socialSharePreview: 5000
    },
    creatorTools: ['public_good_pack_submission', 'accessibility_pack_review'],
    adminRights: ['foundation_content_review'],
    licensingRights: ['public_good_distribution', 'grant_program_use'],
    analyticsVisibility: ['foundation_impact_metrics'],
    storageGbLimit: 500,
    upgradePrompt: 'Coordinate with URAI Labs for foundation deployment governance.',
    stripePriceKey: null,
    entitlementKeys: ['tier:foundation']
  },
  {
    id: 'licensingPartner',
    label: 'Licensing Partner',
    description: 'Partner access for licensed pattern libraries, content bundles, and distribution evidence packs.',
    publicContentAccess: ['licensed_catalog', 'partner_catalog'],
    marketplaceAccess: ['partner_items', 'licensed_items'],
    exportLimits: {
      pdfWeeklyRecap: 500,
      pdfStoryPack: 1000,
      pngRitualCard: 5000,
      pngInsightCard: 5000,
      srtCaptions: 2500,
      narratorScriptPack: 2500,
      voiceScriptPack: 1000,
      capcutMetadataBundle: 1000,
      creatorMediaKit: 500,
      contentPackManifest: 2500,
      licenseEvidencePack: 1000,
      socialSharePreview: 10000
    },
    creatorTools: ['partner_pack_review', 'licensed_bundle_exports'],
    adminRights: ['license_review', 'partner_catalog_access'],
    licensingRights: ['licensed_distribution', 'evidence_pack_generation'],
    analyticsVisibility: ['licensing_reports', 'partner_usage_metrics'],
    storageGbLimit: 1000,
    upgradePrompt: 'Contact URAI Licensing for expanded territories, formats, or catalog rights.',
    stripePriceKey: 'STRIPE_PRICE_LICENSING_PARTNER',
    entitlementKeys: ['tier:licensingPartner']
  },
  {
    id: 'internalAdmin',
    label: 'Internal Admin',
    description: 'URAI internal operator tier for moderation, publishing, audits, releases, and emergency controls.',
    publicContentAccess: ['all_content'],
    marketplaceAccess: ['all_marketplace'],
    exportLimits: {
      pdfWeeklyRecap: 999999,
      pdfStoryPack: 999999,
      pngRitualCard: 999999,
      pngInsightCard: 999999,
      srtCaptions: 999999,
      narratorScriptPack: 999999,
      voiceScriptPack: 999999,
      capcutMetadataBundle: 999999,
      creatorMediaKit: 999999,
      contentPackManifest: 999999,
      licenseEvidencePack: 999999,
      socialSharePreview: 999999
    },
    creatorTools: ['all_creator_tools'],
    adminRights: ['super_admin', 'moderation_review', 'tier_override', 'release_publish', 'safety_lock'],
    licensingRights: ['internal_operations'],
    analyticsVisibility: ['all_audit_logs', 'all_operational_metrics'],
    storageGbLimit: 999999,
    upgradePrompt: 'Internal use only.',
    stripePriceKey: null,
    entitlementKeys: ['tier:internalAdmin']
  }
];

export const roadmapPhases: RoadmapPhase[] = [
  {
    id: 'v1-public-content-foundation',
    version: 'v1',
    title: 'Public Content Foundation',
    status: 'ready',
    summary: 'Canonical public content, sample stories, sample rituals, demo records, SEO surfaces, and smoke validation.',
    goals: ['Validate public content records', 'Expose package exports', 'Seed demo catalog', 'Document standalone route requirements'],
    doneCriteria: ['content validation passes', 'seed check passes', 'public content records exist', 'audit report exists'],
    surfaces: ['package', 'standaloneWeb'],
    requiredForStandalone: true,
    requiredForEcosystem: true
  },
  {
    id: 'v2-content-os-core',
    version: 'v2',
    title: 'Content OS Core',
    status: 'implementation',
    summary: 'Typed contracts for content packs, narrator scripts, rituals, exports, moderation, provenance, tiers, and roadmap entities.',
    goals: ['Expand schema coverage', 'Model tiers', 'Model roadmap phases', 'Model integration contracts'],
    doneCriteria: ['system schemas compile', 'seed records validate', 'tests cover schema validity'],
    surfaces: ['package', 'firebaseFunctions', 'adminApp'],
    requiredForStandalone: true,
    requiredForEcosystem: true
  },
  {
    id: 'v3-marketplace-exports',
    version: 'v3',
    title: 'Marketplace & Exports',
    status: 'planned',
    summary: 'Tier-gated marketplace content, creator submissions, export jobs, SRT/PDF/PNG/CapCut metadata, and license evidence packs.',
    goals: ['Define export job interfaces', 'Define marketplace gating', 'Add export UI requirements', 'Add E2E scenarios for web app'],
    doneCriteria: ['export job records validate', 'tier gates are tested', 'web app export flow passes E2E'],
    surfaces: ['package', 'standaloneWeb', 'marketplace', 'firebaseFunctions'],
    requiredForStandalone: true,
    requiredForEcosystem: true
  },
  {
    id: 'v4-ecosystem-integration',
    version: 'v4',
    title: 'Ecosystem Integration',
    status: 'planned',
    summary: 'Adapter contracts for URAI Core, Studio, Motion, Cinema, Music, Visuals, Privacy, Admin, Foundation, Spatial, Asset Factory, Marketplace, and Licensing.',
    goals: ['Create adapter contracts', 'Document required collections and secrets', 'Define mock fallback behavior'],
    doneCriteria: ['all integration records validate', 'adapter tests pass', 'docs explain runtime wiring'],
    surfaces: ['package', 'externalAdapter', 'firebaseFunctions'],
    requiredForStandalone: true,
    requiredForEcosystem: true
  },
  {
    id: 'v5-aaa-production-polish',
    version: 'v5',
    title: 'AAA Production Polish',
    status: 'blocked',
    summary: 'Standalone web UX, AAA visual polish, accessibility, SEO, CI, E2E, Firebase Hosting, DNS, and live launch at www.uraicontent.com.',
    goals: ['Build standalone site', 'Run browser E2E', 'Deploy hosting', 'Verify DNS and smoke tests'],
    doneCriteria: ['web build passes', 'E2E passes', 'www.uraicontent.com loads', 'deployment blockers cleared'],
    surfaces: ['standaloneWeb', 'firebaseHosting', 'adminApp', 'creatorPortal'],
    requiredForStandalone: true,
    requiredForEcosystem: false
  }
];

const expansionTitles = [
  'Emotional OS Kernel Content',
  'Cognitive Mirror Content',
  'Digital Mood Weather Content',
  'Life Replay Content',
  'ChronoVoice Content',
  'Companion AI Narrator Content',
  'Ritual Library',
  'Insight Marketplace',
  'Story Mode Generator',
  'Shadow Realm Content',
  'Memory Map Content',
  'Dream Map Content',
  'Social Archetype Content',
  'Trust Signal / Echo Mirror Content',
  'AR/VR Spatial Content',
  'Creator Marketplace',
  'Licensing/IP Content',
  'Foundation/Public-Good Content',
  'Enterprise Content Packs'
] as const;

export const expansionModules: ExpansionModule[] = expansionTitles.map((title, index) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const licensingSensitive = title.includes('Licensing') || title.includes('Enterprise');
  const sensitive = title.includes('Shadow') || title.includes('Trust') || title.includes('Mirror');

  return {
    id: slug,
    title,
    status: index < 6 ? 'implementation' : 'planned',
    summary: `${title} maps URAI's symbolic system into reusable content, templates, admin metadata, and export-ready records.`,
    tierMapping: licensingSensitive ? ['enterprise', 'licensingPartner', 'internalAdmin'] : ['pro', 'creator', 'studio', 'internalAdmin'],
    publicVisibility: licensingSensitive ? 'partnerOnly' : sensitive ? 'authenticated' : 'public',
    integrationNotes: `Expose ${title} through package seed data now and through the standalone web/admin app after runtime Firebase wiring is available.`,
    seedExample: {
      contentSlug: slug,
      previewTitle: `${title} Preview`,
      previewCopy: `A production-safe seed preview for ${title}, ready for dashboard cards, admin review, and marketplace gating.`
    },
    adminControls: ['visibility', 'tierMapping', 'safetyClass', 'publishStatus', 'exportEligibility'],
    safetyClass: licensingSensitive ? 'licensingSensitive' : sensitive ? 'sensitive' : 'standard'
  };
});

const systems = [
  'URAI Core',
  'URAI App',
  'URAI Studio',
  'URAI Motion',
  'URAI Cinema',
  'URAI Music',
  'URAI Visuals',
  'URAI Admin',
  'URAI Analytics',
  'URAI Privacy',
  'URAI Foundation',
  'URAI Spatial',
  'URAI Asset Factory',
  'URAI Marketplace',
  'URAI Licensing'
] as const;

export const systemIntegrations: SystemIntegration[] = systems.map((systemName) => {
  const slug = systemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    id: slug,
    systemName,
    status: 'planned',
    direction: 'bidirectional',
    contractOwner: 'urai-content',
    adapterInterface: `${systemName.replace(/[^A-Za-z0-9]/g, '')}ContentAdapter`,
    requiredSecrets: systemName.includes('Privacy') ? ['FIREBASE_SERVICE_ACCOUNT'] : [],
    requiredCollections: ['contentItems', 'contentPacks', 'tierConfigs', 'provenanceRecords'],
    fallbackMode: 'safe no-op adapter with deterministic mock records',
    testStrategy: 'contract-shape unit tests plus consuming app integration tests'
  };
});

export const deploymentStatuses: DeploymentStatus[] = [
  {
    id: 'package-main',
    surface: 'package',
    status: 'implementation',
    url: null,
    blockers: ['local runner must have npm registry access to verify commands'],
    verificationCommand: 'npm run done',
    lastVerifiedAt: null,
    ownerActionRequired: []
  },
  {
    id: 'standalone-web-www-uraicontent',
    surface: 'standaloneWeb',
    status: 'blocked',
    url: 'https://www.uraicontent.com',
    blockers: ['standalone web app not present in this package repo', 'Firebase/Vercel hosting target not configured', 'DNS access required'],
    verificationCommand: 'npm run test:e2e && npm run build && deployment smoke test against https://www.uraicontent.com',
    lastVerifiedAt: null,
    ownerActionRequired: ['choose separate web app or monorepo conversion', 'provide Firebase hosting project', 'configure DNS']
  },
  {
    id: 'firebase-functions-runtime',
    surface: 'firebaseFunctions',
    status: 'blocked',
    url: null,
    blockers: ['runtime Firebase Admin adapter must be implemented in consuming backend'],
    verificationCommand: 'firebase emulators:exec npm run test:integration',
    lastVerifiedAt: null,
    ownerActionRequired: ['provide Firebase service account and target project']
  }
];
