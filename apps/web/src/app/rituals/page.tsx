import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.rituals.metadata;

export default function RitualsPage() {
  return <PublicRouteShell content={routeShellContent.rituals} />;
}
