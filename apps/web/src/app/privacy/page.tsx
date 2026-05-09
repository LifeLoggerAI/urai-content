import { PublicCard, PublicPage } from '@/components/PublicPage';

export const metadata = {
  title: 'Privacy',
  description: 'Privacy principles for URAI Content.'
};

const cards = [
  {
    title: 'Private by default',
    body: 'URAI Content should only expose public, published records on public routes. Draft, private, and tier-gated content must remain hidden behind runtime rules.'
  },
  {
    title: 'User control',
    body: 'Future account features must make capture, review, export, deletion, and entitlement state visible and controllable.'
  },
  {
    title: 'Evidence before claims',
    body: 'Privacy-sensitive systems such as Auth, Firebase rules, export storage, and admin moderation must have tests and deployment proof before launch.'
  }
];

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Privacy"
      title="Privacy is a runtime requirement, not a marketing line."
      lede="URAI Content treats privacy, visibility, entitlement state, and export access as explicit product surfaces that must be implemented and tested."
    >
      <div className="grid" aria-label="Privacy principles">
        {cards.map((card) => (
          <PublicCard key={card.title} {...card} />
        ))}
      </div>
    </PublicPage>
  );
}
