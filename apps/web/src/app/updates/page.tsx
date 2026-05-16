import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.updates);

export default function UpdatesPage() {
  return <PublicPage page={publicPages.updates} />;
}
