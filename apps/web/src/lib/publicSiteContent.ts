export type SiteSection = {
  title: string;
  body: string;
  items?: string[];
};

export type SiteFaq = {
  question: string;
  answer: string;
};

export type SiteCta = {
  label: string;
  href: string;
};

export type SitePage = {
  route: string;
  eyebrow: string;
  title: string;
  lede: string;
  metadata: {
    title: string;
    description: string;
  };
  primaryCta?: SiteCta;
  secondaryCta?: SiteCta;
  sections: SiteSection[];
  faqs?: SiteFaq[];
};

export const defaultSeo = {
  title: 'URAI — A Privacy-First Life Operating System',
  description:
    'URAI helps you understand your life through passive, privacy-first personal intelligence, emotional timelines, cognitive mirrors, and user-controlled data ownership.'
};

export const publicPages = {
  home: {
    route: '/',
    eyebrow: 'URAI',
    title: 'Understand your life from the data you already create.',
    lede:
      'URAI is a passive, privacy-first life operating system that turns everyday signals into emotional timelines, cognitive mirrors, relationship insights, and personal data ownership tools — all under your control.',
    metadata: defaultSeo,
    primaryCta: { label: 'Join the Waitlist', href: '/waitlist' },
    secondaryCta: { label: 'View the Demo', href: '/demo' },
    sections: [
      {
        title: 'What URAI is',
        body:
          'URAI helps you see the invisible patterns shaping your life. Instead of forcing constant journaling, URAI organizes approved signals such as audio reflections, location context, routines, device activity, and interaction patterns into calm, useful reflections.'
      },
      {
        title: 'How URAI works',
        body:
          'URAI starts with permission, organizes approved life signals, translates patterns into visual and narrative insight, and keeps control with the user through settings, export, deletion, and opt-in participation choices.',
        items: ['Permission-based capture', 'Private pattern organization', 'Council reflections', 'User control']
      },
      {
        title: 'Core experiences',
        body:
          'The public product experience centers on the Cognitive Mirror, Emotional Timeline, Memory Map, Council companion, relationship intelligence, mood forecasting, and user-owned data controls.',
        items: ['Cognitive Mirror', 'Emotional Timeline', 'Memory Map', 'Council Companion', 'Relationship Intelligence', 'Mood Forecasting']
      },
      {
        title: 'Privacy-first by design',
        body:
          'URAI is built for deeply personal information. The core product is separate from optional data participation, and every claim must stay grounded in consent, transparency, user control, and non-medical reflection.'
      }
    ],
    faqs: [
      { question: 'Is URAI a therapy app?', answer: 'No. URAI provides reflective personal insights and is not therapy, diagnosis, crisis care, or a substitute for professional support.' },
      { question: 'Can users earn from data?', answer: 'URAI may offer future opt-in data participation opportunities for eligible users, but participation and earnings are never guaranteed.' }
    ]
  },
  about: {
    route: '/about',
    eyebrow: 'About URAI Labs',
    title: 'We are building private mirrors for modern life.',
    lede:
      'URAI Labs exists to help people transform scattered personal signals into reflection, memory, pattern recognition, and agency without surrendering control of their identity.',
    metadata: {
      title: 'About URAI Labs',
      description: 'Learn why URAI Labs is building a passive, privacy-first life operating system for personal intelligence and user-owned data.'
    },
    primaryCta: { label: 'Join the Waitlist', href: '/waitlist' },
    secondaryCta: { label: 'Contact URAI Labs', href: '/contact' },
    sections: [
      {
        title: 'The founder story',
        body:
          'URAI began from a simple frustration: modern life creates more data than ever, but almost none of it helps the person living that life understand themselves. URAI brings those scattered signals back to the user as private, meaningful reflection.'
      },
      {
        title: 'The mission',
        body:
          'URAI Labs is building human-centered personal intelligence: calm enough for everyday life, strong enough for investors and partners, and ethical enough for the next era of user-controlled data.'
      },
      {
        title: 'The principle',
        body:
          'URAI is not about replacing intuition. It is about giving intuition better mirrors — private, beautiful, explainable, and controlled by the user.'
      }
    ]
  },
  product: {
    route: '/product',
    eyebrow: 'Product',
    title: 'URAI turns passive life signals into personal intelligence.',
    lede:
      'URAI connects routines, emotions, relationships, places, habits, memories, and digital behavior, then reflects them back through a private visual operating system.',
    metadata: {
      title: 'Product',
      description: 'Explore URAI features including passive capture, Cognitive Mirror, Emotional Timeline, Memory Map, Council Companion, and data ownership.'
    },
    primaryCta: { label: 'Explore Demo', href: '/demo' },
    secondaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [
      {
        title: 'Passive capture',
        body:
          'URAI is designed to work quietly with only the permissions a user chooses. Users can start with a small set of signals and expand only when comfortable.',
        items: ['Audio reflections and transcriptions', 'Location context', 'Device activity patterns', 'Habit and routine signals', 'Social interaction rhythms', 'Environmental context']
      },
      {
        title: 'Cognitive Mirror',
        body:
          'A daily and weekly reflection layer that helps users understand mood, energy, focus, stress, recovery, and behavioral patterns without presenting them as medical conclusions.'
      },
      {
        title: 'Emotional Timeline and Memory Map',
        body:
          'URAI visualizes emotional seasons, life chapters, recurring loops, recovery arcs, and meaningful moments as a timeline and constellation-style memory map.'
      },
      {
        title: 'Council Companion',
        body:
          'The Council is URAI’s AI reflection layer. It translates complex patterns into grounded, human-readable insights while preserving safety, consent, and non-clinical framing.'
      },
      {
        title: 'Data ownership',
        body:
          'URAI is building toward opt-in data participation programs where eligible users may choose privacy-preserving research or partner participation. Eligibility and earnings are not guaranteed.'
      }
    ]
  },
  howItWorks: {
    route: '/how-it-works',
    eyebrow: 'How It Works',
    title: 'A private intelligence loop for everyday life.',
    lede: 'URAI works in four steps: permission, patterning, reflection, and control.',
    metadata: {
      title: 'How URAI Works',
      description: 'See how URAI turns permission-based life signals into private reflections, emotional timelines, and user-controlled insights.'
    },
    primaryCta: { label: 'See Demo', href: '/demo' },
    secondaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [
      { title: '1. Permission', body: 'URAI begins with consent. Users choose which sources to connect and can disable them later. No passive signal should be collected without clear user permission.' },
      { title: '2. Patterning', body: 'Approved signals are organized into structured patterns across time, place, mood, routine, relationship, memory, behavior, recovery, focus, and context.' },
      { title: '3. Reflection', body: 'URAI translates patterns into Cognitive Mirror summaries, Emotional Timeline arcs, Memory Map moments, Council reflections, weekly summaries, and forecast cards.' },
      { title: '4. Control', body: 'Users manage permission settings, export options, deletion controls, optional marketplace preferences, privacy preferences, and notification preferences.' }
    ]
  },
  privacy: {
    route: '/privacy',
    eyebrow: 'Privacy',
    title: 'Privacy is not a feature. It is the foundation.',
    lede:
      'URAI is built for deeply personal information. Trust has to be designed into the product from the beginning.',
    metadata: {
      title: 'Privacy',
      description: 'URAI privacy principles: consent-first access, user control, transparency, export/delete controls, and non-medical reflection.'
    },
    primaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    secondaryCta: { label: 'Read Data Ownership', href: '/data-ownership' },
    sections: [
      { title: 'Consent first', body: 'URAI only works with data sources a user chooses to enable. Passive access should never be hidden, assumed, or bundled into unrelated features.' },
      { title: 'User control', body: 'Users should be able to review, export, disconnect, or delete data wherever technically supported.' },
      { title: 'Transparency', body: 'URAI should explain why an insight appears and what type of signal contributed to it.' },
      { title: 'What URAI does not do', body: 'URAI does not diagnose medical or mental health conditions, guarantee emotional outcomes, guarantee income from data, sell personal identity, require public sharing, or replace licensed professional support.' }
    ]
  },
  dataOwnership: {
    route: '/data-ownership',
    eyebrow: 'Data Ownership',
    title: 'Your data should be understandable, controllable, and valuable to you.',
    lede:
      'URAI is built on the belief that people deserve more visibility and control over the data their lives create.',
    metadata: {
      title: 'Data Ownership',
      description: 'Learn how URAI approaches user-controlled data, optional data participation, transparency, and consent.'
    },
    primaryCta: { label: 'Join Data Ownership Waitlist', href: '/waitlist' },
    secondaryCta: { label: 'For Researchers', href: '/researchers' },
    sections: [
      { title: 'User-owned data philosophy', body: 'Every day, people generate valuable behavioral, emotional, contextual, and lifestyle signals. URAI is designed to return insight and control to the person creating those signals.' },
      { title: 'Optional marketplace participation', body: 'Future data programs may allow eligible users to contribute anonymized or aggregated data to approved research or partner use cases. Participation is optional, consent-based, transparent, and separate from core app access.' },
      { title: 'No guaranteed earnings', body: 'URAI should never promise users will earn money. Eligible users may have future opportunities depending on demand, geography, consent settings, data type, and partner requirements.' }
    ]
  },
  users: {
    route: '/users',
    eyebrow: 'For Users',
    title: 'Self-understanding without constant self-reporting.',
    lede: 'URAI is for people who want clearer patterns, calmer reflection, and more control over their digital life signals.',
    metadata: {
      title: 'For Users',
      description: 'URAI helps users understand emotional, relational, behavioral, and routine patterns with privacy-first passive intelligence.'
    },
    primaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [
      { title: 'Less manual tracking', body: 'URAI reduces the burden of constant journaling by organizing signals users already create and choose to connect.' },
      { title: 'More useful reflection', body: 'The Cognitive Mirror and Council companion convert patterns into language that feels calm, human, and actionable.' },
      { title: 'Personal control', body: 'Users choose permissions, review insights, and keep optional data participation separate from the core experience.' }
    ]
  },
  researchers: {
    route: '/researchers',
    eyebrow: 'For Researchers',
    title: 'Human-centered data, with consent at the center.',
    lede:
      'URAI is building toward research collaboration models that respect privacy, consent, transparency, and user control.',
    metadata: {
      title: 'For Researchers',
      description: 'Partner with URAI Labs on ethical, consent-based research collaboration around personal intelligence and user-controlled data.'
    },
    primaryCta: { label: 'Request Research Collaboration', href: '/contact?type=research' },
    sections: [
      { title: 'Approved access only', body: 'Research access should be structured, approved, and consent-based. URAI should not expose personally identifiable data without explicit permission and appropriate safeguards.' },
      { title: 'Useful domains', body: 'Potential research areas include passive routine patterns, emotion and recovery arcs, digital wellbeing, relationship rhythms, and privacy-preserving personal data systems.' },
      { title: 'Trust boundary', body: 'Research collaboration must remain transparent to users and separate from the core consumer experience.' }
    ]
  },
  partners: {
    route: '/partners',
    eyebrow: 'For Partners',
    title: 'Partner with URAI to build ethical personal intelligence.',
    lede:
      'URAI Labs is open to partnerships across wellness, productivity, research, privacy technology, AI infrastructure, and consent-based data ecosystems.',
    metadata: {
      title: 'For Partners',
      description: 'Explore URAI Labs partnerships in wellness, research, AI infrastructure, wearables, productivity, and ethical data ecosystems.'
    },
    primaryCta: { label: 'Start a Partnership Conversation', href: '/contact?type=partner' },
    sections: [
      { title: 'Partnership areas', body: 'URAI is designed for collaboration with wellness platforms, research institutions, privacy-preserving data infrastructure, wearables, productivity tools, and ethical AI companies.' },
      { title: 'Partner value', body: 'Partners can explore integrations that improve user insight while preserving consent, transparency, and control.' },
      { title: 'Guardrails', body: 'URAI does not position personal intelligence as surveillance, hidden extraction, diagnosis, or guaranteed monetization.' }
    ]
  },
  investors: {
    route: '/investors',
    eyebrow: 'For Investors',
    title: 'URAI Labs is building the privacy-first personal intelligence layer for human life data.',
    lede:
      'URAI sits at the intersection of AI, consumer wellness, personal data ownership, emotional intelligence, and ethical data infrastructure.',
    metadata: {
      title: 'For Investors',
      description: 'URAI Labs investor overview: privacy-first personal intelligence, passive life data, ethical data ownership, and consumer AI.'
    },
    primaryCta: { label: 'Request Investor Brief', href: '/contact?type=investor' },
    sections: [
      { title: 'Investor thesis', body: 'People generate massive amounts of personal data, but most of it is fragmented across devices, platforms, and apps. URAI turns fragmented life data into private, user-facing intelligence.' },
      { title: 'Why now', body: 'AI can summarize complex personal patterns, consumers are increasingly privacy-aware, passive tracking is technically possible, and data ownership is becoming a major cultural and regulatory conversation.' },
      { title: 'The wedge', body: 'URAI begins with reflective user value — Cognitive Mirror, Emotional Timeline, Memory Map, and Council — then expands into ethical data participation and partner infrastructure.' }
    ]
  },
  demo: {
    route: '/demo',
    eyebrow: 'Demo',
    title: 'See the URAI experience with public-safe sample data.',
    lede:
      'The URAI demo shows the Cognitive Mirror, Emotional Timeline, Memory Map, Council reflections, and data ownership controls without exposing real private user data.',
    metadata: {
      title: 'Demo',
      description: 'Preview URAI with public-safe sample data across Cognitive Mirror, Emotional Timeline, Memory Map, and Council reflections.'
    },
    primaryCta: { label: 'Request Demo Access', href: '/contact?type=demo' },
    secondaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [
      { title: 'Cognitive Mirror preview', body: 'Sample cards show focus rhythm, emotional load, recovery periods, and routine patterns.' },
      { title: 'Emotional Timeline preview', body: 'A public-safe timeline demonstrates how URAI can show emotional seasons, turning points, and rebound arcs.' },
      { title: 'Memory Map preview', body: 'Constellation-style demo moments show how conversations, places, routines, and milestones can become navigable memory points.' },
      { title: 'Council reflection preview', body: 'The Council explains demo patterns in calm, non-clinical language that is grounded in sample signals.' }
    ]
  },
  waitlist: {
    route: '/waitlist',
    eyebrow: 'Waitlist',
    title: 'Be first to experience passive personal intelligence.',
    lede: 'Join the URAI waitlist for early access to the demo, launch updates, and future private beta invitations.',
    metadata: {
      title: 'Waitlist',
      description: 'Join the URAI waitlist for early access to passive personal intelligence, Cognitive Mirror, Emotional Timeline, and data ownership tools.'
    },
    sections: [
      { title: 'What you will receive', body: 'Early access updates, demo invitations, private beta opportunities, and product notes from URAI Labs.' },
      { title: 'Confirmation copy', body: 'You are on the URAI waitlist. We will send updates as early access opens.' }
    ]
  },
  faq: {
    route: '/faq',
    eyebrow: 'FAQ',
    title: 'Clear answers about URAI, privacy, data, and safety.',
    lede: 'URAI is designed to feel powerful without becoming unclear. These answers keep the product grounded.',
    metadata: {
      title: 'FAQ',
      description: 'Answers about URAI privacy, passive data, Council companion, mental health disclaimers, and optional data participation.'
    },
    primaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [],
    faqs: [
      { question: 'What is URAI?', answer: 'URAI is a passive, privacy-first life operating system that helps users understand emotional, behavioral, relational, and contextual patterns from data they choose to connect.' },
      { question: 'Is URAI a therapy app?', answer: 'No. URAI is not therapy, medical care, diagnosis, or crisis support. It provides reflective personal insights and should not replace professional support.' },
      { question: 'What does passive mean?', answer: 'Passive means URAI is designed to reduce manual input. Instead of forcing users to constantly journal or track, URAI can organize approved background signals into useful reflections.' },
      { question: 'Does URAI sell my data?', answer: 'URAI’s core experience does not require selling personal data. Future data participation programs should be opt-in, consent-based, and transparent.' },
      { question: 'Can I make money from my data?', answer: 'URAI may offer eligible users opportunities to participate in future data programs, but earnings are not guaranteed.' },
      { question: 'What is the Council?', answer: 'The Council is URAI’s AI companion layer. It explains patterns, summarizes insights, and helps users reflect in calm, human-readable language.' }
    ]
  },
  terms: {
    route: '/terms',
    eyebrow: 'Terms and Disclaimer',
    title: 'Reflective insight, not medical advice.',
    lede:
      'URAI provides informational and reflective insights based on data sources users choose to connect.',
    metadata: {
      title: 'Terms and Disclaimer',
      description: 'URAI legal and safety disclaimer covering non-medical insights, crisis support boundaries, and optional data participation.'
    },
    sections: [
      { title: 'Non-medical disclaimer', body: 'URAI is not a medical device, therapy provider, crisis service, diagnostic tool, or substitute for professional medical, mental health, legal, or financial advice.' },
      { title: 'Insight limitations', body: 'URAI insights may be incomplete, incorrect, or context-dependent. Users should not rely on URAI as the sole basis for important health, safety, financial, legal, or relationship decisions.' },
      { title: 'Crisis language', body: 'If you are experiencing a crisis, emergency, or risk of harm, contact local emergency services or a qualified professional immediately.' },
      { title: 'Data participation', body: 'Data participation or marketplace programs, if available, are optional and do not guarantee compensation.' }
    ]
  },
  updates: {
    route: '/updates',
    eyebrow: 'Updates',
    title: 'Launch notes from URAI Labs.',
    lede: 'Follow public progress as URAI moves from demo, waitlist, and private beta toward wider launch.',
    metadata: {
      title: 'Updates',
      description: 'URAI Labs launch updates, product notes, demo milestones, and public progress.'
    },
    primaryCta: { label: 'Join Waitlist', href: '/waitlist' },
    sections: [
      { title: 'Launch announcement', body: 'URAI is opening early access for people who want passive, privacy-first personal intelligence built around emotional timelines, cognitive mirrors, and user-controlled data.' },
      { title: 'Founder notes', body: 'Future updates will share product progress, privacy decisions, demo releases, and partnership milestones.' }
    ]
  },
  contact: {
    route: '/contact',
    eyebrow: 'Contact',
    title: 'Start a conversation with URAI Labs.',
    lede: 'Use the contact form for demo access, investor interest, partnerships, research collaboration, press, or general questions.',
    metadata: {
      title: 'Contact',
      description: 'Contact URAI Labs for demo access, investor interest, partnerships, research collaboration, press, or general questions.'
    },
    sections: [
      { title: 'Best fit', body: 'Choose the inquiry type that best matches your interest so the URAI Labs team can route it correctly.' }
    ]
  }
} satisfies Record<string, SitePage>;

export const publicNavigation = [
  { label: 'Product', href: '/product' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Data Ownership', href: '/data-ownership' },
  { label: 'Demo', href: '/demo' },
  { label: 'Waitlist', href: '/waitlist' }
];

export const footerNavigation = [
  { label: 'About', href: '/about' },
  { label: 'Users', href: '/users' },
  { label: 'Researchers', href: '/researchers' },
  { label: 'Partners', href: '/partners' },
  { label: 'Investors', href: '/investors' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms', href: '/terms' },
  { label: 'Updates', href: '/updates' },
  { label: 'Contact', href: '/contact' }
];

export function getPageMetadata(page: SitePage) {
  return {
    title: page.metadata.title,
    description: page.metadata.description,
    alternates: {
      canonical: page.route
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
      url: page.route,
      siteName: 'URAI',
      type: 'website'
    }
  };
}
