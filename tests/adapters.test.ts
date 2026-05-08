import { describe, expect, it } from 'vitest';
import {
  assertRequiredAdapterCoverage,
  createMockContentAdapter,
  REQUIRED_URAI_ADAPTER_IDS
} from '../src/integrations/adapters.js';
import { systemIntegrations, tierConfigs, expansionModules } from '../src/seed/systemData.js';

describe('URAI ecosystem adapter contracts', () => {
  it('creates mock adapters for every required URAI system', async () => {
    const adapters = systemIntegrations.map((integration) => createMockContentAdapter(integration));
    assertRequiredAdapterCoverage(adapters);

    expect(adapters.map((adapter) => adapter.id)).toEqual([...REQUIRED_URAI_ADAPTER_IDS]);

    const health = await adapters[0].health();
    expect(health.ok).toBe(true);
    expect(health.mode).toBe('mock');
  });

  it('syncs tiers and expansion modules through safe mock paths', async () => {
    const adapter = createMockContentAdapter(systemIntegrations[0]);
    const context = { requestId: 'req-1', actorId: 'admin', actorTier: 'internalAdmin' };

    const tierResult = await adapter.syncTierConfig?.(context, tierConfigs);
    expect(tierResult?.ok).toBe(true);
    expect(tierResult?.data?.synced).toBe(tierConfigs.length);

    const moduleResult = await adapter.syncExpansionModules?.(context, expansionModules);
    expect(moduleResult?.ok).toBe(true);
    expect(moduleResult?.data?.synced).toBe(expansionModules.length);
  });

  it('throws when adapter coverage is incomplete', () => {
    expect(() => assertRequiredAdapterCoverage([])).toThrow('Missing URAI content adapters');
  });
});
