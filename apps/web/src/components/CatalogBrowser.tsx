import { catalogItemApiPath } from '@/lib/catalog';
import { mediaCatalogSurfaces, selectMediaCatalogItems, type MediaCatalogSurface } from '@/lib/catalogSurfaces';
import { listRuntimeCatalogSummaries } from '@/server/content/runtimeCatalog';

export type CatalogSearchParams = Promise<{ cursor?: string | string[] }>;

export async function CatalogBrowser({
  surface,
  searchParams
}: {
  surface?: MediaCatalogSurface;
  searchParams?: CatalogSearchParams;
}) {
  const query = searchParams ? await searchParams : {};
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined;
  let catalog: Awaited<ReturnType<typeof listRuntimeCatalogSummaries>> | null = null;

  try {
    catalog = await listRuntimeCatalogSummaries({ cursor });
  } catch {
    catalog = null;
  }

  const items = catalog
    ? surface ? selectMediaCatalogItems(catalog.items, surface) : catalog.items.filter((item) =>
      (item.status === 'live' && item.visibility === 'public') || (item.status === 'demo' && item.visibility === 'demo'))
    : [];
  const title = surface?.name ?? 'Content';
  const route = surface?.route ?? '/content';

  return (
    <main>
      <div className="page-shell">
        <section className="hero" aria-labelledby="catalog-title">
          <p className="eyebrow">URAI Content</p>
          <h1 id="catalog-title">{title}</h1>
          <nav aria-label="Content collections">
            <a href="/content" aria-current={!surface ? 'page' : undefined}>All content</a>
            {mediaCatalogSurfaces.map((collection) => (
              <a key={collection.tag} href={collection.route} aria-current={surface?.tag === collection.tag ? 'page' : undefined}>
                {collection.name}
              </a>
            ))}
          </nav>
          {!catalog ? (
            <p role="alert">The catalog is temporarily unavailable. Please try again.</p>
          ) : (
            <>
              {items.length === 0 ? (
                <p>No published {surface ? surface.name.toLowerCase() + ' ' : ''}items are available in this page.</p>
              ) : (
                <div className="grid" aria-label={title + ' catalog items'}>
                  {items.map((item) => (
                    <article className="card" key={item.id}>
                      <h2>{item.title}</h2>
                      <p>{item.summary}</p>
                      <p>{item.status === 'demo' ? 'Demo' : item.status === 'live' ? 'Published' : 'Preview'}</p>
                      <a href={catalogItemApiPath(item.slug)}>View content record</a>
                    </article>
                  ))}
                </div>
              )}
              {catalog.nextCursor ? <a href={route + '?cursor=' + encodeURIComponent(catalog.nextCursor)}>Next catalog page</a> : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
