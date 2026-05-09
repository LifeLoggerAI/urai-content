import { PublicCard, PublicPage } from '@/components/PublicPage';

export const metadata = {
  title: 'Contact',
  description: 'Contact and launch-readiness channels for URAI Content.'
};

const cards = [
  {
    title: 'Product questions',
    body: 'Use this route as the public contact surface until a real form provider, CRM, or support mailbox is configured.'
  },
  {
    title: 'Creator and licensing interest',
    body: 'Creator submissions and licensing workflows are planned but require auth, moderation, and admin review before they are live.'
  },
  {
    title: 'Launch status',
    body: 'Deployment, DNS, smoke tests, and monitoring must be complete before this site can be called production-ready.',
    href: '/roadmap',
    linkLabel: 'View roadmap'
  }
];

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact"
      title="Contact is staged until the production intake path is wired."
      lede="URAI Content will support product, creator, licensing, and support intake. This page is a safe static placeholder until forms and notifications are implemented."
    >
      <div className="grid" aria-label="Contact options">
        {cards.map((card) => (
          <PublicCard key={card.title} {...card} />
        ))}
      </div>
    </PublicPage>
  );
}
