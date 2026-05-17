import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import { SITE } from './src/consts.ts';
import { validateTranslationKeyCardinality } from './src/content-loaders/translation-cardinality.mjs';

const LOCALE_TAGS = { fr: 'fr-FR', en: 'en-GB' };
const TRANSLATED_COLLECTIONS = ['blog', 'projects'];
// Collections dont le contenu est physiquement séparé par langue
// (`<collection>/fr/<slug>/`, `<collection>/en/<slug>/`). Aligné sur l'option
// `nestedByLang` du loader chapteredGlob (cf. content.config.ts).
const NESTED_BY_LANG_COLLECTIONS = new Set(['blog', 'projects']);
// Segments d'URL localisés pour les collections (FR vs EN). Aligné sur
// `src/i18n/routes.ts > ROUTES`. Dupliqué ici parce qu'astro.config.mjs ne peut
// pas importer le module TS au moment du chargement de la config.
const COLLECTION_SEGMENTS = {
  blog: { fr: 'blog', en: 'blog' },
  projects: { fr: 'projets', en: 'projects' },
};
// Préfixe d'ordre éditeur sur les dossiers d'entrée (cf.
// src/content-loaders/order-prefix.ts). Dupliqué ici parce qu'astro.config.mjs
// ne peut pas importer le module TS au chargement de la config. Si tu modifies
// la regex là-bas, propage ici (et inversement).
const ORDER_PREFIX_RE = /^\d{1,3}-/;

function readEntryMetadata(filePath, dirPath) {
  const raw = readFileSync(filePath, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!fm) return null;
  const lang = fm.match(/^lang:\s*["']?([a-z-]+)["']?\s*$/m)?.[1];
  const translationOf = fm
    .match(/^translationOf:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1]
    ?.trim();
  // Refacto 010 : `slug` et `translationKey` lus en plus de `translationOf`
  // pour permettre le découplage progressif. Tant qu'une entrée porte au
  // moins `translationOf` OU `translationKey`, elle est considérée comme
  // i18n-pairable. `slug` reste optionnel (fallback nom de dossier).
  const slug = fm
    .match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1]
    ?.trim();
  const translationKey = fm
    .match(/^translationKey:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1]
    ?.trim();
  const draft = /^draft:\s*true\s*$/m.test(fm);
  if (draft) return null;
  if (!lang) return null;
  if (!translationOf && !translationKey) return null;
  const hasFaq = dirPath ? existsSync(join(dirPath, 'faq.mdx')) : false;
  const hasSources = dirPath ? existsSync(join(dirPath, 'sources.mdx')) : false;
  return { lang, translationOf, translationKey, slug, hasFaq, hasSources };
}

function collectFromDir(baseDir, collection, entries) {
  let dirEntries;
  try {
    dirEntries = readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of dirEntries) {
    let slug;
    let dirPath = null;
    let filePath;
    if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      slug = entry.name.replace(/\.(md|mdx)$/, '');
      filePath = join(baseDir, entry.name);
    } else if (entry.isDirectory()) {
      const indexFile = ['index.mdx', 'index.md'].find((f) =>
        existsSync(join(baseDir, entry.name, f))
      );
      if (!indexFile) continue;
      // Strip du préfixe d'ordre éditeur pour aligner la clef sur le slug
      // public (et donc sur ce que référence `translationOf`). Le `dirPath`
      // reste préfixé pour lire le disque.
      slug = entry.name.replace(ORDER_PREFIX_RE, '');
      dirPath = join(baseDir, entry.name);
      filePath = join(dirPath, indexFile);
    } else {
      continue;
    }
    const meta = readEntryMetadata(filePath, dirPath);
    if (!meta) continue;
    // Refacto 010 : le slug public peut être déclaré dans le frontmatter
    // (`slug:`) ; sinon fallback sur le nom de dossier sans préfixe `NNN-`.
    // La clef d'entrée est construite sur le slug public final pour rester
    // alignée sur l'URL canonique et sur `translationOf` (qui référence un
    // slug public). À l'étape 10 le fallback disparaîtra.
    const publicSlug = meta.slug ?? slug;
    entries.set(`${collection}/${meta.lang}/${publicSlug}`, {
      ...meta,
      dirPath,
      collection,
      slug: publicSlug,
    });
  }
}

function buildTranslationIndex() {
  const root = fileURLToPath(new URL('./src/content/', import.meta.url));
  const entries = new Map();

  for (const collection of TRANSLATED_COLLECTIONS) {
    const collectionDir = join(root, collection);
    if (NESTED_BY_LANG_COLLECTIONS.has(collection)) {
      for (const lang of ['fr', 'en']) {
        collectFromDir(join(collectionDir, lang), collection, entries);
      }
    } else {
      collectFromDir(collectionDir, collection, entries);
    }
  }
  // Refacto 010 : index secondaire par `translationKey` pour pair-matching
  // O(1). Clef = `${collection}/${lang}/${translationKey}`.
  const byKey = new Map();
  for (const [key, meta] of entries) {
    if (meta.translationKey) {
      byKey.set(
        `${meta.collection}/${meta.lang}/${meta.translationKey}`,
        key
      );
    }
  }
  // Refacto 010 étape 9 : invariant strict — chaque translationKey doit être
  // porté par 0 ou 2 entrées de la même collection (une par lang). Validation
  // collection par collection (les keys ne sont pas partagées cross-collection).
  for (const collection of TRANSLATED_COLLECTIONS) {
    const collectionEntries = Array.from(entries).filter(
      ([, m]) => m.collection === collection
    );
    validateTranslationKeyCardinality(collectionEntries);
  }

  // Validation parité i18n des sections SEO (faq.mdx / sources.mdx).
  // Asymétrie = build fail avec les deux chemins de fichiers concernés.
  const checked = new Set();
  for (const [key, meta] of entries) {
    if (checked.has(key)) continue;
    const otherLang = meta.lang === 'fr' ? 'en' : 'fr';
    // Cascade refacto 010 : essaie `translationKey` d'abord (le futur), puis
    // `translationOf` (le legacy, encore en place pendant la migration). À
    // l'étape 10, seule la branche key restera.
    let other;
    if (meta.translationKey) {
      const otherKey = byKey.get(
        `${meta.collection}/${otherLang}/${meta.translationKey}`
      );
      if (otherKey) other = entries.get(otherKey);
    }
    if (!other && meta.translationOf) {
      // `translationOf` peut référencer soit le slug pur (cas nestedByLang :
      // `translationOf: 'symfony-template'`), soit l'id complet hérité de la
      // forme plate (`symfony-template-en`). On essaie le slug pur puis le
      // brut.
      const candidates = [
        `${meta.collection}/${otherLang}/${meta.translationOf}`,
        `${meta.collection}/${otherLang}/${meta.translationOf.replace(/^(fr|en)\//, '')}`,
      ];
      for (const k of candidates) {
        other = entries.get(k);
        if (other) break;
      }
    }
    if (!other) continue;
    checked.add(key);
    for (const section of ['Faq', 'Sources']) {
      const a = meta[`has${section}`];
      const b = other[`has${section}`];
      if (a !== b) {
        const fileName = section.toLowerCase() + '.mdx';
        const present = a ? meta : other;
        const missing = a ? other : meta;
        throw new Error(
          `[i18n] Asymétrie ${fileName} entre paires i18n : ` +
            `"${present.dirPath}/${fileName}" existe mais pas "${missing.dirPath}/${fileName}". ` +
            `Les sections SEO doivent être présentes dans les deux langues ou aucune.`
        );
      }
    }
  }
  return { entries, byKey };
}

const { entries: TRANSLATIONS, byKey: TRANSLATIONS_BY_KEY } =
  buildTranslationIndex();

// Avec prefixDefaultLocale: false, le FR n'a pas de préfixe (/blog/slug/),
// l'EN garde son préfixe (/en/blog/slug/). Le segment de collection peut être
// localisé (ex. `projets` en FR, `projects` en EN) ; cf. COLLECTION_SEGMENTS.
function buildLocalizedUrl(origin, lang, collection, slug) {
  const segment = COLLECTION_SEGMENTS[collection]?.[lang] ?? collection;
  return lang === 'fr'
    ? `${origin}/${segment}/${slug}/`
    : `${origin}/${lang}/${segment}/${slug}/`;
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

// Inverse-lookup : depuis un segment d'URL (`projets` ou `projects` selon la
// lang), retrouve le nom de la collection logique (`projects`).
function collectionFromSegment(segment, lang) {
  for (const [collection, segments] of Object.entries(COLLECTION_SEGMENTS)) {
    if (segments[lang] === segment) return collection;
  }
  return TRANSLATED_COLLECTIONS.includes(segment) ? segment : null;
}

function findTranslationLinks(itemUrl) {
  const url = new URL(itemUrl);
  const staticMatch = findStaticPageLinks(url.pathname, url.origin);
  if (staticMatch) return staticMatch;
  const parts = url.pathname.split('/').filter(Boolean);
  let lang, segment, slug;
  if (parts.length === 3 && parts[0] === 'en') {
    [, segment, slug] = parts;
    lang = 'en';
  } else if (parts.length === 2) {
    [segment, slug] = parts;
    lang = 'fr';
  } else {
    return null;
  }
  const collection = collectionFromSegment(segment, lang);
  if (!collection) return null;
  const meta = TRANSLATIONS.get(`${collection}/${lang}/${slug}`);
  if (!meta) return null;
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  // Cascade refacto 010 : essaie d'abord translationKey (futur), puis
  // translationOf (legacy). À l'étape 10 seul le premier chemin restera.
  let otherMeta;
  if (meta.translationKey) {
    const otherKey = TRANSLATIONS_BY_KEY.get(
      `${collection}/${otherLang}/${meta.translationKey}`
    );
    if (otherKey) otherMeta = TRANSLATIONS.get(otherKey);
  }
  if (!otherMeta && meta.translationOf) {
    const otherSlug = meta.translationOf.replace(/^(fr|en)\//, '');
    otherMeta = TRANSLATIONS.get(`${collection}/${otherLang}/${otherSlug}`);
  }
  if (!otherMeta) return null;
  const otherUrl = buildLocalizedUrl(
    url.origin,
    otherLang,
    collection,
    otherMeta.slug
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
    '/fr/projects/[...slug]': '/projets/[...slug]',
    '/fr/rss.xml': '/rss.xml',
    '/fr/llms.txt': '/llms.txt',
    '/fr/llms-full.txt': '/llms-full.txt',
    // Migration du segment FR `/projects/` vers `/projets/` (localisation SEO,
    // cf. plan d'avril 2026). Astro génère des HTML statiques avec meta-refresh
    // 0s + canonical, équivalents à un 301 pour Google. Cible tous les slugs
    // (publiés et drafts) avec un wildcard.
    '/projects/[...slug]': '/projets/[...slug]',
    // Migration EN : suppression du suffixe `-en` désormais redondant avec le
    // préfixe de langue `/en/`. Une entrée par slug existant (un seul projet
    // publié au moment de la bascule).
    '/en/projects/symfony-template-en/': '/en/projects/symfony-template/',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt') &&
        !page.includes('/_drafts/'),
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
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/404',
            '/blog/_drafts/',
            '/en/blog/_drafts/',
            '/projets/_drafts/',
            '/en/projects/_drafts/',
          ],
        },
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
