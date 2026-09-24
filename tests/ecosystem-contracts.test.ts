import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ECOSYSTEM_COLLECTIONS,
  REQUIRED_INTEGRATION_TARGETS,
  loadContentEcosystemExtension,
  loadEcosystemSchema,
  validateContentEcosystemExtension,
  validateContentPackContract,
  validateEcosystemSchema
} from '../scripts/checkEcosystemContracts.js';

describe('URAI ecosystem integration contract', () => {
  it('keeps the launch-facing ecosystem base compatible with required collections', () => {
    const schema = loadEcosystemSchema();
    const result = validateEcosystemSchema(schema);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(schema.required).toEqual(expect.arrayContaining([...REQUIRED_ECOSYSTEM_COLLECTIONS]));
    expect(schema.$id).toBe('urai://contracts/ecosystem-schema-v1');
  });

  it('keeps Content governance in a separately versioned extension', () => {
    const extension = loadContentEcosystemExtension();
    const result = validateContentEcosystemExtension(extension);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const targetDefinition = extension.$defs?.integrationTarget as { enum?: string[] } | undefined;
    expect(targetDefinition?.enum).toEqual(expect.arrayContaining([...REQUIRED_INTEGRATION_TARGETS]));
  });

  it('accepts a launch-safe Content-governance record without redefining the base schema', () => {
    const result = validateContentPackContract({
      id: 'pack-home-ground-orb-v1',
      version: '1.0.0',
      slug: 'home-ground-orb',
      lifecycleStatus: 'approved',
      visibility: 'public',
      integrationTargets: ['home', 'spatial', 'asset-factory'],
      assetIds: ['asset-ground-calm', 'asset-orb-idle'],
      provenance: { source: 'urai-content-canonical-seed', createdAt: '2026-05-29T00:00:00.000Z', rightsStatus: 'internal' },
      failsafeStatus: 'passed',
      xrCompatible: true
    });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('rejects unsupported integration targets and unsafe slugs', () => {
    const result = validateContentPackContract({
      id: 'bad-pack',
      version: '1.0.0',
      slug: 'Bad Pack',
      lifecycleStatus: 'approved',
      visibility: 'public',
      integrationTargets: ['unknown-system'],
      assetIds: [],
      provenance: { source: 'test', createdAt: '2026-05-29T00:00:00.000Z' }
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'Content pack slug must be lowercase kebab-case',
      'Unsupported integration target: unknown-system'
    ]));
  });
});
