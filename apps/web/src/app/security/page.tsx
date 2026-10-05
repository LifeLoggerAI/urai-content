import type { Metadata } from 'next';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Report security issues affecting URAI Content and review the public security boundary.',
  alternates: { canonical: '/security' }
};

export default function SecurityPage() {
  return (
    <PublicPage
      eyebrow="Security"
      title="Report security issues without exposing secrets."
      lede="URAI Content separates public publishing from authenticated creator, reviewer, administrative, and operational surfaces. Security-sensitive reports should use the dedicated reporting channel."
    >
      <section className="grid" aria-label="Security reporting guidance">
        <article className="card"><h2>Security reports</h2><p>Email <a href="mailto:security@urailabs.com">security@urailabs.com</a> for vulnerabilities, suspected exposure, authorization failures, or security-sensitive findings.</p></article>
        <article className="card"><h2>Do not send secrets</h2><p>Do not email passwords, session cookies, API keys, private keys, recovery codes, raw customer data, or other credentials.</p></article>
        <article className="card"><h2>Protected surfaces</h2><p>Creator, reviewer, administration, publishing-control, and other restricted interfaces require their own authentication and authorization boundaries and are not public content routes.</p></article>
      </section>
    </PublicPage>
  );
}
