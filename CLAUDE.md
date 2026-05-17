# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev       # dev server (http://localhost:4321)
npm run build     # SSG → dist/
npm run preview   # preview du build
npm run check     # astro check (TS + diagnostics content collections)
npm run test      # node --test tests/**/*.test.mjs (loaders content)
npm run lint      # eslint .
npm run lint:fix  # eslint . --fix
npm run format    # prettier --write .
```

`make serve` lance dev sur `http://mustiere.wip:4321` (ajoute l'entrée /etc/hosts via sudo).

Tests unitaires Node natifs (`node --test`) ciblant les loaders / parseurs de content collections (`tests/seo-sections.test.mjs`). La CI ajoute `astro check`,
Lighthouse CI (`lighthouserc.json`) et pa11y-ci (`.pa11yci.json`). Pour reproduire localement : `npm run build && npx lhci autorun` ou `npx pa11y-ci`.

## Architecture

**Astro 6 SSG bilingue** (FR/EN) déployé statiquement sur Github Pages. Aucune île JS framework — quelques scripts inline (~1 KB gzip total) pour scroll-spy,
progress bar, filtres blog. Tailwind CSS 4 via `@tailwindcss/postcss` (configuré dans `postcss.config.mjs`) ; tous les tokens design (couleurs oklch, typo,
spacing) vivent dans `src/styles/global.css` sous `@theme`.

### i18n — ce qui rend ce projet non-trivial

- `defaultLocale: 'fr'`, `prefixDefaultLocale: false` → FR servi sans préfixe (`/`, `/blog/`), EN préfixé (`/en/`, `/en/blog/`).
- Pages EN dupliquées sous `src/pages/en/` ; chaque entrée de collection porte `lang` + `slug` (URL canonique, source de vérité) + `translationKey` partagé
  avec son pendant FR/EN pour former la paire (refacto 010). Le slug est totalement découplé du nom de dossier — un dossier peut être renommé, préfixé `NNN-`
  ou déplacé sans toucher aux URLs publiques. `translationKey` doit avoir une cardinalité stricte 0 (orphelin) ou 2 (paire FR/EN).
- `astro.config.mjs` lit ces frontmatters au build (`buildTranslationIndex`) pour injecter les liens `hreflang` dans le sitemap via `serialize`. Les paires de
  **pages statiques** traduites (sans collection, ex. `/parcours/` ↔ `/en/background/`) sont déclarées en dur dans `STATIC_PAGE_PAIRS`.
- Helpers dans `src/i18n/utils.ts` : `getLangFromUrl`, `localizedPath`, `swapLang`, `formatDate`. Les chaînes UI vivent dans `src/i18n/ui.ts`. Toujours router
  via ces helpers — ne pas concaténer les préfixes à la main.
- Anciennes URLs `/fr/*` redirigées vers la racine via `redirects` dans `astro.config.mjs` (préservation SEO).

### Content Collections (`src/content.config.ts`)

- **`blog`** (`*.mdx`) — schéma Zod strict : `excerpt` 80–220, `number` requis, `category ∈ {IA, Tech, Lead, Business}`, `cover` requis (ou hérité via
  `translationKey` depuis la paire FR/EN), `slug` **requis** (kebab-case), `translationKey` optionnel (kebab-case, cardinalité stricte 0 ou 2). Sections SEO
  injectées par le loader (cf. `seo-sections.ts`) : `resume.mdx` **obligatoire** (≥ 60 chars plain text, lu par les LLMs et affiché en tête d'article),
  `faq.mdx` optionnel (`questions: [{q, r}]` en YAML), `sources.mdx` optionnel (citations).
- **`projects`** (`*.md`) — `status`, `kind`, `order` pour le tri ; mêmes sections SEO (`resume.mdx` obligatoire, `faq.mdx` / `sources.mdx` optionnels).
- Le build **échoue** si un frontmatter ne valide pas. C'est intentionnel : ne pas relâcher le schéma pour faire passer un article, corriger l'article.
- **Loader** : `chapteredGlob` (`src/content-loaders/chaptered-glob.ts`) — remplace `glob`. Supporte deux formes pour chaque entrée :
  - **Forme plate** : `<slug>.{md,mdx}` à la racine du dossier de collection. C'est la forme historique, encore valide.
  - **Forme dossier** (recommandée pour les articles longs) : `<slug>/index.{md,mdx}` avec frontmatter, accompagné de chapitres `NN-<kebab>.{md,mdx}` (préfixe à
    2 chiffres + tiret + kebab-case) et des sections SEO réservées (`resume.mdx`, `faq.mdx`, `sources.mdx`). Le `body` agrégé = `index.body` puis chapitres
    triés alphabétiquement, joints par `\n\n`. Les URLs publiques restent identiques (l'`id` de l'entrée = nom du dossier).
- Règles **strictes** dans la forme dossier : un seul `index.{md,mdx}` autorisé ; les chapitres sont sans frontmatter et sans `import`/`export` au top-level
  (l'agrégateur lèvera une erreur build sinon, cf. plan 004-r option ii) ; les noms `resume.mdx` / `faq.mdx` / `sources.mdx` sont réservés (cf.
  `RESERVED_SECTION_FILES`) ; pas d'autre `.md`/`.mdx` non conforme dans le dossier.
- **Préfixe d'ordre éditeur** (optionnel) : un dossier d'entrée peut être préfixé `NNN-` (1–3 chiffres + tiret, ex. `001-symfony-avant-ux-inventaire/`) pour le
  trier visuellement dans l'arborescence. Depuis le refacto 010, le slug public vient de `data.slug` (pas du nom de dossier), donc renommer/préfixer un
  dossier ne change strictement rien aux URLs ni aux hreflang. Le préfixe vit uniquement sur disque, indépendamment du champ `number` du frontmatter (qui
  pilote l'ordre éditorial réel). Une collision sur le slug final (deux entrées d'une même langue avec le même `slug:`) fait planter le build avec la liste
  des fichiers fautifs.

### Vérifier la non-régression d'un chapitre

Quand on édite un chapitre et qu'on veut s'assurer que le rendu publié n'a pas bougé (hors le chapitre touché évidemment) :

```bash
node scripts/snapshot-build.mjs before              # snapshot AVANT modif
# ... éditer le(s) chapitre(s) ...
node scripts/snapshot-build.mjs after               # snapshot APRÈS modif
node scripts/diff-snapshot.mjs before after         # diff byte-à-byte
```

Le diff masque uniquement le `<lastmod>` du sitemap. Tout autre changement attendu doit être visible et compréhensible. Les snapshots sont sous `tmp/`
(gitignored). Le double build (prod sans drafts + `SHOW_DRAFTS=1`) couvre aussi les articles draft.

### Pages dynamiques

- `src/pages/blog/[...slug].astro` + `src/pages/en/blog/[...slug].astro` filtrent la collection par `lang` dans `getStaticPaths`. Idem pour `projects/`. Le
  filtrage publication/draft passe par `isPublished(entry, lang)` (`src/utils/content.ts`) — toute nouvelle page consommant `blog`/`projects` doit utiliser ce
  helper plutôt que d'inliner `!data.draft && data.lang === ...`.
- `src/pages/llms.txt.ts` et `llms-full.txt.ts` génèrent au build l'index + le corpus markdown complet (standard Jeremy Howard) — versions FR et EN sous `/en/`.
- `rss.xml.ts` : 20 derniers posts, par langue.

### Layouts

`BaseLayout` (html/head, fonts self-hostées, JSON-LD via `components/seo/StructuredData.astro`) ← `SiteLayout` (sidebar + nav) ← `ArticleLayout` /
`ProjectLayout` (prose, ReadingProgress, RelatedItems). Les composants `src/components/pages/*.astro` (`HomePage`, `BlogArchive`, `ParcoursPage`,
`NotFoundPage`) sont rendus depuis les paires d'`index.astro` FR (`src/pages/`) et EN (`src/pages/en/`) pour partager la composition entre les deux langues.

### Routes nommées (`src/i18n/routes.ts`)

Les chemins divergents entre FR et EN passent par `routePath(name, lang)` — ex. `parcours` (`/parcours` FR ↔ `/background` EN). Ne jamais hard-coder
`/background` ou `/parcours` côté composant : combiner `routePath()` et `localizedPath()` pour éviter la dérive d'URLs.

### SEO

JSON-LD émis par `src/utils/schema.ts` selon le type de page (`Person`, `WebSite`, `Blog`, `BlogPosting` + `BreadcrumbList`). Sitemap auto avec `hreflang`.
`robots.txt` autorise explicitement les crawlers IA majeurs et bloque `Bytespider`. Toute modification de meta passe d'abord par `src/consts.ts` (`SITE`).

## Conventions

- TypeScript strict ; alias configurés dans `tsconfig.json` : `@/*` → `src/*`, `@components/*` → `src/components/*`, `@layouts/*` → `src/layouts/*`, `@styles/*`
  → `src/styles/*`. Utiliser ces alias plutôt que des chemins relatifs.
- Prettier : single quotes, semi, trailing commas es5 ; plugin `prettier-plugin-astro` actif.
- Ne pas porter le panneau "Tweaks" des maquettes `designs/*.html` — outil interne uniquement.
- Couleurs accents : utiliser les classes utilitaires `.acc-about|blog|projects|contact|cv` ou `var(--a-*)`, jamais hex en dur.
- Liens internes inter-langues : passer par `localizedPath(lang, path)` ou `swapLang`.

## Références

- `DEVELOPMENT.md` — guide pratique (ajout d'article, déploiement Github, budgets perf).
- `README.md` — brief design original (tokens, échelles typo, scroll-spy, comportements).
- `designs/*.html` — source de vérité visuelle haute-fidélité.
