import { NextResponse } from 'next/server';
import { listRuntimeCatalogSummaries } from '@/server/content/runtimeCatalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = params.has('limit') ? Number(params.get('limit')) : undefined;
  const cursor = params.get('cursor');
  let catalog;
  try {
    catalog = await listRuntimeCatalogSummaries({ limit, cursor });
  } catch (error) {
    if (error instanceof Error && /pagination|cursor/i.test(error.message)) return NextResponse.json({ error: 'Invalid catalog pagination request.' }, { status: 400 });
    throw error;
  }

  return NextResponse.json({
    source: catalog.source,
    sourceDescription: catalog.sourceDescription,
    count: catalog.items.length,
    items: catalog.items,
    nextCursor: catalog.nextCursor
  });
}
