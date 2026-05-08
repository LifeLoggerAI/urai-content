export const metadata = {
  title: 'Content',
  description: 'Canonical URAI Content registry and package status.'
};

const statusItems = [
  'Canonical content package exists and remains the source of truth.',
  'Public catalog API and Firestore-backed browsing are planned for the runtime foundation phase.',
  'Draft, private, and tier-gated content must stay hidden until auth and repository rules are implemented.'
];

export default function ContentPage() {
  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="content-title">
          <p className="eyebrow">Content Registry</p>
          <h1 id="content-title">Canonical content, not fake runtime claims.</h1>
          <p className="lede">
            This route is the first public shell for the URAI Content registry. The live catalog will
            be wired to the package validators, content service, and Firestore repository adapter in
            the next implementation phase.
          </p>
          <div className="grid" aria-label="Content route status">
            {statusItems.map((item) => (
              <article className="card" key={item}>
                <h2>Status</h2>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
