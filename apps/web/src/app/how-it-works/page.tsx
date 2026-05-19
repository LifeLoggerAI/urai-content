import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.howItWorks);

export default function HowItWorksPage() {
  return <PublicPage page={publicPages.howItWorks} />;
}
