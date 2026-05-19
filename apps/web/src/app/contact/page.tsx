import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.contact);

export default function ContactPage() {
  return (
    <PublicPage page={publicPages.contact}>
      <LeadForm
        kind="contact"
        title="Contact URAI Labs"
        description="Send demo, investor, partner, research, press, or general inquiries to the URAI Labs intake queue."
        defaultLeadType="contact"
      />
    </PublicPage>
  );
}
