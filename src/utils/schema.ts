import { SITE } from '@/consts';
import { LANG_META, type Lang } from '@/i18n/config';
import { localizedPath } from '@/i18n/utils';
import { routePath } from '@/i18n/routes';
import { ui } from '@/i18n/ui';
import { parcoursContent } from '@/i18n/content/parcours';

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

export function parcoursFaqSchema(lang: Lang) {
  // Source unique : `parcoursContent[lang].faq` (affiché côté page).
  // Le JSON-LD doit refléter ce qui est visible — sinon Google peut détecter
  // le décalage comme du cloaking.
  return faqPageSchema(
    parcoursContent[lang].faq.map((item) => ({
      question: item.q,
      answer: item.a,
    }))
  );
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
  // Si fourni, on émet un nœud `CreativeWorkSeries` dans `isPartOf` pour
  // signaler aux crawlers que l'article appartient à une série éditoriale.
  // `position` est porté par le `BlogPosting` lui-même (pas par la série) :
  // schema.org définit `position` comme « la position d'un item dans une
  // série/séquence », donc l'item est l'article, pas la série.
  // Le `url` du CreativeWorkSeries est volontairement omis : il n'existe pas
  // de page d'index série (cf. design 009-f-blog-series), et schema.org
  // tolère parfaitement une CreativeWorkSeries sans url.
  series?: { name: string; position: number };
}

export function blogPostingSchema(p: BlogPostingInput) {
  const lang: Lang = p.lang ?? 'fr';
  const url = `${SITE.url}${localizedPath(lang, `/blog/${p.slug}`)}`;
  const isPartOf = p.series
    ? [
        { '@id': WEBSITE_ID },
        {
          '@type': 'CreativeWorkSeries',
          name: p.series.name,
        },
      ]
    : { '@id': WEBSITE_ID };
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
    isPartOf,
    position: p.series ? p.series.position : undefined,
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
  coverUrl?: string;
  abstract?: string;
  relatedUrls?: string[];
}

export function softwareSourceCodeSchema(p: SoftwareSourceCodeInput) {
  const url = `${SITE.url}${localizedPath(p.lang, `${routePath('projects', p.lang)}/${p.slug}`)}`;
  const imageUrl = p.coverUrl ?? `${SITE.url}${SITE.ogImage}`;
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
