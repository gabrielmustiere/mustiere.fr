import type { Lang } from '../config';

export type Segment = string | { em: string };
export type RichBullet = Segment[];

export type ExperienceId =
  | 'anytime'
  | 'passion-barbecue'
  | 'progicar'
  | 'xl-soft';

export interface ExperienceItem {
  id: ExperienceId;
  period: string;
  title: string;
  context: string;
  /** Anytime only: la 1ʳᵉ expérience est rendue intégralement via données. */
  anytimeBullets?: RichBullet[];
}

export type ExpertiseId = 'symfony' | 'sylius' | 'product-builder';

export interface ExpertiseHeading {
  id: ExpertiseId;
  title: string;
}

export interface SecurityBullet {
  strong: string;
  suffix: string;
}

export type InterventionModeId =
  | 'long-engagement'
  | 'fractional-cto'
  | 'audit'
  | 'sparring-partner';

export interface InterventionMode {
  id: InterventionModeId;
  title: string;
  body: string;
}

export interface LocationField {
  term: string;
  description: string;
}

export interface FaqEntry {
  q: string;
  a: string;
}

export interface ParcoursContent {
  experiences: ExperienceItem[];
  expertises: ExpertiseHeading[];
  architectureBullets: string[];
  architectureTitle: string;
  securityBullets: SecurityBullet[];
  interventionModes: InterventionMode[];
  locationSectionTitle: string;
  location: LocationField[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  faq: FaqEntry[];
}

export const parcoursContent: Record<Lang, ParcoursContent> = {
  fr: {
    experiences: [
      {
        id: 'anytime',
        period: "Sept. 2025 → aujourd'hui",
        title: 'Anytime — Lead WebAuthn & PSD2',
        context: 'Banque digitale · Symfony · sécurité bancaire',
        anytimeBullets: [
          [
            'Mise en conformité ',
            { em: 'Strong Customer Authentication' },
            ' (PSD2) avec WebAuthn',
          ],
          ['Intégration passkeys, biométrie'],
          ['Coordination avec les équipes produit, conformité et plateforme'],
        ],
      },
      {
        id: 'passion-barbecue',
        period: '2022 → 2025',
        title: 'Passion Barbecue — Cofondateur & CTO',
        context: 'E-commerce premium · Sylius',
      },
      {
        id: 'progicar',
        period: '2017 → 2023',
        title: 'Progicar / Groupe GEMY — CTO fondateur',
        context: 'Filiale SaaS B2B · Symfony · 0 → 20+ personnes',
      },
      {
        id: 'xl-soft',
        period: '2013 → 2017',
        title: 'XL Soft — Développeur web & pilote certification NF 525',
        context: 'Éditeur logiciel retail · PHP · NF 525 / AFNOR',
      },
    ],
    expertises: [
      { id: 'symfony', title: 'Symfony — depuis 2012' },
      { id: 'sylius', title: 'Sylius — e-commerce sur mesure' },
      { id: 'product-builder', title: 'Product builder — 0 → 1 et 1 → n' },
    ],
    architectureTitle: 'Architecture & lead technique',
    architectureBullets: [
      'Architecture évolutive : hexagonale, DDD light, monolithe modulaire avant micro-services',
      'DevOps : industrialisation CI/CD, déploiements progressifs, monitoring',
      "Recrutement et structuration d'équipes 5 → 25 personnes",
      'Cadrage produit-tech, alignement avec le business, arbitrage dette / vélocité',
    ],
    securityBullets: [
      {
        strong: 'WebAuthn',
        suffix: '/ passkeys / biométrie / clés matérielles',
      },
      { strong: 'PSD2 / SCA', suffix: '(Strong Customer Authentication)' },
      {
        strong: 'RGPD',
        suffix: '(données personnelles, sous-traitance, consentement)',
      },
    ],
    interventionModes: [
      {
        id: 'long-engagement',
        title: 'Mission longue (3-12 mois)',
        body: 'Lead technique sur un projet structurant, intégré à votre équipe. Format actuel sur Anytime.',
      },
      {
        id: 'fractional-cto',
        title: 'CTO fractional — startup early stage',
        body: "1 à 3 jours par semaine, en complément d'un fondateur non-tech ou d'une équipe junior. Pour passer du MVP à la première traction sans recruter de CTO permanent trop tôt.",
      },
      {
        id: 'audit',
        title: 'Audit (1-3 semaines)',
        body: "Audit de codebase, d'architecture, d'organisation tech. Livrable écrit, recommandations priorisées, restitution orale.",
      },
      {
        id: 'sparring-partner',
        title: 'Sparring partner',
        body: 'Sessions régulières (1h/semaine ou 1/2j/mois) pour challenger vos décisions tech et produit. Pour fondateurs ou CTOs en place qui veulent un regard extérieur.',
      },
    ],
    locationSectionTitle: 'Localisation & disponibilité',
    location: [
      { term: 'Basé à', description: 'Nantes (44)' },
      { term: 'Remote', description: 'France · Europe' },
      { term: 'On-site', description: 'Nantes · Paris ponctuel' },
      { term: 'Disponibilité', description: 'Q3 2026' },
    ],
    ctaEyebrow: 'Et maintenant ?',
    ctaTitle: 'On en parle.',
    ctaBody:
      'Mission longue, fractional, audit, sparring : un mail suffit. Réponse sous 48h.',
    ctaButton: 'Écrire un mail',
    faq: [
      {
        q: "Pourquoi un CTO freelance plutôt qu'un CTO en CDI ?",
        a: "Pour les phases où l'équipe ne justifie pas un CDI plein temps (early stage, transition, audit), un CTO freelance livre l'expertise sans bloquer un poste permanent. Et sur des missions longues ciblées (mise en conformité, scale-up, refonte), un freelance senior va à la cible plus vite qu'un recrutement.",
      },
      {
        q: "Qu'est-ce qui différencie un expert Symfony d'un développeur Symfony senior ?",
        a: "Un dev senior code bien. Un expert tient compte de la dette de l'écosystème (versions LTS, montée Symfony 6 → 7, dépendances Doctrine ou API Platform), arbitre les choix architecturaux long terme, et sait lire / refactorer une codebase existante sans tout casser.",
      },
      {
        q: 'Tu travailles avec des stacks autres que Symfony et Sylius ?',
        a: "Je travaille principalement avec Symfony et son écosystème (Doctrine, API Platform, Sylius). Côté front, j'ai aussi de l'expérience avec Vue.js et Nuxt. Sur une mission, l'enjeu est plus souvent le contexte produit et l'équipe que le langage exact.",
      },
      {
        q: 'Tu acceptes les missions de cofondation / equity ?',
        a: 'Je suis ouvert à toute proposition honnête et intelligente.',
      },
      {
        q: 'Combien coûte une mission ?',
        a: 'TJM en ligne avec le marché senior CTO freelance Nantes / remote. Forfaits possibles sur audit. On en parle après un premier échange pour cadrer le besoin.',
      },
      {
        q: 'Pourquoi Nantes ?',
        a: "J'y vis. Le tissu tech nantais est dense (Lengow, iAdvize, Akeneo, Manzana…) avec une vraie communauté Symfony / PHP. La plupart de mes missions se font en remote ou hybride.",
      },
    ],
  },
  en: {
    experiences: [
      {
        id: 'anytime',
        period: 'Sept 2025 → present',
        title: 'Anytime — WebAuthn & PSD2 Lead',
        context: 'Digital bank · Symfony · banking security',
        anytimeBullets: [
          [
            { em: 'Strong Customer Authentication' },
            ' (PSD2) compliance with WebAuthn',
          ],
          ['Passkey, biometric integration'],
          ['Cross-team coordination with product, compliance and platform'],
        ],
      },
      {
        id: 'passion-barbecue',
        period: '2022 → 2025',
        title: 'Passion Barbecue — Co-founder & CTO',
        context: 'Premium e-commerce · Sylius',
      },
      {
        id: 'progicar',
        period: '2017 → 2023',
        title: 'Progicar / Groupe GEMY — Founding CTO',
        context: 'B2B SaaS subsidiary · Symfony · 0 → 20+ people',
      },
      {
        id: 'xl-soft',
        period: '2013 → 2017',
        title: 'XL Soft — Web developer & NF 525 certification lead',
        context: 'Retail software vendor · PHP · NF 525 / AFNOR',
      },
    ],
    expertises: [
      { id: 'symfony', title: 'Symfony — since 2012' },
      { id: 'sylius', title: 'Sylius — bespoke e-commerce' },
      { id: 'product-builder', title: 'Product builder — 0 → 1 and 1 → n' },
    ],
    architectureTitle: 'Architecture & technical leadership',
    architectureBullets: [
      'Evolutive architecture: hexagonal, light DDD, modular monolith before microservices',
      'DevOps: CI/CD industrialisation, progressive delivery, monitoring',
      'Hiring and structuring teams from 5 to 25 people',
      'Product-tech framing, business alignment, debt vs. velocity trade-offs',
    ],
    securityBullets: [
      { strong: 'WebAuthn', suffix: '/ passkeys / biometrics / hardware keys' },
      { strong: 'PSD2 / SCA', suffix: '(Strong Customer Authentication)' },
      {
        strong: 'RGPD',
        suffix: '(personal data, sub-processors, consent)',
      },
    ],
    interventionModes: [
      {
        id: 'long-engagement',
        title: 'Long engagement (3-12 months)',
        body: 'Technical lead on a structuring project, embedded in your team. Current format with Anytime.',
      },
      {
        id: 'fractional-cto',
        title: 'Fractional CTO — early-stage startup',
        body: '1 to 3 days a week, alongside a non-technical founder or a junior team. To go from MVP to first traction without hiring a permanent CTO too early.',
      },
      {
        id: 'audit',
        title: 'Audit (1-3 weeks)',
        body: 'Codebase, architecture or tech-organisation audit. Written deliverable with prioritised recommendations and a live debrief.',
      },
      {
        id: 'sparring-partner',
        title: 'Sparring partner',
        body: 'Regular sessions (1h/week or 1/2 day a month) to challenge your tech and product decisions. For founders or incumbent CTOs who want an outside perspective.',
      },
    ],
    locationSectionTitle: 'Location & availability',
    location: [
      { term: 'Based in', description: 'Nantes (44)' },
      { term: 'Remote', description: 'France · Europe' },
      { term: 'On-site', description: 'Nantes · Paris occasionally' },
      { term: 'Availability', description: 'Q3 2026' },
    ],
    ctaEyebrow: 'Next?',
    ctaTitle: "Let's talk.",
    ctaBody:
      'Long engagement, fractional, audit or sparring: a single email is enough. Response within 48h.',
    ctaButton: 'Write an email',
    faq: [
      {
        q: 'Why a freelance CTO rather than a permanent CTO?',
        a: "For phases where the team doesn't justify a full-time hire (early stage, transition, audit), a freelance CTO delivers the expertise without freezing a permanent seat. And on focused long engagements (compliance, scale-up, rewrite), a senior freelance reaches the target faster than a hire.",
      },
      {
        q: 'What sets a Symfony expert apart from a senior Symfony developer?',
        a: 'A senior writes good code. An expert factors in ecosystem debt (LTS versions, Symfony 6 → 7 upgrade, Doctrine and API Platform dependencies), arbitrates long-term architectural choices, and can read / refactor an existing codebase without breaking everything.',
      },
      {
        q: 'Do you work with stacks other than Symfony and Sylius?',
        a: 'I work primarily with Symfony and its ecosystem (Doctrine, API Platform, Sylius). On the front-end side, I also have experience with Vue.js and Nuxt. On an engagement, the product context and team usually matter more than the exact language.',
      },
      {
        q: 'Do you take co-founder / equity engagements?',
        a: "I'm open to any honest, well-thought-out proposal.",
      },
      {
        q: 'How much does an engagement cost?',
        a: 'Day rate aligned with senior freelance CTO market in Nantes / remote. Fixed fees possible for audits. We discuss it after a first call to frame the need.',
      },
      {
        q: 'Why Nantes?',
        a: 'I live here. The Nantes tech ecosystem is dense (Lengow, iAdvize, Akeneo, Manzana…) with a real Symfony / PHP community. Most of my engagements run remote or hybrid.',
      },
    ],
  },
};
