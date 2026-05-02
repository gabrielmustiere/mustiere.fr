import { SITE } from '@/consts';
import { LANG_META, type Lang } from '@/i18n/config';
import { localizedPath } from '@/i18n/utils';
import { routePath } from '@/i18n/routes';
import { ui } from '@/i18n/ui';

const PERSON_ID = `${SITE.url}/#person`;
const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;
const LOGO_ID = `${SITE.url}/#logo`;

const ALL_LOCALES: string[] = Object.values(LANG_META).map((m) => m.bcp47);

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.author.name,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: `${SITE.url}/avatar.jpeg`,
      contentUrl: `${SITE.url}/avatar.jpeg`,
      width: 512,
      height: 512,
      caption: SITE.author.name,
    },
    image: { '@id': LOGO_ID },
    sameAs: [SITE.author.github, SITE.author.linkedin],
    founder: { '@id': PERSON_ID },
  };
}

export function personSchema(lang: Lang = 'fr') {
  const knowsAbout: Record<Lang, string[]> = {
    fr: [
      'Symfony',
      'Sylius',
      'PHP',
      'Doctrine ORM',
      'API Platform',
      'Architecture logicielle',
      'Architecture hexagonale',
      'Leadership technique',
      'CTO fractional',
      'Product builder',
      'MVP',
      'Startup early stage',
      'SaaS',
      'E-commerce',
      'WebAuthn',
      'Strong Customer Authentication',
      'DevOps',
      'PostgreSQL',
      'TypeScript',
    ],
    en: [
      'Symfony',
      'Sylius',
      'PHP',
      'Doctrine ORM',
      'API Platform',
      'Software architecture',
      'Hexagonal architecture',
      'Technical leadership',
      'Fractional CTO',
      'Product builder',
      'MVP',
      'Early-stage startup',
      'SaaS',
      'E-commerce',
      'WebAuthn',
      'Strong Customer Authentication',
      'DevOps',
      'PostgreSQL',
      'TypeScript',
    ],
  };

  const description: Record<Lang, string> = {
    fr: 'CTO freelance basé à Nantes. 14 ans dans la tech, CTO depuis 2017. Architecture logicielle, leadership technique, SaaS et e-commerce.',
    en: 'Freelance CTO based in Nantes. 14 years in tech, CTO since 2017. Software architecture, technical leadership, SaaS and e-commerce.',
  };

  const occupationName = ui[lang].author.role;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.author.name,
    givenName: 'Gabriel',
    familyName: 'Mustiere',
    url: SITE.url,
    mainEntityOfPage: `${SITE.url}${localizedPath(lang, '/')}`,
    image: {
      '@type': 'ImageObject',
      url: `${SITE.url}/avatar.jpeg`,
      contentUrl: `${SITE.url}/avatar.jpeg`,
      width: 512,
      height: 512,
      caption: SITE.author.name,
    },
    email: `mailto:${SITE.author.email}`,
    jobTitle: occupationName,
    hasOccupation: {
      '@type': 'Occupation',
      name: occupationName,
      occupationLocation: {
        '@type': 'City',
        name: SITE.author.city,
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.author.city,
      addressCountry: SITE.author.country,
    },
    description: description[lang],
    knowsAbout: knowsAbout[lang],
    knowsLanguage: ['fr', 'en'],
    nationality: { '@type': 'Country', name: 'France' },
    sameAs: [SITE.author.github, SITE.author.linkedin],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: ALL_LOCALES,
    publisher: { '@id': ORG_ID },
    author: { '@id': PERSON_ID },
  };
}

export function profilePageSchema(lang: Lang) {
  const url = `${SITE.url}${localizedPath(lang, '/')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profilepage`,
    url,
    inLanguage: LANG_META[lang].bcp47,
    name: ui[lang].site.title,
    description: ui[lang].site.description,
    mainEntity: { '@id': PERSON_ID },
    about: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function parcoursPageSchema(
  lang: Lang,
  name: string,
  description: string
) {
  const url = `${SITE.url}${localizedPath(lang, routePath('parcours', lang))}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${url}#aboutpage`,
    url,
    inLanguage: LANG_META[lang].bcp47,
    name,
    description,
    mainEntity: { '@id': PERSON_ID },
    about: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export const PARCOURS_FAQ: Record<
  Lang,
  Array<{ question: string; answer: string }>
> = {
  fr: [
    {
      question: "Pourquoi un CTO freelance plutôt qu'un CTO en CDI ?",
      answer:
        "Pour les phases où l'équipe ne justifie pas un CDI plein temps (early stage, transition, audit), un CTO freelance livre l'expertise sans bloquer un poste permanent. Sur des missions longues ciblées (mise en conformité, scale-up, refonte), un freelance senior va à la cible plus vite qu'un recrutement.",
    },
    {
      question:
        "Qu'est-ce qui différencie un expert Symfony d'un développeur Symfony senior ?",
      answer:
        "Un dev senior code bien. Un expert tient compte de la dette de l'écosystème (versions LTS, montée Symfony 6 → 7, dépendances Doctrine ou API Platform), arbitre les choix architecturaux long terme, et sait lire ou refactorer une codebase existante sans tout casser.",
    },
    {
      question: 'Tu travailles avec des stacks autres que Symfony et Sylius ?',
      answer:
        "Je travaille principalement avec Symfony et son écosystème (Doctrine, API Platform, Sylius). Côté front, j'ai aussi de l'expérience avec Vue.js et Nuxt. Sur une mission, l'enjeu est plus souvent le contexte produit et l'équipe que le langage exact.",
    },
    {
      question: 'Tu acceptes les missions de cofondation ou equity ?',
      answer: 'Je suis ouvert à toute proposition honnête et intelligente.',
    },
    {
      question: 'Combien coûte une mission ?',
      answer:
        'TJM en ligne avec le marché senior CTO freelance Nantes / remote. Forfaits possibles sur audit. On en parle après un premier échange pour cadrer le besoin.',
    },
    {
      question: 'Pourquoi Nantes ?',
      answer:
        "J'y vis. Le tissu tech nantais est dense (Lengow, iAdvize, Akeneo, Manzana…) avec une vraie communauté Symfony / PHP. La plupart de mes missions se font en remote ou hybride.",
    },
  ],
  en: [
    {
      question: 'Why a freelance CTO rather than a permanent CTO?',
      answer:
        "For phases where the team doesn't justify a full-time hire (early stage, transition, audit), a freelance CTO delivers the expertise without freezing a permanent seat. On focused long engagements (compliance, scale-up, rewrite), a senior freelance reaches the target faster than a hire.",
    },
    {
      question:
        'What sets a Symfony expert apart from a senior Symfony developer?',
      answer:
        'A senior writes good code. An expert factors in ecosystem debt (LTS versions, Symfony 6 → 7 upgrade, Doctrine and API Platform dependencies), arbitrates long-term architectural choices, and can read or refactor an existing codebase without breaking everything.',
    },
    {
      question: 'Do you work with stacks other than Symfony and Sylius?',
      answer:
        'I work primarily with Symfony and its ecosystem (Doctrine, API Platform, Sylius). On the front-end side, I also have experience with Vue.js and Nuxt. On an engagement, the product context and team usually matter more than the exact language.',
    },
    {
      question: 'Do you take co-founder or equity engagements?',
      answer: "I'm open to any honest, well-thought-out proposal.",
    },
    {
      question: 'How much does an engagement cost?',
      answer:
        'Day rate aligned with senior freelance CTO market in Nantes / remote. Fixed fees possible for audits. We discuss it after a first call to frame the need.',
    },
    {
      question: 'Why Nantes?',
      answer:
        'I live here. The Nantes tech ecosystem is dense (Lengow, iAdvize, Akeneo, Manzana…) with a real Symfony / PHP community. Most of my engagements run remote or hybrid.',
    },
  ],
};

export function parcoursFaqSchema(lang: Lang) {
  return faqPageSchema(PARCOURS_FAQ[lang]);
}

export function blogSchema(lang: Lang = 'fr') {
  const tr = ui[lang];
  const blogUrl = `${SITE.url}${localizedPath(lang, '/blog')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${blogUrl}#blog`,
    url: blogUrl,
    name: `${SITE.name} — ${tr.home.blog.title}`,
    description: tr.home.blog.intro,
    inLanguage: LANG_META[lang].bcp47,
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

interface BlogPostingInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date;
  updatedAt?: Date;
  category: string;
  keywords: string[];
  wordCount?: number;
  readingTime?: number;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  tldr?: string;
  lang?: Lang;
  relatedUrls?: string[];
}

export function blogPostingSchema(p: BlogPostingInput) {
  const lang: Lang = p.lang ?? 'fr';
  const url = `${SITE.url}${localizedPath(lang, `/blog/${p.slug}`)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: p.title,
    description: p.description,
    abstract: p.tldr,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    inLanguage: LANG_META[lang].bcp47,
    articleSection: p.category,
    keywords: p.keywords.join(', '),
    wordCount: p.wordCount,
    timeRequired: p.readingTime ? `PT${p.readingTime}M` : undefined,
    image: {
      '@type': 'ImageObject',
      url: p.image,
      contentUrl: p.image,
      width: p.imageWidth ?? 1200,
      height: p.imageHeight ?? 630,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
    relatedLink:
      p.relatedUrls && p.relatedUrls.length > 0 ? p.relatedUrls : undefined,
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

interface SoftwareSourceCodeInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date;
  updatedAt?: Date;
  repository?: string;
  lang: Lang;
  cover?: string;
  abstract?: string;
  relatedUrls?: string[];
}

export function softwareSourceCodeSchema(p: SoftwareSourceCodeInput) {
  const url = `${SITE.url}${localizedPath(p.lang, `/projects/${p.slug}`)}`;
  const imageUrl = p.cover
    ? `${SITE.url}${p.cover}`
    : `${SITE.url}${SITE.ogImage}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    '@id': `${url}#project`,
    url,
    name: p.title,
    headline: p.title,
    description: p.description,
    abstract: p.abstract,
    inLanguage: LANG_META[p.lang].bcp47,
    author: { '@id': PERSON_ID },
    creator: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    ...(p.repository
      ? { codeRepository: p.repository, sameAs: [p.repository] }
      : {}),
    dateCreated: p.publishedAt,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      contentUrl: imageUrl,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
    relatedLink:
      p.relatedUrls && p.relatedUrls.length > 0 ? p.relatedUrls : undefined,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function faqPageSchema(
  items: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const SCHEMA_IDS = {
  PERSON: PERSON_ID,
  ORGANIZATION: ORG_ID,
  WEBSITE: WEBSITE_ID,
};
