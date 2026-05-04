# Firebase Rules Patch (for infra repo)

Apply equivalent constraints in the infrastructure repo that owns rules:
- `contentItems`: read public published items; write limited to admin/editor claims.
- `moderationQueue`: read/write admin or moderator claims only.
- `creatorSubmissions`: creators can write own submissions; admins can read all.
- `userContentEntitlements`: read/write server-side only.
- `telemetryEvents`: write server-side only; no client direct writes.

Also add composite indexes for:
- `contentItems(status, visibility, updatedAt desc)`
- `marketplaceItems(moderationStatus, tier)`
