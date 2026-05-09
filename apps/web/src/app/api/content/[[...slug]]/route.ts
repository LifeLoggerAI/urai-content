import { NextResponse } from 'next/server';
import { getRuntimeCatalogItemBySlug } from '@/server/content/runtimeCatalog';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const slug = params.slug?.join('/') ?? '/';
  const catalog = await getRuntimeCatalogItemBySlug(slug);

  if (!catalog.item) {
    return NextResponse.json(
      {
        source: catalog.source,
        sourceDescription: catalog.sourceDescription,
        error: 'not_found',
        message: 'Content item not found or not public.'
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    source: catalog.source,
    sourceDescription: catalog.sourceDescription,
    item: catalog.item
  });
}
