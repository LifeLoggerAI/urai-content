import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.partners);

export default function PartnersPage() {
  return (
    <PublicPage page={publicPages.partners}>
      <LeadForm
        kind="contact"
        title="Start a partnership conversation"
        description="Tell URAI Labs about the partnership category, organization, and collaboration path you want to explore."
        defaultLeadType="partner"
      />
    </PublicPage>
  );
}
