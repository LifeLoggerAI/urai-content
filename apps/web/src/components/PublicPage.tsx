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
    eyebrow: props.eyebrow ?? 'URAI',
    title: props.title ?? 'URAI',
    lede: props.lede ?? '',
    metadata: {
      title: props.title ?? 'URAI',
      description: props.lede ?? ''
    },
    sections: []
  };
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <TrackedLink className="brand" href="/" aria-label="URAI home" eventLabel="brand_home">URAI</TrackedLink>
      <nav className="nav" aria-label="Primary navigation">
        <TrackedLink href="/product" eventLabel="nav_product">Product</TrackedLink>
        <TrackedLink href="/how-it-works" eventLabel="nav_how_it_works">How It Works</TrackedLink>
        <TrackedLink href="/privacy" eventLabel="nav_privacy">Privacy</TrackedLink>
        <TrackedLink href="/data-ownership" eventLabel="nav_data_ownership">Data Ownership</TrackedLink>
        <TrackedLink href="/demo" eventLabel="nav_demo">Demo</TrackedLink>
      </nav>
      <TrackedLink className="button compact" href="/waitlist" eventLabel="header_waitlist">Join Waitlist</TrackedLink>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>URAI Labs</strong>
        <p>Passive, privacy-first personal intelligence for the life data you already create.</p>
      </div>
      <nav aria-label="Footer navigation">
        <TrackedLink href="/about" eventLabel="footer_about">About</TrackedLink>
        <TrackedLink href="/users" eventLabel="footer_users">Users</TrackedLink>
        <TrackedLink href="/researchers" eventLabel="footer_researchers">Researchers</TrackedLink>
        <TrackedLink href="/partners" eventLabel="footer_partners">Partners</TrackedLink>
        <TrackedLink href="/investors" eventLabel="footer_investors">Investors</TrackedLink>
        <TrackedLink href="/faq" eventLabel="footer_faq">FAQ</TrackedLink>
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
    <div className="actions" aria-label="Primary actions">
      {page.primaryCta ? <TrackedLink className="button" href={page.primaryCta.href} eventLabel={`${page.route}:primary`}>{page.primaryCta.label}</TrackedLink> : null}
      {page.secondaryCta ? <TrackedLink className="button secondary" href={page.secondaryCta.href} eventLabel={`${page.route}:secondary`}>{page.secondaryCta.label}</TrackedLink> : null}
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
      {href ? <p className="card-link"><TrackedLink href={href} eventLabel={`card:${title}`}>{linkLabel ?? 'Learn more'}</TrackedLink></p> : null}
    </article>
  );
}
