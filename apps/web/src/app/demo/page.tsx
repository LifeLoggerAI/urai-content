import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.demo);

export default function DemoPage() {
  return <PublicPage page={publicPages.demo} />;
}
