import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.creator.metadata;

export default function CreatorPage() {
  return <PublicRouteShell content={routeShellContent.creator} />;
}
