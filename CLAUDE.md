# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev       # dev server (http://localhost:4321)
npm run build     # SSG → dist/
npm run preview   # preview du build
npm run check     # astro check (TS + diagnostics content collections)
npm run lint      # eslint .
npm run lint:fix  # eslint . --fix
npm run format    # prettier --write .
```

`make serve` lance dev sur `http://mustiere.wip:4321` (ajoute l'entrée /etc/hosts via sudo).

Aucun runner de tests : la CI repose sur `astro check` + Lighthouse CI (`lighthouserc.json`) + pa11y-ci (`.pa11yci.json`). Pour reproduire localement : `npm run build && npx lhci autorun` ou `npx pa11y-ci`.

## Architecture

**Astro 6 SSG bilingue** (FR/EN) déployé statiquement sur Cloudflare Pages. Aucune île JS framework — quelques scripts inline (~1 KB gzip total) pour scroll-spy, progress bar, filtres blog. Tailwind CSS 4 via `@tailwindcss/postcss` (configuré dans `postcss.config.mjs`) ; tous les tokens design (couleurs oklch, typo, spacing) vivent dans `src/styles/global.css` sous `@theme`.

### i18n — ce qui rend ce projet non-trivial

- `defaultLocale: 'fr'`, `prefixDefaultLocale: false` → FR servi sans préfixe (`/`, `/blog/`), EN préfixé (`/en/`, `/en/blog/`).
- Pages EN dupliquées sous `src/pages/en/` ; chaque entrée de collection traduite porte `lang` + `translationOf` (slug du pendant FR) dans son frontmatter.
- `astro.config.mjs` lit ces frontmatters au build (`buildTranslationIndex`) pour injecter les liens `hreflang` dans le sitemap via `serialize`. Les paires de **pages statiques** traduites (sans collection, ex. `/parcours/` ↔ `/en/background/`) sont déclarées en dur dans `STATIC_PAGE_PAIRS`.
- Helpers dans `src/i18n/utils.ts` : `getLangFromUrl`, `localizedPath`, `swapLang`, `formatDate`. Les chaînes UI vivent dans `src/i18n/ui.ts`. Toujours router via ces helpers — ne pas concaténer les préfixes à la main.
- Anciennes URLs `/fr/*` redirigées vers la racine via `redirects` dans `astro.config.mjs` (préservation SEO).

### Content Collections (`src/content.config.ts`)

- **`blog`** (`*.mdx`) — schéma Zod strict : `tldr` 60–320 chars (lu par les LLMs), `excerpt` 80–220, `number` requis, `category ∈ {IA, Tech, Lead, Business}`, `lang` + `translationOf` optionnels.
- **`projects`** (`*.md`) — `status`, `kind`, `order` pour le tri.
- Le build **échoue** si un frontmatter ne valide pas. C'est intentionnel : ne pas relâcher le schéma pour faire passer un article, corriger l'article.

### Pages dynamiques

- `src/pages/blog/[...slug].astro` + `src/pages/en/blog/[...slug].astro` filtrent la collection par `lang` dans `getStaticPaths`. Idem pour `projects/`.
- `src/pages/llms.txt.ts` et `llms-full.txt.ts` génèrent au build l'index + le corpus markdown complet (standard Jeremy Howard) — versions FR et EN sous `/en/`.
- `rss.xml.ts` : 20 derniers posts, par langue.

### Layouts

`BaseLayout` (html/head, fonts self-hostées, JSON-LD via `components/seo/StructuredData.astro`) ← `SiteLayout` (sidebar + nav) ← `ArticleLayout` / `ProjectLayout` (prose, ReadingProgress, RelatedItems). Le composant `pages/HomePage.astro` est rendu depuis les deux `index.astro` (FR et EN) pour partager la composition.

### SEO

JSON-LD émis par `src/utils/schema.ts` selon le type de page (`Person`, `WebSite`, `Blog`, `BlogPosting` + `BreadcrumbList`). Sitemap auto avec `hreflang`. `robots.txt` autorise explicitement les crawlers IA majeurs et bloque `Bytespider`. Toute modification de meta passe d'abord par `src/consts.ts` (`SITE`).

## Conventions

- TypeScript strict ; alias configurés dans `tsconfig.json` : `@/*` → `src/*`, `@components/*` → `src/components/*`, `@layouts/*` → `src/layouts/*`, `@styles/*` → `src/styles/*`. Utiliser ces alias plutôt que des chemins relatifs.
- Prettier : single quotes, semi, trailing commas es5 ; plugin `prettier-plugin-astro` actif.
- Ne pas porter le panneau "Tweaks" des maquettes `designs/*.html` — outil interne uniquement.
- Couleurs accents : utiliser les classes utilitaires `.acc-about|blog|projects|contact|cv` ou `var(--a-*)`, jamais hex en dur.
- Liens internes inter-langues : passer par `localizedPath(lang, path)` ou `swapLang`.

## Références

- `DEVELOPMENT.md` — guide pratique (ajout d'article, déploiement Cloudflare, budgets perf).
- `README.md` — brief design original (tokens, échelles typo, scroll-spy, comportements).
- `designs/*.html` — source de vérité visuelle haute-fidélité.
