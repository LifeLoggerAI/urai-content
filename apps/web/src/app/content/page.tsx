import { CatalogBrowser, type CatalogSearchParams } from '@/components/CatalogBrowser';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Content',
  description: 'Canonical URAI Content registry and package status.'
};

export default function ContentPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogBrowser searchParams={searchParams} />;
}
