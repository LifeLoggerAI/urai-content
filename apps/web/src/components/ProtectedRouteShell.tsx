import { PublicCard, PublicPage } from '@/components/PublicPage';
import type { AuthRuntimeStatus } from '@/server/auth/authStatus';

type ProtectedRouteShellProps = {
  eyebrow: string;
  title: string;
  lede: string;
  status: AuthRuntimeStatus;
  cards: Array<{ title: string; body: string }>;
};

export function ProtectedRouteShell({ eyebrow, title, lede, status, cards }: ProtectedRouteShellProps) {
  return (
    <PublicPage eyebrow={eyebrow} title={title} lede={lede}>
      <div className="grid" aria-label={`${eyebrow} protected route status`}>
        <PublicCard title="Auth status" body={status.message} />
        {cards.map((card) => (
          <PublicCard key={card.title} {...card} />
        ))}
      </div>
    </PublicPage>
  );
}
