import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const storageRules = fs.readFileSync(path.join(repoRoot, 'storage.rules'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(repoRoot, 'firestore.rules'), 'utf8');

describe('content security rules source contract', () => {
  it('bounds creator uploads by owner, content type, and size', () => {
    expect(storageRules).toContain('request.resource.size <= 25 * 1024 * 1024');
    expect(storageRules).toContain('isAllowedCreatorContentType()');
    expect(storageRules).toContain('request.auth.uid == creatorId');
    expect(storageRules).toContain('image/(png|jpe?g|webp|gif)');
    expect(storageRules).toContain('model/gltf-binary');
  });

  it('accepts both scalar and array role claims', () => {
    expect(storageRules).toContain('request.auth.token.role == role');
    expect(storageRules).toContain('request.auth.token.roles is list');
    expect(storageRules).toContain('request.auth.token.roles.hasAny([role])');
    expect(firestoreRules).toContain('request.auth.token.role == role');
    expect(firestoreRules).toContain('request.auth.token.roles is list');
  });

  it('aligns public reads to free persisted records', () => {
    expect(firestoreRules).toContain("resource.data.get('status', '') == 'published'");
    expect(firestoreRules).toContain("resource.data.get('visibility', '') == 'public'");
    expect(firestoreRules).toContain("resource.data.get('tierVisibility', []).hasAny(['free'])");
    expect(firestoreRules).toContain("resource.data.get('moderationStatus', '') == 'approved'");
    expect(firestoreRules).toContain("resource.data.get('tier', '') == 'free'");
  });

  it('owner-binds and allowlists analytics event writes', () => {
    expect(firestoreRules).toContain('request.resource.data.keys().hasAll');
    expect(firestoreRules).toContain('request.resource.data.keys().hasOnly');
    expect(firestoreRules).toContain('request.resource.data.userId == request.auth.uid');
    expect(firestoreRules).toContain('marketplace_item_unlocked');
    expect(firestoreRules).toContain('request.resource.data.metadata.size() <= 20');
  });

  it('keeps explicit deny-by-default fallbacks', () => {
    expect(storageRules).toContain('match /{allPaths=**}');
    expect(firestoreRules).toContain('match /{document=**}');
  });
});
