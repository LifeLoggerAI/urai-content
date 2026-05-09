import { NextResponse } from 'next/server';
import { listRuntimeCatalogSummaries } from '@/server/content/runtimeCatalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const catalog = await listRuntimeCatalogSummaries();

  return NextResponse.json({
    source: catalog.source,
    sourceDescription: catalog.sourceDescription,
    count: catalog.items.length,
    items: catalog.items
  });
}
