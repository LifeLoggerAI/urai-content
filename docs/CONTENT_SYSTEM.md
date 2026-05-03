# Content System

This repository is URAI's typed content-domain contract and validation layer.

## Models
See `src/schemas/content.ts` for:
- contentItems
- narratorPrompts
- storyTemplates
- ritualTemplates
- marketplaceItems
- creatorSubmissions
- moderationQueue
- publishingReleases
- contentVersions
- exportTemplates
- userContentEntitlements
- telemetryEvents

## Workflow
Draft -> Review -> Approved -> Published -> Archived via `workflowStatusSchema`.
