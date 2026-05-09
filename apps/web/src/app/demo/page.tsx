import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.demo.metadata;

export default function DemoPage() {
  return <PublicRouteShell content={routeShellContent.demo} />;
}
