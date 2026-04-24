import { SITE } from '../consts';
import { LANG_META, type Lang } from '../i18n/config';
import { localizedPath } from '../i18n/utils';
import { ui } from '../i18n/ui';

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

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}/#person`,
    name: SITE.author.name,
    url: SITE.url,
    image: `${SITE.url}/avatar.jpeg`,
    email: `mailto:${SITE.author.email}`,
    jobTitle: lang === 'fr' ? 'CTO freelance' : 'Freelance CTO',
    worksFor: {
      '@type': 'Organization',
      name: lang === 'fr' ? 'Indépendant' : 'Independent',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.author.city,
      addressCountry: SITE.author.country,
    },
    knowsAbout: knowsAbout[lang],
    sameAs: [SITE.author.github, SITE.author.linkedin],
  };
}

export function websiteSchema(lang: Lang = 'fr') {
  const tr = ui[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: tr.site.description,
    inLanguage: LANG_META[lang].bcp47,
    publisher: { '@id': `${SITE.url}/#person` },
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
    author: { '@id': `${SITE.url}/#person` },
    publisher: { '@id': `${SITE.url}/#person` },
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
  lang?: Lang;
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
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    inLanguage: LANG_META[lang].bcp47,
    articleSection: p.category,
    keywords: p.keywords.join(', '),
    wordCount: p.wordCount,
    timeRequired: p.readingTime ? `PT${p.readingTime}M` : undefined,
    image: p.image ? `${SITE.url}${p.image}` : `${SITE.url}${SITE.ogImage}`,
    author: { '@id': `${SITE.url}/#person` },
    publisher: { '@id': `${SITE.url}/#person` },
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
