'use client';

import type { SitePage, SiteSection } from '@/lib/publicSiteContent';
import { trackPublicEvent } from './AnalyticsTracker';
import { TrackedLink } from './TrackedLink';

type PublicPageProps = {
  page?: SitePage;
  eyebrow?: string;
  title?: string;
  lede?: string;
  children?: React.ReactNode;
};

function resolvePage(props: PublicPageProps): SitePage {
  if (props.page) return props.page;

  return {
    route: '',
    eyebrow: props.eyebrow ?? 'URAI Content',
    title: props.title ?? 'URAI Content',
    lede: props.lede ?? '',
    metadata: {
      title: props.title ?? 'URAI Content',
      description: props.lede ?? ''
    },
    sections: []
  };
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <TrackedLink className="brand" href="/" aria-label="URAI Content home" eventLabel="brand_home">
        URAI Content
      </TrackedLink>
      <nav className="nav" aria-label="Primary navigation">
        <TrackedLink href="/content" eventLabel="nav_archive">Archive</TrackedLink>
        <TrackedLink href="/stories" eventLabel="nav_stories">Stories</TrackedLink>
        <TrackedLink href="/rituals" eventLabel="nav_rituals">Rituals</TrackedLink>
        <TrackedLink href="/narrator" eventLabel="nav_narrator">Narrator</TrackedLink>
        <TrackedLink href="/creator" eventLabel="nav_creator">Creator preview</TrackedLink>
        <TrackedLink href="/privacy" eventLabel="nav_privacy">Privacy</TrackedLink>
      </nav>
      <TrackedLink className="button compact" href="/versions" eventLabel="header_versions">
        Versions
      </TrackedLink>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>URAI Content</strong>
        <p>
          Editorial archive, content registry, and governed publishing surface for URAI. Public, preview,
          gated, and blocked states remain explicit.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <TrackedLink href="/about" eventLabel="footer_about">About</TrackedLink>
        <TrackedLink href="/content" eventLabel="footer_content">Archive</TrackedLink>
        <TrackedLink href="/creator" eventLabel="footer_creator">Creator preview</TrackedLink>
        <TrackedLink href="/licensing" eventLabel="footer_licensing">Licensing</TrackedLink>
        <TrackedLink href="/versions" eventLabel="footer_versions">Versions</TrackedLink>
        <TrackedLink href="/terms" eventLabel="footer_terms">Terms</TrackedLink>
        <TrackedLink href="/contact" eventLabel="footer_contact">Contact</TrackedLink>
      </nav>
    </footer>
  );
}

export function PublicPage(props: PublicPageProps) {
  const page = resolvePage(props);

  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1 id="page-title">{page.title}</h1>
          <p className="lede">{page.lede}</p>
          <Actions page={page} />
        </section>
        {page.sections.length ? <SectionGrid sections={page.sections} /> : null}
        {page.faqs?.length ? <FaqList faqs={page.faqs} /> : null}
        {props.children}
      </div>
    </main>
  );
}

export function Actions({ page }: { page: SitePage }) {
  if (!page.primaryCta && !page.secondaryCta) return null;
  return (
    <div className="actions" aria-label="Page actions">
      {page.primaryCta ? (
        <TrackedLink className="button" href={page.primaryCta.href} eventLabel={`${page.route}:primary`}>
          {page.primaryCta.label}
        </TrackedLink>
      ) : null}
      {page.secondaryCta ? (
        <TrackedLink className="button secondary" href={page.secondaryCta.href} eventLabel={`${page.route}:secondary`}>
          {page.secondaryCta.label}
        </TrackedLink>
      ) : null}
    </div>
  );
}

export function SectionGrid({ sections }: { sections: SiteSection[] }) {
  return (
    <section className="grid" aria-label="Page sections">
      {sections.map((section) => (
        <article className="card" key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
          {section.items?.length ? (
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function FaqList({ faqs }: { faqs: NonNullable<SitePage['faqs']> }) {
  return (
    <section className="faq-list" aria-label="Frequently asked questions">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          onToggle={(event) => {
            if (event.currentTarget.open) {
              trackPublicEvent('faq_opened', { question: faq.question });
            }
          }}
        >
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </section>
  );
}

export function PublicCard({ title, body, href, linkLabel }: { title: string; body: string; href?: string; linkLabel?: string }) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <p>{body}</p>
      {href ? (
        <p className="card-link">
          <TrackedLink href={href} eventLabel={`card:${title}`}>{linkLabel ?? 'Open'}</TrackedLink>
        </p>
      ) : null}
    </article>
  );
}
