import {
  contentItemSchema,
  contentVersionSchema,
  creatorSubmissionSchema,
  exportTemplateSchema,
  marketplaceItemSchema,
  moderationQueueSchema,
  narratorPromptSchema,
  publishingReleaseSchema,
  ritualTemplateSchema,
  storyTemplateSchema,
  telemetryEventSchema,
  userContentEntitlementSchema,
  type ContentItem
} from '../schemas/content.js';
import type { ContentRepository } from './types.js';

export type EntitlementAccessRequest = {
  tier: 'free' | 'pro' | 'paid';
  entitlementKey?: string;
  now?: Date;
};

export class ContentService {
  constructor(private readonly repo: ContentRepository) {}

  async create(item: unknown): Promise<ContentItem> {
    const parsed = contentItemSchema.parse(item);
    await this.repo.upsertContent(parsed);
    await this.repo.addVersion(parsed.id, parsed);
    return parsed;
  }

  async update(itemId: string, patch: Partial<ContentItem>): Promise<ContentItem> {
    if ('status' in patch) {
      throw new Error('Use transitionWorkflow() to change content status');
    }

    const existing = await this.repo.getContent(itemId);
    if (!existing) throw new Error('Content item not found');
    const parsed = contentItemSchema.parse({ ...existing, ...patch, id: itemId });
    await this.repo.upsertContent(parsed);
    const version = await this.repo.addVersion(itemId, parsed);
    contentVersionSchema.parse({
      id: `${itemId}-v${version}`,
      contentItemId: itemId,
      version,
      snapshot: parsed,
      createdAt: parsed.updatedAt,
      createdBy: parsed.createdBy
    });
    return parsed;
  }

  private async saveWorkflowStatus(itemId: string, status: ContentItem['status']): Promise<ContentItem> {
    const existing = await this.repo.getContent(itemId);
    if (!existing) throw new Error('Content item not found');
    const parsed = contentItemSchema.parse({ ...existing, status, id: itemId, updatedAt: new Date().toISOString() });
    await this.repo.upsertContent(parsed);
    const version = await this.repo.addVersion(itemId, parsed);
    contentVersionSchema.parse({
      id: `${itemId}-v${version}`,
      contentItemId: itemId,
      version,
      snapshot: parsed,
      createdAt: parsed.updatedAt,
      createdBy: parsed.createdBy
    });
    return parsed;
  }

  async transitionWorkflow(itemId: string, next: ContentItem['status'], actorId: string): Promise<ContentItem> {
    const item = await this.repo.getContent(itemId);
    if (!item) throw new Error('Content item not found');
    const allowed: Record<ContentItem['status'], ContentItem['status'][]> = {
      draft: ['review'],
      review: ['approved', 'draft'],
      approved: ['published', 'review'],
      published: ['archived'],
      archived: []
    };
    if (!allowed[item.status].includes(next)) throw new Error(`Invalid workflow transition ${item.status} -> ${next}`);
    const updated = await this.saveWorkflowStatus(itemId, next);
    if (next === 'published') {
      await this.repo.logRelease(publishingReleaseSchema.parse({
        id: `release-${Date.now()}`,
        contentItemIds: [itemId],
        releasedAt: updated.updatedAt,
        releasedBy: actorId,
        changelog: `Published by ${actorId}`
      }));
    }
    return updated;
  }

  async canAccess(userId: string, request: 'free' | 'pro' | 'paid' | EntitlementAccessRequest): Promise<boolean> {
    const accessRequest = typeof request === 'string' ? { tier: request } : request;
    const { tier, entitlementKey, now = new Date() } = accessRequest;

    if (tier === 'free') return true;

    const entitlements = (await this.repo.listEntitlements(userId)).map((entry) => userContentEntitlementSchema.parse(entry));

    return entitlements.some((entitlement) => {
      if (entitlement.expiresAt && new Date(entitlement.expiresAt).getTime() <= now.getTime()) return false;
      if (entitlementKey && entitlement.entitlementKey !== entitlementKey) return false;
      if (entitlement.grantedBy === 'admin') return true;
      if (tier === 'pro') return entitlement.grantedBy === 'subscription' && entitlement.entitlementKey === 'pro';
      return entitlement.grantedBy === 'purchase';
    });
  }

  async searchContent(query: string, visibility: ContentItem['visibility'] = 'public'): Promise<ContentItem[]> {
    const list = await this.repo.listContent();
    const q = query.toLowerCase().trim();
    return list.filter((item) => item.visibility === visibility && [item.title, item.body, item.slug, ...item.tags].join(' ').toLowerCase().includes(q));
  }

  async logModeration(input: unknown): Promise<void> { await this.repo.logModeration(moderationQueueSchema.parse(input)); }
  async logTelemetry(input: unknown): Promise<void> { await this.repo.addTelemetry(telemetryEventSchema.parse(input)); }
  async upsertNarratorPrompt(input: unknown): Promise<void> { await this.repo.upsertNarratorPrompt(narratorPromptSchema.parse(input)); }
  async upsertStoryTemplate(input: unknown): Promise<void> { await this.repo.upsertStoryTemplate(storyTemplateSchema.parse(input)); }
  async upsertRitualTemplate(input: unknown): Promise<void> { await this.repo.upsertRitualTemplate(ritualTemplateSchema.parse(input)); }
  async upsertMarketplaceItem(input: unknown): Promise<void> { await this.repo.upsertMarketplaceItem(marketplaceItemSchema.parse(input)); }
  async upsertCreatorSubmission(input: unknown): Promise<void> { await this.repo.upsertCreatorSubmission(creatorSubmissionSchema.parse(input)); }
  async upsertExportTemplate(input: unknown): Promise<void> { await this.repo.upsertExportTemplate(exportTemplateSchema.parse(input)); }
}
