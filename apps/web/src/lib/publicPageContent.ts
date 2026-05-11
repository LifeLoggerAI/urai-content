export type PublicRouteContent = {
  route: string;
  eyebrow: string;
  title: string;
  lede: string;
  metadata: {
    title: string;
    description: string;
  };
  cards: Array<{
    title: string;
    body: string;
    href?: string;
    linkLabel?: string;
  }>;
};

export const routeShellContent = {
  stories: {
    route: '/stories',
    eyebrow: 'Stories',
    title: 'Story systems for memory, meaning, and reflection.',
    lede: 'URAI Content will expose canonical story templates, narrative prompts, and publishing-safe story surfaces. Runtime personalization is still staged behind auth and repository wiring.',
    metadata: {
      title: 'Stories',
      description: 'Story templates and narrative systems for URAI Content.'
    },
    cards: [
      { title: 'Template library', body: 'Story templates are modeled in the package and will be exposed through catalog and dashboard flows.' },
      { title: 'Personalization boundary', body: 'Personal story generation requires auth, consent, and user-owned data access before launch.' },
      { title: 'Publishing safety', body: 'Generated or submitted stories must pass moderation, visibility, and provenance rules before release.' }
    ]
  },
  rituals: {
    route: '/rituals',
    eyebrow: 'Rituals',
    title: 'Ritual content for repeatable emotional practice.',
    lede: 'Ritual templates are part of the URAI Content system, but user-specific ritual scheduling and persistence require the authenticated runtime phases.',
    metadata: {
      title: 'Rituals',
      description: 'Ritual templates and emotional practice content for URAI Content.'
    },
    cards: [
      { title: 'Canonical templates', body: 'Ritual templates can be published as public or gated records once repository seeding and admin review are complete.' },
      { title: 'User state later', body: 'Saved rituals, reminders, and user progress belong behind authenticated dashboard routes.' },
      { title: 'Non-clinical framing', body: 'Ritual copy must stay supportive and non-clinical unless reviewed by the appropriate policy process.' }
    ]
  },
  narrator: {
    route: '/narrator',
    eyebrow: 'Narrator',
    title: 'Narrator prompts for voice, reflection, and guidance.',
    lede: 'The narrator surface previews the voice and prompt system. Live generation, user context, and voice export remain staged runtime work.',
    metadata: {
      title: 'Narrator',
      description: 'Narrator prompt systems for URAI Content.'
    },
    cards: [
      { title: 'Prompt registry', body: 'Narrator prompts are modeled as content records and can be served through the catalog APIs.' },
      { title: 'Voice boundary', body: 'Voice synthesis and export require integration, storage, consent, and entitlement checks.' },
      { title: 'Safety copy', body: 'Narrator output must preserve why-shown copy, safety notes, and source labels.' }
    ]
  },
  voicePacks: {
    route: '/voice-packs',
    eyebrow: 'Voice Packs',
    title: 'Voice-ready packs for scripted emotional media.',
    lede: 'Voice packs will package narrator scripts, moods, pacing, and export formats. The first shell is public; delivery and licensing are not live yet.',
    metadata: {
      title: 'Voice Packs',
      description: 'Voice pack surfaces for URAI Content.'
    },
    cards: [
      { title: 'Script packs', body: 'Script pack records can be cataloged before synthesis or marketplace delivery is enabled.' },
      { title: 'Export requirements', body: 'Audio, SRT, and bundle exports need worker, storage, and entitlement wiring.' },
      { title: 'Licensing later', body: 'Commercial usage requires license records, marketplace gates, and release evidence.' }
    ]
  },
  marketplace: {
    route: '/marketplace',
    eyebrow: 'Marketplace',
    title: 'Marketplace content is planned, not live checkout.',
    lede: 'This route introduces the marketplace surface without pretending Stripe, entitlements, creator payouts, or gated downloads are production-ready.',
    metadata: {
      title: 'Marketplace',
      description: 'Marketplace readiness surface for URAI Content.'
    },
    cards: [
      { title: 'Catalog first', body: 'Marketplace records must be listed and gated before checkout is enabled.' },
      { title: 'Payments blocked', body: 'Stripe checkout and webhooks remain blocked until test mode, signature verification, and entitlement writes are implemented.' },
      { title: 'Creator review', body: 'Creator listings require submission, moderation, licensing, and admin approval flows.' }
    ]
  },
  creator: {
    route: '/creator',
    eyebrow: 'Creator',
    title: 'Creator workflows are staged behind auth and moderation.',
    lede: 'The creator route is a public landing shell. Submissions, earnings, licensing, and profile tools require protected routes and admin review.',
    metadata: {
      title: 'Creator',
      description: 'Creator program surface for URAI Content.'
    },
    cards: [
      { title: 'Submission path', body: 'Creator submission APIs and forms must validate content and scope records to the signed-in creator.' },
      { title: 'Moderation path', body: 'Admin review must approve, reject, or request changes before content can publish.' },
      { title: 'Earnings later', body: 'Payouts and earnings views require payment policy, tax/account setup, and marketplace events.' }
    ]
  },
  licensing: {
    route: '/licensing',
    eyebrow: 'Licensing',
    title: 'Licensing turns content into governed usage rights.',
    lede: 'Licensing support is planned for partners, creators, studios, and enterprise usage. The legal and entitlement runtime is not complete yet.',
    metadata: {
      title: 'Licensing',
      description: 'Licensing surface for URAI Content.'
    },
    cards: [
      { title: 'Usage rights', body: 'License records must define scope, owner, terms, expiration, and evidence before delivery.' },
      { title: 'Partner path', body: 'Partner licensing requires admin workflows, contract status, and audit logs.' },
      { title: 'No implied rights', body: 'Public preview access does not imply commercial licensing or redistribution rights.' }
    ]
  },
  exports: {
    route: '/exports',
    eyebrow: 'Exports',
    title: 'Exports package content into usable media artifacts.',
    lede: 'SRT and job lifecycle helpers exist in the package. Runtime export APIs, workers, storage, and downloads still need implementation.',
    metadata: {
      title: 'Exports',
      description: 'Export pipeline surface for URAI Content.'
    },
    cards: [
      { title: 'Job lifecycle', body: 'Queued, processing, completed, failed, and retry states are modeled and need runtime persistence.' },
      { title: 'Artifact storage', body: 'Downloads must be written to protected storage paths with owner/admin access rules.' },
      { title: 'Smoke tests', body: 'Export create/status/download flows require API and browser smoke tests before launch.' }
    ]
  },
  demo: {
    route: '/demo',
    eyebrow: 'Demo',
    title: 'Demo mode shows public-safe URAI Content behavior.',
    lede: 'Demo mode should use public or demo records only. It must not expose private, draft, user-owned, or tier-gated content.',
    metadata: {
      title: 'Demo',
      description: 'Public demo route for URAI Content.'
    },
    cards: [
      { title: 'Safe records only', body: 'Demo content must come from public/demo catalog records or seeded public content.' },
      { title: 'No auth assumption', body: 'Demo mode cannot depend on signed-in state or private user data.' },
      { title: 'Upgrade path later', body: 'Conversion CTAs can point to pricing or marketplace after checkout and entitlements are real.' }
    ]
  },
  versions: {
    route: '/versions',
    eyebrow: 'Versions',
    title: 'Version history must match implementation evidence.',
    lede: 'URAI Content versions and phases should reflect real shipped code, tests, and deployment proof rather than roadmap aspiration.',
    metadata: {
      title: 'Versions',
      description: 'Version and phase status for URAI Content.'
    },
    cards: [
      { title: 'V1 package foundation', body: 'Schemas, validators, seed records, and package tests form the current foundation.' },
      { title: 'Runtime phases', body: 'The web runtime, Firebase adapter, route coverage, and catalog APIs are being staged through PRs.' },
      { title: 'Launch proof', body: 'Production version claims require CI output, deployed URL, smoke results, and rollback evidence.' }
    ]
  },
  terms: {
    route: '/terms',
    eyebrow: 'Terms',
    title: 'Terms must be finalized before production launch.',
    lede: 'This page is a placeholder legal surface. Final terms require legal review before payments, licensing, creator submissions, or public launch.',
    metadata: {
      title: 'Terms',
      description: 'Terms surface for URAI Content.'
    },
    cards: [
      { title: 'Draft surface', body: 'This route exists so the site map and navigation can be wired, but it is not final legal copy.' },
      { title: 'Required before payments', body: 'Marketplace checkout, creator participation, and licensing require reviewed terms.' },
      { title: 'Production gate', body: 'Launch cannot be marked done until terms and privacy surfaces are complete and reviewed.' }
    ]
  }
} satisfies Record<string, PublicRouteContent>;
