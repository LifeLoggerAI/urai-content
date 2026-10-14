import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '@/lib/catalogSurfaces';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Visuals', description: 'Published public visuals content in URAI.' };

export default function VisualsPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser surface={mediaCatalogSurfaces[3]} searchParams={searchParams} />;
}
