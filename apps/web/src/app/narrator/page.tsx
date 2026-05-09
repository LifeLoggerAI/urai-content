import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.narrator.metadata;

export default function NarratorPage() {
  return <PublicRouteShell content={routeShellContent.narrator} />;
}
