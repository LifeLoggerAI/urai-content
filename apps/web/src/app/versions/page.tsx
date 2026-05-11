import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.versions.metadata;

export default function VersionsPage() {
  return <PublicRouteShell content={routeShellContent.versions} />;
}
