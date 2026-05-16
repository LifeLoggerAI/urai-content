import type { SitePage, SiteSection } from '@/lib/publicSiteContent';

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="URAI home">URAI</a>
      <nav className="nav" aria-label="Primary navigation">
        <a href="/product">Product</a>
        <a href="/how-it-works">How It Works</a>
        <a href="/privacy">Privacy</a>
        <a href="/data-ownership">Data Ownership</a>
        <a href="/demo">Demo</a>
      </nav>
      <a className="button compact" href="/waitlist">Join Waitlist</a>
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
        <a href="/about">About</a>
        <a href="/users">Users</a>
        <a href="/researchers">Researchers</a>
        <a href="/partners">Partners</a>
        <a href="/investors">Investors</a>
        <a href="/faq">FAQ</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </nav>
    </footer>
  );
}

export function PublicPage({ page, children }: { page: SitePage; children?: React.ReactNode }) {
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
        {children}
      </div>
    </main>
  );
}

export function Actions({ page }: { page: SitePage }) {
  if (!page.primaryCta && !page.secondaryCta) return null;
  return (
    <div className="actions" aria-label="Primary actions">
      {page.primaryCta ? <a className="button" href={page.primaryCta.href}>{page.primaryCta.label}</a> : null}
      {page.secondaryCta ? <a className="button secondary" href={page.secondaryCta.href}>{page.secondaryCta.label}</a> : null}
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
        <details key={faq.question}>
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
      {href ? <p className="card-link"><a href={href}>{linkLabel ?? 'Learn more'}</a></p> : null}
    </article>
  );
}
