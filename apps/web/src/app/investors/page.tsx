import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.investors);

export default function InvestorsPage() {
  return (
    <PublicPage page={publicPages.investors}>
      <LeadForm
        kind="contact"
        title="Request the investor brief"
        description="Share your investor type, firm, and interest in URAI Labs so the request can be routed for review."
        defaultLeadType="investor"
      />
    </PublicPage>
  );
}
