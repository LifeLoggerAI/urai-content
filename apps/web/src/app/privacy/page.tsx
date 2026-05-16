import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.privacy);

export default function PrivacyPage() {
  return <PublicPage page={publicPages.privacy} />;
}
