import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.waitlist);

export default function WaitlistPage() {
  return (
    <PublicPage page={publicPages.waitlist}>
      <LeadForm
        kind="waitlist"
        title="Join the URAI waitlist"
        description="Get early access updates for the URAI demo, private beta, and launch."
        defaultLeadType="user"
      />
    </PublicPage>
  );
}
