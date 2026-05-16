import { LeadForm } from '@/components/LeadForms';
import { PublicPage } from '@/components/PublicPage';
import { getPageMetadata, publicPages } from '@/lib/publicSiteContent';

export const metadata = getPageMetadata(publicPages.demo);

export default function DemoPage() {
  return (
    <PublicPage page={publicPages.demo}>
      <LeadForm
        kind="contact"
        title="Request demo access"
        description="Ask for a public-safe URAI demo walkthrough using sample Cognitive Mirror, Emotional Timeline, Memory Map, and Council data."
        defaultLeadType="demo"
      />
    </PublicPage>
  );
}
