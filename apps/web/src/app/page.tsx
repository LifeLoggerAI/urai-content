import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.home);

export default function HomePage() {
  return <PublicPage page={publicPages.home} />;
}
