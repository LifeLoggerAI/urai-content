import { NextResponse } from 'next/server';
import { getCatalogItemBySlug } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const slug = params.slug?.join('/') ?? '/';
  const item = getCatalogItemBySlug(slug);

  if (!item) {
    return NextResponse.json(
      {
        error: 'not_found',
        message: 'Content item not found or not public.'
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ item });
}
