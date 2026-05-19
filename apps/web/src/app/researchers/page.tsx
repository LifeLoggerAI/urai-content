import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.researchers);

export default function ResearchersPage() {
  return (
    <PublicPage page={publicPages.researchers}>
      <LeadForm
        kind="contact"
        title="Request research collaboration"
        description="Share your institution, research area, and consent-based collaboration interest with URAI Labs."
        defaultLeadType="research"
      />
    </PublicPage>
  );
}
