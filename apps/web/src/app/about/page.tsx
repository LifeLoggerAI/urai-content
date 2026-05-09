import { PublicCard, PublicPage } from '@/components/PublicPage';

export const metadata = {
  title: 'About',
  description: 'About URAI Content and its role in the URAI Emotional OS.'
};

const cards = [
  {
    title: 'Content engine',
    body: 'URAI Content owns canonical schemas, public content records, validators, and publishing contracts for the wider URAI ecosystem.'
  },
  {
    title: 'Standalone runtime',
    body: 'This web surface is being built in stages from package foundation to public website, catalog APIs, Firebase runtime, and deployment evidence.'
  },
  {
    title: 'Release discipline',
    body: 'The system does not mark Firebase, payments, DNS, or production launch complete until code, tests, and smoke evidence prove it.'
  }
];

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="About"
      title="URAI Content is the publishing layer for emotional intelligence systems."
      lede="It turns canonical records, rituals, story templates, voice prompts, exports, and licensing surfaces into a governed content system for URAI products."
    >
      <div className="grid" aria-label="About URAI Content">
        {cards.map((card) => (
          <PublicCard key={card.title} {...card} />
        ))}
      </div>
    </PublicPage>
  );
}
