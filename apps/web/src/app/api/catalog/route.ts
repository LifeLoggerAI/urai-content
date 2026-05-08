import { NextResponse } from 'next/server';
import { listCatalogItems, summarizeCatalogItem } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export function GET() {
  const items = listCatalogItems().map(summarizeCatalogItem);

  return NextResponse.json({
    count: items.length,
    items
  });
}
