import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import { SITE } from './src/consts.ts';

const LOCALE_TAGS = { fr: 'fr-FR', en: 'en-GB' };
const TRANSLATED_COLLECTIONS = ['blog', 'projects'];

function buildTranslationIndex() {
  const root = fileURLToPath(new URL('./src/content/', import.meta.url));
  const entries = new Map();

  for (const collection of TRANSLATED_COLLECTIONS) {
    let files;
    try {
      files = readdirSync(join(root, collection));
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      const slug = file.replace(/\.(md|mdx)$/, '');
      const raw = readFileSync(join(root, collection, file), 'utf8');
      const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1];
      if (!fm) continue;
      const lang = fm.match(/^lang:\s*["']?([a-z-]+)["']?\s*$/m)?.[1];
      const translationOf = fm
        .match(/^translationOf:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1]
        ?.trim();
      if (!lang || !translationOf) continue;
      entries.set(`${collection}/${slug}`, { lang, translationOf });
    }
  }
  return entries;
}

const TRANSLATIONS = buildTranslationIndex();

// Avec prefixDefaultLocale: false, le FR n'a pas de préfixe (/blog/slug/),
// l'EN garde son préfixe (/en/blog/slug/).
function buildLocalizedUrl(origin, lang, collection, slug) {
  return lang === 'fr'
    ? `${origin}/${collection}/${slug}/`
    : `${origin}/${lang}/${collection}/${slug}/`;
}

// Pages statiques traduites (pages racine sans collection — ex. /parcours,
// /en/background). Les paires sont déclarées explicitement pour générer les
// hreflang dans le sitemap.
const STATIC_PAGE_PAIRS = [['/parcours/', '/en/background/']];

function findStaticPageLinks(pathname, origin) {
  for (const [fr, en] of STATIC_PAGE_PAIRS) {
    if (pathname === fr || pathname === en) {
      return [
        { url: `${origin}${fr}`, lang: LOCALE_TAGS.fr },
        { url: `${origin}${en}`, lang: LOCALE_TAGS.en },
      ];
    }
  }
  return null;
}

function findTranslationLinks(itemUrl) {
  const url = new URL(itemUrl);
  const staticMatch = findStaticPageLinks(url.pathname, url.origin);
  if (staticMatch) return staticMatch;
  const parts = url.pathname.split('/').filter(Boolean);
  let lang, collection, slug;
  if (parts.length === 3 && parts[0] === 'en') {
    [, collection, slug] = parts;
    lang = 'en';
  } else if (parts.length === 2) {
    [collection, slug] = parts;
    lang = 'fr';
  } else {
    return null;
  }
  if (!TRANSLATED_COLLECTIONS.includes(collection)) return null;
  const meta = TRANSLATIONS.get(`${collection}/${slug}`);
  if (!meta || meta.lang !== lang) return null;
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const otherMeta = TRANSLATIONS.get(`${collection}/${meta.translationOf}`);
  if (!otherMeta || otherMeta.lang !== otherLang) return null;
  const otherUrl = buildLocalizedUrl(
    url.origin,
    otherLang,
    collection,
    meta.translationOf
  );
  return [
    { url: itemUrl, lang: LOCALE_TAGS[lang] },
    { url: otherUrl, lang: LOCALE_TAGS[otherLang] },
  ];
}

export default defineConfig({
  site: SITE.url,
  // trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    // Compat avec les anciennes URLs préfixées /fr/* (avant suppression du
    // prefixDefaultLocale). On préserve l'indexation Google et les liens
    // externes existants en redirigeant vers les nouvelles URLs racine.
    '/fr/': '/',
    '/fr/blog/': '/blog/',
    '/fr/blog/[...slug]': '/blog/[...slug]',
    '/fr/parcours/': '/parcours/',
    '/fr/projects/[...slug]': '/projects/[...slug]',
    '/fr/rss.xml': '/rss.xml',
    '/fr/llms.txt': '/llms.txt',
    '/fr/llms-full.txt': '/llms-full.txt',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt'),
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-GB',
        },
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        if (item.links?.length) return item;
        const links = findTranslationLinks(item.url);
        if (links) item.links = links;
        return item;
      },
    }),
    robotsTxt({
      sitemap: [`${SITE.url}/sitemap-index.xml`],
      policy: [
        { userAgent: 'GPTBot', allow: '/' },
        { userAgent: 'ClaudeBot', allow: '/' },
        { userAgent: 'anthropic-ai', allow: '/' },
        { userAgent: 'Claude-Web', allow: '/' },
        { userAgent: 'PerplexityBot', allow: '/' },
        { userAgent: 'Perplexity-User', allow: '/' },
        { userAgent: 'Google-Extended', allow: '/' },
        { userAgent: 'Applebot-Extended', allow: '/' },
        { userAgent: 'CCBot', allow: '/' },
        { userAgent: 'cohere-ai', allow: '/' },
        { userAgent: 'Bytespider', disallow: '/' },
        { userAgent: '*', allow: '/', disallow: ['/404'] },
      ],
    }),
  ],
  markdown: {
    shikiConfig: {
      // github-light sur fond blanc pur (#ffffff) satisfait WCAG AA sur tous les
      // tokens (≥ 4.5:1) ; le fond des blocs de code est donc désaturé dans global.css.
      theme: 'github-light',
      wrap: false,
    },
  },
});
