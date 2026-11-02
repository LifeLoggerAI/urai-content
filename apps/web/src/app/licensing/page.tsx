import { PublicRouteShell } from '@/components/PublicRouteShell';
import { LeadForm } from '@/components/LeadForms';
import { routeShellContent } from '@/lib/publicPageContent';

export const metadata = routeShellContent.licensing.metadata;

export default function LicensingPage() {
  return <>
    <PublicRouteShell content={routeShellContent.licensing} />
    <LeadForm
      kind="contact"
      defaultLeadType="partner"
      title="Request a licensing review"
      description="Describe the content, intended use and organization. An inquiry grants no usage rights; the owner and reviewed license must authorize any delivery."
    />
  </>;
}
