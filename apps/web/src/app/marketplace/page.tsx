import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.marketplace.metadata;

export default function MarketplacePage() {
  return <PublicRouteShell content={routeShellContent.marketplace} />;
}
