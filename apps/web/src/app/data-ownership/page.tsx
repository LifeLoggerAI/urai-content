import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.dataOwnership);

export default function DataOwnershipPage() {
  return <PublicPage page={publicPages.dataOwnership} />;
}
