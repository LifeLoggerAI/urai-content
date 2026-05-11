import {
  assetManifestSchema,
  consentRecordSchema,
  contentLicenseSchema,
  contentPackSchema,
  exportJobSchema,
  provenanceRecordSchema,
  seoPageSchema
} from '../schemas/production.js';
import {
  deploymentStatusSchema,
  expansionModuleSchema,
  roadmapPhaseSchema,
  systemIntegrationSchema,
  tierConfigSchema
} from '../schemas/system.js';
import {
  assetManifests,
  consentRecords,
  contentLicenses,
  contentPacks,
  exportJobs,
  provenanceRecords,
  seoPages
} from './productionData.js';
import {
  deploymentStatuses,
  expansionModules,
  roadmapPhases,
  systemIntegrations,
  tierConfigs
} from './systemData.js';

function assertUnique(values: string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`${label} contains duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
  }
}

function main(): void {
  const tiers = tierConfigs.map((record) => tierConfigSchema.parse(record));
  const phases = roadmapPhases.map((record) => roadmapPhaseSchema.parse(record));
  const modules = expansionModules.map((record) => expansionModuleSchema.parse(record));
  const integrations = systemIntegrations.map((record) => systemIntegrationSchema.parse(record));
  const deployments = deploymentStatuses.map((record) => deploymentStatusSchema.parse(record));
  const provenance = provenanceRecords.map((record) => provenanceRecordSchema.parse(record));
  const consents = consentRecords.map((record) => consentRecordSchema.parse(record));
  const assets = assetManifests.map((record) => assetManifestSchema.parse(record));
  const packs = contentPacks.map((record) => contentPackSchema.parse(record));
  const licenses = contentLicenses.map((record) => contentLicenseSchema.parse(record));
  const exports = exportJobs.map((record) => exportJobSchema.parse(record));
  const seo = seoPages.map((record) => seoPageSchema.parse(record));

  assertUnique(tiers.map((record) => record.id), 'tierConfigs');
  assertUnique(phases.map((record) => record.id), 'roadmapPhases');
  assertUnique(modules.map((record) => record.id), 'expansionModules');
  assertUnique(integrations.map((record) => record.id), 'systemIntegrations');
  assertUnique(deployments.map((record) => record.id), 'deploymentStatuses');
  assertUnique(provenance.map((record) => record.id), 'provenanceRecords');
  assertUnique(consents.map((record) => record.id), 'consentRecords');
  assertUnique(assets.map((record) => record.id), 'assetManifests');
  assertUnique(packs.map((record) => record.id), 'contentPacks');
  assertUnique(licenses.map((record) => record.id), 'contentLicenses');
  assertUnique(exports.map((record) => record.id), 'exportJobs');
  assertUnique(seo.map((record) => record.id), 'seoPages');

  const report = {
    tierConfigs: tiers.length,
    roadmapPhases: phases.length,
    expansionModules: modules.length,
    systemIntegrations: integrations.length,
    deploymentStatuses: deployments.length,
    provenanceRecords: provenance.length,
    consentRecords: consents.length,
    assetManifests: assets.length,
    contentPacks: packs.length,
    contentLicenses: licenses.length,
    exportJobs: exports.length,
    seoPages: seo.length
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
