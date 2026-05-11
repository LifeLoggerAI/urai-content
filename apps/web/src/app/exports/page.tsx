import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.exports.metadata;

export default function ExportsPage() {
  return <PublicRouteShell content={routeShellContent.exports} />;
}
