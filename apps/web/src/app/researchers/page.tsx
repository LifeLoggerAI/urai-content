import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.researchers);

export default function ResearchersPage() {
  return <PublicPage page={publicPages.researchers} />;
}
