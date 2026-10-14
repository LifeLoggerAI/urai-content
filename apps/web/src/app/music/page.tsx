import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '@/lib/catalogSurfaces';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Music', description: 'Published public music content in URAI.' };

export default function MusicPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser surface={mediaCatalogSurfaces[2]} searchParams={searchParams} />;
}
