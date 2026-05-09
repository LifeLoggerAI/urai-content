import { NextResponse } from 'next/server';
import { listCatalogItems, summarizeCatalogItem } from '@/lib/catalog';
import { getCatalogSourceDescription, getCatalogSourceMode } from '@/server/content/catalogSource';

export const dynamic = 'force-dynamic';

export function GET() {
  const items = listCatalogItems().map(summarizeCatalogItem);

  return NextResponse.json({
    source: getCatalogSourceMode(),
    sourceDescription: getCatalogSourceDescription(),
    count: items.length,
    items
  });
}
