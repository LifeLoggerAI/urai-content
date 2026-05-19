import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.faq);

export default function FaqPage() {
  return <PublicPage page={publicPages.faq} />;
}
