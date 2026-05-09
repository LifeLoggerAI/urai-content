import { PublicCard, PublicPage } from '@/components/PublicPage';

export const metadata = {
  title: 'Pricing',
  description: 'URAI Content pricing and tier readiness.'
};

const tiers = [
  {
    title: 'Free',
    body: 'Public content previews, roadmap visibility, and demo-safe records. Checkout is not wired yet.'
  },
  {
    title: 'Pro',
    body: 'Planned tier for expanded exports, marketplace access, and richer content workflows. Requires Stripe and entitlement wiring before launch.'
  },
  {
    title: 'Creator / Studio',
    body: 'Planned surfaces for submissions, moderation, licensing, and analytics. Requires auth, admin tools, and payout policies before launch.'
  }
];

export default function PricingPage() {
  return (
    <PublicPage
      eyebrow="Pricing"
      title="Pricing is modeled, but payments are not live yet."
      lede="This route introduces the tier surface without pretending checkout, Stripe webhooks, entitlements, or creator monetization are production-ready."
    >
      <div className="grid" aria-label="Pricing tiers">
        {tiers.map((tier) => (
          <PublicCard key={tier.title} {...tier} />
        ))}
      </div>
    </PublicPage>
  );
}
