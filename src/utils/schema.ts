import { SITE } from '@/consts';
import { LANG_META, type Lang } from '@/i18n/config';
import { localizedPath } from '@/i18n/utils';
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
      'Architecture logicielle',
      'Architecture hexagonale',
      'Leadership technique',
      'SaaS',
      'E-commerce',
      'WebAuthn',
      'Strong Customer Authentication',
      'DevOps',
      'PostgreSQL',
      'TypeScript',
    ],
    en: [
      'Software architecture',
      'Hexagonal architecture',
      'Technical leadership',
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

  const occupationName = lang === 'fr' ? 'CTO freelance' : 'Freelance CTO';

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
  image?: string;
  tldr?: string;
  lang?: Lang;
  relatedUrls?: string[];
}

export function blogPostingSchema(p: BlogPostingInput) {
  const lang: Lang = p.lang ?? 'fr';
  const url = `${SITE.url}${localizedPath(lang, `/blog/${p.slug}`)}`;
  const imageUrl = p.image
    ? `${SITE.url}${p.image}`
    : `${SITE.url}${SITE.ogImage}`;
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
      url: imageUrl,
      contentUrl: imageUrl,
      width: 1200,
      height: 630,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
    relatedLink: p.relatedUrls && p.relatedUrls.length > 0 ? p.relatedUrls : undefined,
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

interface SoftwareSourceCodeInput {
  title: string;
  description: string;
  slug: string;
  year: number;
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
    dateCreated: `${p.year}-01-01`,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      contentUrl: imageUrl,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
    relatedLink: p.relatedUrls && p.relatedUrls.length > 0 ? p.relatedUrls : undefined,
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

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
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
