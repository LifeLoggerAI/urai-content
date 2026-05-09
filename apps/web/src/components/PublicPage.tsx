type PublicPageProps = {
  eyebrow: string;
  title: string;
  lede: string;
  children?: React.ReactNode;
};

type PublicCardProps = {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export function PublicPage({ eyebrow, title, lede, children }: PublicPageProps) {
  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="page-title">{title}</h1>
          <p className="lede">{lede}</p>
          {children}
        </section>
      </div>
    </main>
  );
}

export function PublicCard({ title, body, href, linkLabel }: PublicCardProps) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <p>{body}</p>
      {href ? (
        <p style={{ marginTop: 12 }}>
          <a href={href}>{linkLabel ?? 'Learn more'}</a>
        </p>
      ) : null}
    </article>
  );
}
