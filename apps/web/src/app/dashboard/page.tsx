import { ProtectedRouteShell } from '@/components/ProtectedRouteShell';
import { getAuthRuntimeStatus } from '@/server/auth/authStatus';

export const metadata = {
  title: 'Dashboard',
  description: 'Authenticated URAI Content dashboard scaffold.'
};

const cards = [
  {
    title: 'User content library',
    body: 'This route will list user-owned content, purchases, exports, and saved items after Firebase Auth sessions and owner-scoped repository reads are implemented.'
  },
  {
    title: 'No private data yet',
    body: 'Until session verification exists, this page must not attempt to read or display user-specific content.'
  },
  {
    title: 'Next implementation gate',
    body: 'Add Firebase client sign-in, server session verification, route middleware, and owner-scoped API tests before replacing this scaffold.'
  }
];

export default function DashboardPage() {
  return (
    <ProtectedRouteShell
      eyebrow="Dashboard"
      title="Dashboard access requires authenticated runtime wiring."
      lede="This scaffold keeps the route visible for planning and smoke tests while preventing fake account behavior."
      status={getAuthRuntimeStatus()}
      cards={cards}
    />
  );
}
