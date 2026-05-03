import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { contentItemSchema } from './schema.js';
import { loadJsonFile, walkJsonFiles } from './loaders.js';

const unsafeTerms = ['diagnose','diagnosis','cure','treatment','therapist replacement','medical device','guaranteed','reads your mind','fully autonomous','surveillance','sell your private data'];
function toArray(value: unknown): unknown[] { return Array.isArray(value) ? value : [value]; }

export function validateContent(options?: { rootDir?: string; contentDir?: string }): void {
  const root = options?.rootDir ?? process.cwd();
  const contentDir = options?.contentDir ?? join(root, 'content');
  const files = walkJsonFiles(contentDir);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const publicRoutes = new Set<string>();

  for (const file of files) {
    const data = loadJsonFile<unknown>(file);
    const items = toArray(data).filter((x) => typeof x === 'object' && x !== null && 'id' in (x as object));
    for (const item of items) {
      const parsed = contentItemSchema.parse(item);
      if (ids.has(parsed.id)) throw new Error(`Duplicate id: ${parsed.id}`);
      if (slugs.has(parsed.slug)) throw new Error(`Duplicate slug: ${parsed.slug}`);
      ids.add(parsed.id); slugs.add(parsed.slug);
      if (parsed.visibility === 'public') {
        publicRoutes.add(parsed.slug);
        const text = JSON.stringify(parsed).toLowerCase();
        const unsafe = unsafeTerms.find((term) => text.includes(term));
        if (unsafe) throw new Error(`Unsafe public claim '${unsafe}' in ${relative(root, file)}`);
      }
      if (parsed.path && !existsSync(join(root, parsed.path))) throw new Error(`Missing asset path ${parsed.path}`);
    }
  }

  const sitemapPath = join(contentDir, 'seo', 'sitemap-routes.json');
  const metadataPath = join(contentDir, 'seo', 'metadata.json');
  if (!existsSync(metadataPath)) throw new Error('Missing SEO metadata.json');
  const routes = loadJsonFile<string[]>(sitemapPath);
  for (const route of publicRoutes) {
    if (!routes.includes(route)) throw new Error(`Public route missing from sitemap-routes.json: ${route}`);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  validateContent();
  console.log('Content validation passed.');
}
