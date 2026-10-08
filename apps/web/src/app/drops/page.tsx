import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '@/lib/catalogSurfaces';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Drops', description: 'Published public drops content in URAI.' };

export default function DropsPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser surface={mediaCatalogSurfaces[4]} searchParams={searchParams} />;
}
