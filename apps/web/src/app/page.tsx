const cards = [
  {
    title: 'Canonical content engine',
    body: 'Schemas, registries, validators, seed data, and release-safe content contracts for URAI systems.'
  },
  {
    title: 'Standalone product surface',
    body: 'A staged runtime path toward the complete public site, dashboard, creator portal, admin tools, and marketplace.'
  },
  {
    title: 'Launch evidence first',
    body: 'Routes, APIs, auth, storage, payments, E2E, DNS, and deployment stay blocked until they are actually wired and tested.'
  }
];

export default function HomePage() {
  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="home-title">
          <p className="eyebrow">URAI Content</p>
          <h1 id="home-title">The publishing engine for the URAI Emotional OS.</h1>
          <p className="lede">
            URAI Content turns memory, mood, rituals, voice, insight, and story into canonical,
            exportable, licensable media systems for the URAI ecosystem.
          </p>
          <div className="actions" aria-label="Primary actions">
            <a className="button" href="/content">Explore content</a>
            <a className="button secondary" href="/roadmap">View roadmap</a>
          </div>
          <div className="grid" aria-label="System highlights">
            {cards.map((card) => (
              <article className="card" key={card.title}>
                <h2>{card.title}</h2>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
