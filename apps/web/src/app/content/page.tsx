import { listCatalogItems, summarizeCatalogItem } from '@/lib/catalog';

export const metadata = {
  title: 'Content',
  description: 'Canonical URAI Content registry and package status.'
};

export default function ContentPage() {
  const items = listCatalogItems().map(summarizeCatalogItem);

  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="content-title">
          <p className="eyebrow">Content Registry</p>
          <h1 id="content-title">Canonical URAI content registry.</h1>
          <p className="lede">
            This route now reads public and demo records from the canonical repository content tree.
            Firestore-backed browsing, auth-aware gates, and admin publishing controls remain tracked
            as follow-up runtime work.
          </p>
          <div className="grid" aria-label="Catalog items">
            {items.map((item) => (
              <article className="card" key={item.id}>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <p style={{ marginTop: 12 }}>
                  <a href={`/api/content${item.slug === '/' ? '' : item.slug}`}>View API record</a>
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
