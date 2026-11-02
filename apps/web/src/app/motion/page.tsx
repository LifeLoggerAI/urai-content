import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '@/lib/catalogSurfaces';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Motion', description: 'Published public motion content in URAI.' };

export default function MotionPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser surface={mediaCatalogSurfaces[0]} searchParams={searchParams} />;
}
