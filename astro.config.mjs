import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import { SITE } from '@/consts.ts';

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

function findTranslationLinks(itemUrl) {
  const url = new URL(itemUrl);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 3) return null;
  const [lang, collection, slug] = parts;
  if (!TRANSLATED_COLLECTIONS.includes(collection)) return null;
  const meta = TRANSLATIONS.get(`${collection}/${slug}`);
  if (!meta || meta.lang !== lang) return null;
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const otherMeta = TRANSLATIONS.get(`${collection}/${meta.translationOf}`);
  if (!otherMeta || otherMeta.lang !== otherLang) return null;
  const otherUrl = `${url.origin}/${otherLang}/${collection}/${meta.translationOf}/`;
  return [
    { url: itemUrl, lang: LOCALE_TAGS[lang] },
    { url: otherUrl, lang: LOCALE_TAGS[otherLang] },
  ];
}

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
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
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  redirects: {
    '/': '/fr/',
    '/blog/': '/fr/blog/',
    '/blog/[...slug]': '/fr/blog/[...slug]',
    '/projects/[...slug]': '/fr/projects/[...slug]',
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
