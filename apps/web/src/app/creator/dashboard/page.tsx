import { ProtectedRouteShell } from '@/components/ProtectedRouteShell';
import { getAuthRuntimeStatus } from '@/server/auth/authStatus';

export const metadata = {
  title: 'Creator Dashboard',
  description: 'Creator dashboard scaffold for URAI Content.'
};

const cards = [
  {
    title: 'Creator role required',
    body: 'This route must require a verified creator role claim before submissions, licensing, or earnings data are exposed.'
  },
  {
    title: 'Submission workflow pending',
    body: 'Creator submissions need validated forms, owner-scoped writes, moderation queues, and admin decision records.'
  },
  {
    title: 'Earnings not live',
    body: 'Creator earnings require marketplace events, payout policy, tax/account setup, and payment reconciliation before launch.'
  }
];

export default function CreatorDashboardPage() {
  return (
    <ProtectedRouteShell
      eyebrow="Creator Dashboard"
      title="Creator tools require auth, roles, and moderation."
      lede="This scaffold reserves the route while making it clear that creator runtime workflows are not live yet."
      status={getAuthRuntimeStatus()}
      cards={cards}
    />
  );
}
