import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  canonicalContentItemSchema,
  openGraphMetadataSchema,
  seoMetadataSchema,
  spritePreviewSchema
} from './schema.js';
import { loadJsonFile, walkJsonFiles } from './loaders.js';

const unsafeTerms = [
  'diagnose',
  'diagnosis',
  'cure',
  'treatment',
  'therapist replacement',
  'medical device',
  'guaranteed',
  'reads your mind',
  'fully autonomous',
  'surveillance',
  'sell your private data'
];

const allowedNegations = [
  'does not sell your private data',
  "doesn't sell your private data"
];

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizePublicPath(assetPath: string): string {
  return assetPath.startsWith('/') ? join('public', assetPath.slice(1)) : assetPath;
}

function assertAsset(root: string, assetPath: string): void {
  const normalized = normalizePublicPath(assetPath);
  const fullPath = join(root, normalized);

  if (!existsSync(fullPath)) {
    throw new Error(`Missing asset path ${normalized}`);
  }

  const stat = statSync(fullPath);
  if (!stat.isFile()) {
    throw new Error(`Asset path is not a file ${normalized}`);
  }

  if (stat.size === 0) {
    throw new Error(`Asset file is empty ${normalized}`);
  }

  const header = readFileSync(fullPath).subarray(0, 16);
  const lowerPath = normalized.toLowerCase();

  if (lowerPath.endsWith('.png')) {
    const isPng = header.length >= 8 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    if (!isPng) throw new Error(`Asset is not a valid PNG ${normalized}`);
  }

  if (lowerPath.endsWith('.svg')) {
    const text = readFileSync(fullPath, 'utf8').trimStart();
    if (!text.startsWith('<svg')) throw new Error(`Asset is not a valid SVG ${normalized}`);
  }
}

export function validateContent(options?: { rootDir?: string; contentDir?: string }): void {
  const root = options?.rootDir ?? process.cwd();
  const contentDir = options?.contentDir ?? join(root, 'content');
  const files = walkJsonFiles(contentDir);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const publicRoutes = new Set<string>();
  const spriteIds = new Set<string>();

  for (const file of files) {
    const data = loadJsonFile<unknown>(file);

    if (file.endsWith(join('seo', 'metadata.json'))) {
      seoMetadataSchema.parse(data);
      continue;
    }

    if (file.endsWith(join('seo', 'open-graph.json'))) {
      const parsed = openGraphMetadataSchema.parse(data);
      assertAsset(root, parsed.image);
      continue;
    }

    const items = toArray(data);

    for (const item of items) {
      if (!isRecord(item) || !('id' in item)) continue;

      if ('spriteId' in item && 'previewPath' in item) {
        const parsed = spritePreviewSchema.parse(item);
        assertAsset(root, parsed.previewPath);
        continue;
      }

      const parsed = canonicalContentItemSchema.parse(item);

      if (ids.has(parsed.id)) throw new Error(`Duplicate id: ${parsed.id}`);
      if (slugs.has(parsed.slug)) throw new Error(`Duplicate slug: ${parsed.slug}`);

      ids.add(parsed.id);
      slugs.add(parsed.slug);

      if (parsed.tags.includes('sprites')) spriteIds.add(parsed.id);

      if (parsed.visibility === 'public') {
        if (parsed.slug.startsWith('/')) publicRoutes.add(parsed.slug);

        const text = JSON.stringify(parsed).toLowerCase();
        const unsafe = unsafeTerms.find((term) => text.includes(term));
        const hasAllowedNegation = allowedNegations.some((phrase) => text.includes(phrase));

        if (unsafe && !(unsafe === 'sell your private data' && hasAllowedNegation)) {
          throw new Error(`Unsafe public claim '${unsafe}' in ${relative(root, file)}`);
        }
      }

      if (parsed.path) {
        assertAsset(root, parsed.path);
      }
    }
  }

  const sitemapPath = join(contentDir, 'seo', 'sitemap-routes.json');
  const metadataPath = join(contentDir, 'seo', 'metadata.json');

  if (!existsSync(metadataPath)) throw new Error('Missing SEO metadata.json');
  if (!existsSync(sitemapPath)) throw new Error('Missing SEO sitemap-routes.json');

  const routes = loadJsonFile<string[]>(sitemapPath);

  for (const route of publicRoutes) {
    if (!routes.includes(route)) {
      throw new Error(`Public route missing from sitemap-routes.json: ${route}`);
    }
  }

  for (const file of files.filter((entry) => entry.endsWith(join('sprites', 'sprites-previews.json')))) {
    const previews = toArray(loadJsonFile<unknown>(file)).map((item) => spritePreviewSchema.parse(item));
    for (const preview of previews) {
      if (!spriteIds.has(preview.spriteId)) {
        throw new Error(`Sprite preview references unknown spriteId: ${preview.spriteId}`);
      }
    }
  }
}

if (import.meta.url.endsWith(process.argv[1] ?? '')) {
  validateContent();
  console.log('Content validation passed.');
}
