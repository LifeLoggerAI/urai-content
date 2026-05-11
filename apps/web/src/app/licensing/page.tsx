import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.licensing.metadata;

export default function LicensingPage() {
  return <PublicRouteShell content={routeShellContent.licensing} />;
}
