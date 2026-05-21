import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.product);

export default function ProductPage() {
  return <PublicPage page={publicPages.product} />;
}
