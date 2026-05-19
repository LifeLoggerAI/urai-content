import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.terms);

export default function TermsPage() {
  return <PublicPage page={publicPages.terms} />;
}
