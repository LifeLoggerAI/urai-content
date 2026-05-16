import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.partners);

export default function PartnersPage() {
  return <PublicPage page={publicPages.partners} />;
}
