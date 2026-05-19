import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.users);

export default function UsersPage() {
  return <PublicPage page={publicPages.users} />;
}
