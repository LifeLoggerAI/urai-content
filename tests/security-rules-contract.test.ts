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
    expect(storageRules).toContain("request.auth.uid == creatorId");
    expect(storageRules).toContain("'model/gltf-binary'");
    expect(storageRules).not.toMatch(/creator-submissions[\s\S]*allow write: if isCreator\(\) && request\.auth\.uid == creatorId;/);
  });

  it('accepts both scalar and array role claims', () => {
    expect(storageRules).toContain('request.auth.token.role == role');
    expect(storageRules).toContain('request.auth.token.roles is list');
    expect(firestoreRules).toContain('request.auth.token.role == role');
    expect(firestoreRules).toContain('request.auth.token.roles is list');
  });

  it('aligns public reads to the actual persisted schemas', () => {
    expect(firestoreRules).toContain("resource.data.status == 'published' && resource.data.visibility == 'public'");
    expect(firestoreRules).toContain("resource.data.status == 'published'");
    expect(firestoreRules).toContain('resource.data.tierVisibility is list');
    expect(firestoreRules).toContain("resource.data.moderationStatus == 'approved'");
    expect(firestoreRules).toContain("resource.data.tier in ['free', 'pro', 'paid']");
  });

  it('owner-binds and allowlists analytics event writes', () => {
    expect(firestoreRules).toContain('request.resource.data.keys().hasOnly');
    expect(firestoreRules).toContain('request.resource.data.userId == request.auth.uid');
    expect(firestoreRules).toContain("'marketplace_item_unlocked'");
    expect(firestoreRules).toContain('request.resource.data.metadata is map');
    expect(firestoreRules).not.toContain('match /analyticsEvents/{id} {\n      allow create: if signedIn();');
  });

  it('keeps an explicit deny-by-default fallback', () => {
    expect(storageRules).toContain('match /{allPaths=**}');
    expect(storageRules).toContain('allow read, write: if false;');
    expect(firestoreRules).toContain('match /{document=**}');
    expect(firestoreRules).toContain('allow read, write: if false;');
  });
});
