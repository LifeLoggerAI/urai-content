import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.about);

export default function AboutPage() {
  return <PublicPage page={publicPages.about} />;
}
