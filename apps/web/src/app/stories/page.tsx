import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.stories.metadata;

export default function StoriesPage() {
  return <PublicRouteShell content={routeShellContent.stories} />;
}
