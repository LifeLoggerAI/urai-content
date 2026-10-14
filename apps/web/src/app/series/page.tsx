import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '@/lib/catalogSurfaces';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Series', description: 'Published public series content in URAI.' };

export default function SeriesPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser surface={mediaCatalogSurfaces[5]} searchParams={searchParams} />;
}
