import { describe, expect, it } from 'vitest';
import {
  deploymentStatuses,
  expansionModules,
  roadmapPhases,
  systemIntegrations,
  tierConfigs
} from '../src/seed/systemData.js';
import {
  deploymentStatusSchema,
  expansionModuleSchema,
  roadmapPhaseSchema,
  systemIntegrationSchema,
  tierConfigSchema
} from '../src/schemas/system.js';

describe('URAI Content OS system data', () => {
  it('validates every tier config and includes all required tiers', () => {
    const parsed = tierConfigs.map((tier) => tierConfigSchema.parse(tier));
    expect(parsed.map((tier) => tier.id)).toEqual([
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

    for (const tier of parsed) {
      expect(tier.entitlementKeys.length).toBeGreaterThan(0);
      expect(tier.upgradePrompt.length).toBeGreaterThan(0);
    }
  });

  it('validates the V1 through V5 roadmap phases', () => {
    const parsed = roadmapPhases.map((phase) => roadmapPhaseSchema.parse(phase));
    expect(parsed.map((phase) => phase.version)).toEqual(['v1', 'v2', 'v3', 'v4', 'v5']);
    expect(parsed.every((phase) => phase.doneCriteria.length > 0)).toBe(true);
    expect(parsed.some((phase) => phase.requiredForStandalone)).toBe(true);
    expect(parsed.some((phase) => phase.requiredForEcosystem)).toBe(true);
  });

  it('validates expansion module coverage', () => {
    const parsed = expansionModules.map((module) => expansionModuleSchema.parse(module));
    expect(parsed.length).toBeGreaterThanOrEqual(19);
    expect(parsed.map((module) => module.title)).toContain('Emotional OS Kernel Content');
    expect(parsed.map((module) => module.title)).toContain('Licensing/IP Content');
    expect(parsed.every((module) => module.adminControls.includes('tierMapping'))).toBe(true);
  });

  it('validates system integrations for the URAI ecosystem', () => {
    const parsed = systemIntegrations.map((integration) => systemIntegrationSchema.parse(integration));
    expect(parsed.length).toBeGreaterThanOrEqual(15);
    expect(parsed.map((integration) => integration.systemName)).toContain('URAI Privacy');
    expect(parsed.map((integration) => integration.systemName)).toContain('URAI Licensing');
    expect(parsed.every((integration) => integration.fallbackMode.length > 0)).toBe(true);
  });

  it('validates deployment status and preserves honest blockers', () => {
    const parsed = deploymentStatuses.map((status) => deploymentStatusSchema.parse(status));
    const standalone = parsed.find((status) => status.id === 'standalone-web-www-uraicontent');
    expect(standalone?.status).toBe('blocked');
    expect(standalone?.url).toBe('https://www.uraicontent.com');
    expect(standalone?.blockers.length).toBeGreaterThan(0);
  });
});
