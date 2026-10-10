import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const storageRules = fs.readFileSync(path.join(repoRoot, 'storage.rules'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(repoRoot, 'firestore.rules'), 'utf8');

describe('content security rules source contract', () => {
  it('retains upload validation preparation while direct creator mutation is gated', () => {
    expect(storageRules).toContain('request.resource.size <= 25 * 1024 * 1024');
    expect(storageRules).toContain('isAllowedCreatorContentType()');
    expect(storageRules).toContain('request.auth.uid == creatorId');
    expect(storageRules).toContain('image/(png|jpe?g|webp|gif)');
    expect(storageRules).toContain('model/gltf-binary');
  });

  it('does not use issued client role claims as live privileged authority', () => {
    for (const rules of [storageRules, firestoreRules]) {
      expect(rules).not.toContain('request.auth.token');
      expect(rules.match(/function isAdmin\(\) \{[\s\S]*?\n    \}/)?.[0]).toContain('return false;');
      expect(rules.match(/function isCreator\(\) \{[\s\S]*?\n    \}/)?.[0]).toContain('return false;');
      expect(rules.match(/function privateClientAuthorized\(\) \{[\s\S]*?\n    \}/)?.[0]).toContain('return false;');
    }
  });

  it('aligns public reads to free persisted records', () => {
    expect(firestoreRules).toContain("resource.data.get('status', '') == 'published'");
    expect(firestoreRules).toContain("resource.data.get('visibility', '') == 'public'");
    expect(firestoreRules).toContain("resource.data.get('tierVisibility', []).hasAny(['free'])");
    expect(firestoreRules).toContain("resource.data.get('moderationStatus', '') == 'approved'");
    expect(firestoreRules).toContain("resource.data.get('tier', '') == 'free'");
  });

  it('retains bounded telemetry preparation under the private client gate', () => {
    expect(firestoreRules).toContain('request.resource.data.keys().hasAll');
    expect(firestoreRules).toContain('request.resource.data.keys().hasOnly');
    expect(firestoreRules).toContain('request.resource.data.userId == request.auth.uid');
    expect(firestoreRules).toContain('marketplace_item_unlocked');
    expect(firestoreRules).toContain('request.resource.data.metadata.size() <= 20');
  });

  it('uses the same rules in the repository and web deployment roots', () => {
    expect(fs.readFileSync(path.join(repoRoot, 'apps/web/firestore.rules'), 'utf8')).toBe(firestoreRules);
    expect(fs.readFileSync(path.join(repoRoot, 'apps/web/storage.rules'), 'utf8')).toBe(storageRules);
  });

  it('keeps explicit deny-by-default fallbacks', () => {
    expect(storageRules).toContain('match /{allPaths=**}');
    expect(firestoreRules).toContain('match /{document=**}');
  });
});
