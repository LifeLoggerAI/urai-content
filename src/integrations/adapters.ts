import type { ContentItem } from '../schemas/content.js';
import type { ExpansionModule, SystemIntegration, TierConfig } from '../schemas/system.js';

export type AdapterHealth = {
  ok: boolean;
  mode: 'mock' | 'production' | 'disabled';
  checkedAt: string;
  notes: string[];
};

export type ContentAdapterContext = {
  requestId: string;
  actorId: string | null;
  actorTier: string | null;
  consentSnapshotId?: string | null;
  provenanceId?: string | null;
};

export type ContentAdapterResult<T> = {
  ok: boolean;
  data: T | null;
  warnings: string[];
};

export type UraiContentAdapter = {
  readonly id: string;
  readonly systemName: string;
  health(): Promise<AdapterHealth>;
  pushContent?(context: ContentAdapterContext, content: ContentItem): Promise<ContentAdapterResult<{ remoteId: string }>>;
  pullContent?(context: ContentAdapterContext, cursor?: string): Promise<ContentAdapterResult<{ items: ContentItem[]; nextCursor: string | null }>>;
  syncTierConfig?(context: ContentAdapterContext, tiers: TierConfig[]): Promise<ContentAdapterResult<{ synced: number }>>;
  syncExpansionModules?(context: ContentAdapterContext, modules: ExpansionModule[]): Promise<ContentAdapterResult<{ synced: number }>>;
};

export type AdapterFactory = (integration: SystemIntegration) => UraiContentAdapter;

export const createMockContentAdapter: AdapterFactory = (integration) => ({
  id: integration.id,
  systemName: integration.systemName,
  async health() {
    return {
      ok: true,
      mode: 'mock',
      checkedAt: new Date(0).toISOString(),
      notes: [`${integration.systemName} is using the safe mock adapter until production credentials are provided.`]
    };
  },
  async pushContent(_context, content) {
    return {
      ok: true,
      data: { remoteId: `mock:${integration.id}:${content.id}` },
      warnings: ['Mock adapter did not write to an external system.']
    };
  },
  async pullContent() {
    return {
      ok: true,
      data: { items: [], nextCursor: null },
      warnings: ['Mock adapter returned no external content.']
    };
  },
  async syncTierConfig(_context, tiers) {
    return {
      ok: true,
      data: { synced: tiers.length },
      warnings: ['Mock adapter did not persist tier config externally.']
    };
  },
  async syncExpansionModules(_context, modules) {
    return {
      ok: true,
      data: { synced: modules.length },
      warnings: ['Mock adapter did not persist expansion modules externally.']
    };
  }
});

export const REQUIRED_URAI_ADAPTER_IDS = [
  'urai-core',
  'urai-app',
  'urai-studio',
  'urai-motion',
  'urai-cinema',
  'urai-music',
  'urai-visuals',
  'urai-admin',
  'urai-analytics',
  'urai-privacy',
  'urai-foundation',
  'urai-spatial',
  'urai-asset-factory',
  'urai-marketplace',
  'urai-licensing'
] as const;

export type RequiredUraiAdapterId = (typeof REQUIRED_URAI_ADAPTER_IDS)[number];

export function assertRequiredAdapterCoverage(adapters: UraiContentAdapter[]): void {
  const ids = new Set(adapters.map((adapter) => adapter.id));
  const missing = REQUIRED_URAI_ADAPTER_IDS.filter((id) => !ids.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing URAI content adapters: ${missing.join(', ')}`);
  }
}
