import { PublicRouteShell } from '@/components/PublicRouteShell';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.voicePacks.metadata;

export default function VoicePacksPage() {
  return <PublicRouteShell content={routeShellContent.voicePacks} />;
}
