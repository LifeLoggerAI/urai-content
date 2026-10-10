import { PublicPage } from '@/components/PublicPage';
import { CreatorWorkflow } from '@/components/CreatorWorkflow';
export const metadata = { title: 'Your creator submissions' };
export const dynamic = 'force-dynamic';
export default function Page() {
  const projectMatches = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  return <PublicPage eyebrow="Creator" title="Your creator submissions" lede="Use your existing creator account. Current server access and durable saving are required."><CreatorWorkflow projectMatches={projectMatches} mode="history" /></PublicPage>;
}
