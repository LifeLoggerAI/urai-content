export const metadata = {
  title: 'Roadmap',
  description: 'Implementation roadmap for URAI Content standalone runtime.'
};

const phases = [
  ['Phase 0', 'Guardrails, implementation status, route coverage, and package verification.'],
  ['Phase 1', 'Runtime scaffold, Firestore adapter, health/version/catalog/content APIs.'],
  ['Phase 2', 'Public website routes, SEO coverage, responsive UI, and CTAs.'],
  ['Phase 3', 'Auth, creator, admin, marketplace, payments, and entitlement flows.'],
  ['Phase 4', 'Export pipeline, E2E smoke tests, API tests, mobile, SEO, and error states.'],
  ['Phase 5', 'Deployment, DNS, launch evidence, rollback, and production smoke tests.'],
  ['Phase 6', 'Monitoring, alerts, hardening, and post-launch operations.']
];

export default function RoadmapPage() {
  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="roadmap-title">
          <p className="eyebrow">Roadmap</p>
          <h1 id="roadmap-title">A staged path from package to live product.</h1>
          <p className="lede">
            URAI Content will move from its current package/library foundation into a complete
            standalone runtime through explicit, testable phases. Nothing is marked done without
            file changes, checks, deployment evidence, or smoke-test proof.
          </p>
          <div className="grid" aria-label="Roadmap phases">
            {phases.map(([title, body]) => (
              <article className="card" key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
