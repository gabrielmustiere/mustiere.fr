import { SITE } from '../consts';

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}/#person`,
    name: SITE.author.name,
    url: SITE.url,
    email: `mailto:${SITE.author.email}`,
    jobTitle: SITE.author.jobTitle,
    worksFor: { '@type': 'Organization', name: 'Indépendant' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.author.city,
      addressCountry: SITE.author.country,
    },
    knowsAbout: [
      'Intelligence artificielle',
      'Architecture logicielle',
      'Leadership technique',
      'Grands modèles de langage',
      'TypeScript',
      'PostgreSQL',
      'Observabilité',
    ],
    sameAs: [SITE.author.github, SITE.author.linkedin],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.locale,
    publisher: { '@id': `${SITE.url}/#person` },
  };
}

export function blogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE.url}/blog#blog`,
    url: `${SITE.url}/blog`,
    name: `${SITE.name} — Écrits`,
    description: 'Notes et essais sur la tech, le business et l\'IA.',
    inLanguage: SITE.locale,
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
}

export function blogPostingSchema(p: BlogPostingInput) {
  const url = `${SITE.url}/blog/${p.slug}`;
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
    inLanguage: SITE.locale,
    articleSection: p.category,
    keywords: p.keywords.join(', '),
    wordCount: p.wordCount,
    timeRequired: p.readingTime ? `PT${p.readingTime}M` : undefined,
    image: p.image ? `${SITE.url}${p.image}` : `${SITE.url}${SITE.ogImage}`,
    author: { '@id': `${SITE.url}/#person` },
    publisher: { '@id': `${SITE.url}/#person` },
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
