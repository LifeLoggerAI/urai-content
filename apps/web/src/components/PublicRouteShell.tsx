import { PublicCard, PublicPage } from '@/components/PublicPage';
import type { PublicRouteContent } from '@/lib/publicPageContent';

export function PublicRouteShell({ content }: { content: PublicRouteContent }) {
  return (
    <PublicPage eyebrow={content.eyebrow} title={content.title} lede={content.lede}>
      <div className="grid" aria-label={`${content.eyebrow} details`}>
        {content.cards.map((card) => (
          <PublicCard key={card.title} {...card} />
        ))}
      </div>
    </PublicPage>
  );
}
