import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.investors);

export default function InvestorsPage() {
  return <PublicPage page={publicPages.investors} />;
}
