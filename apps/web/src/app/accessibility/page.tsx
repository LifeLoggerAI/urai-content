import type { Metadata } from 'next';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'Review URAI Content accessibility commitments for keyboard access, visible focus, text scaling, reduced motion, and assistive technology support.',
  alternates: { canonical: '/accessibility' }
};

export default function AccessibilityPage() {
  return (
    <PublicPage
      eyebrow="Accessibility"
      title="URAI Content should remain usable across input, vision, motion, and assistive-technology needs."
      lede="The public content surface is designed for keyboard navigation, visible focus, browser text scaling, narrow-screen reflow, reduced-motion preferences, and semantic page structure."
    >
      <section className="grid" aria-label="Accessibility commitments">
        <article className="card"><h2>Keyboard and focus</h2><p>Public links, forms, summaries, and controls should remain operable without a pointer and expose a visible focus indicator.</p></article>
        <article className="card"><h2>Text and reflow</h2><p>Content should preserve browser text scaling and reflow on narrow screens without hiding required information.</p></article>
        <article className="card"><h2>Motion and contrast</h2><p>The public shell honors reduced-motion and forced-colors system preferences instead of requiring animation or custom color rendering.</p></article>
        <article className="card"><h2>Report a barrier</h2><p>Email <a href="mailto:accessibility@urailabs.com">accessibility@urailabs.com</a> with the page and task you were trying to complete. Do not send passwords, API keys, or private content.</p></article>
      </section>
    </PublicPage>
  );
}
