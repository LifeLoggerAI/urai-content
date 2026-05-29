import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ECOSYSTEM_COLLECTIONS,
  REQUIRED_INTEGRATION_TARGETS,
  loadEcosystemSchema,
  validateContentPackContract,
  validateEcosystemSchema
} from '../scripts/checkEcosystemContracts.js';

describe('URAI ecosystem integration contract', () => {
  it('keeps the shared schema compatible with all required ecosystem collections', () => {
    const schema = loadEcosystemSchema();
    const result = validateEcosystemSchema(schema);

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(schema.required).toEqual(expect.arrayContaining([...REQUIRED_ECOSYSTEM_COLLECTIONS]));
  });

  it('lists every consuming URAI system as an integration target', () => {
    const schema = loadEcosystemSchema();
    const targetDefinition = schema.$defs?.integrationTarget as { enum?: string[] } | undefined;

    expect(targetDefinition?.enum).toEqual(expect.arrayContaining([...REQUIRED_INTEGRATION_TARGETS]));
  });

  it('accepts a launch-safe content pack contract record', () => {
    const result = validateContentPackContract({
      id: 'pack-home-ground-orb-v1',
      version: '1.0.0',
      slug: 'home-ground-orb',
      lifecycleStatus: 'approved',
      visibility: 'public',
      integrationTargets: ['home', 'spatial', 'asset-factory'],
      assetIds: ['asset-ground-calm', 'asset-orb-idle'],
      provenance: {
        source: 'urai-content-canonical-seed',
        createdAt: '2026-05-29T00:00:00.000Z',
        rightsStatus: 'internal'
      },
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
