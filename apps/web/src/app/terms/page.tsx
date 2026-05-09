import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.terms.metadata;

export default function TermsPage() {
  return <PublicRouteShell content={routeShellContent.terms} />;
}
