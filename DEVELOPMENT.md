# mustiere.fr — guide technique

Site Astro statique déployé sur Cloudflare Pages. Portfolio éditorial + blog de Gabriel Mustière.

## Stack

- [Astro 6](https://astro.build) · output `static`
- [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite`
- [MDX](https://mdxjs.com) · [Shiki](https://shiki.style) (syntax highlight build-time)
- `@fontsource` — Instrument Serif, Inter, JetBrains Mono (self-hosted)
- `@astrojs/sitemap`, `@astrojs/rss`, `astro-robots-txt`
- TypeScript strict

## Commandes

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # astro check (types)
npm run build      # SSG vers dist/
npm run preview    # preview local du build
npm run format     # prettier
```

## Arborescence

```
src/
├── components/
│   ├── layout/    Sidebar, TopNav, Footer, SkipLink
│   ├── ui/        SectionHead, CategoryPill, ReadingProgress, ShareButton
│   ├── seo/       StructuredData
│   └── home/      AboutSection, BlogSection, ProjectsSection, ContactSection, CvSection
├── content/
│   ├── config.ts  schémas Zod
│   ├── blog/      articles (.mdx)
│   └── projects/  side projects (.md)
├── layouts/       BaseLayout, ArticleLayout
├── pages/         index, blog/, rss.xml, llms.txt, llms-full.txt, 404
├── styles/        global.css (tokens @theme + prose + utilities)
├── utils/         format-date, reading-time, schema (JSON-LD)
├── consts.ts      metadata centralisées du site
```

## Ajouter un article

Créer un fichier dans `src/content/blog/mon-slug.mdx` avec le frontmatter :

```yaml
---
title: 'Titre (≤120 chars)'
excerpt: 'Chapô de 80–220 caractères, réutilisé comme meta description.'
publishedAt: 2026-04-23
category: IA # IA | Tech | Lead | Business
tags: [LLM, production]
keywords: [mot-clé intent SEO]
number: 8
tldr: "Résumé 60–320 caractères (lu en tête d'article, utile pour LLMs)."
---
# Titre au besoin

Contenu Markdown/MDX.
```

Le schéma Zod impose la cohérence — le build échoue sur un champ invalide.

## Ajouter un projet

`src/content/projects/mon-projet.md` :

```yaml
---
title: 'Nom'
subtitle: 'Tagline'
status: 'actif' # actif | archivé | v1.x | beta
kind: 'OSS' # ou Side project, Expériment
year: 2026
excerpt: 'Une ligne.'
order: 4
---
Description optionnelle.
```

## SEO — ce qui est couvert

- Meta `<title>`, `<meta description>`, canonical absolu, OG complet, Twitter card
- JSON-LD par page : `Person`, `WebSite` (home), `Blog` + `BreadcrumbList` (blog), `BlogPosting` + `BreadcrumbList` + `Person` (article)
- Sitemap `/sitemap-index.xml` auto
- RSS `/rss.xml` (20 derniers posts)
- robots.txt avec policy explicite par crawler
- Favicon SVG + apple-touch-icon PNG
- `<html lang="fr-FR">`, `<time datetime>` sur toutes les dates
- Skip link, focus visible, `prefers-reduced-motion`, `aria-current` dynamique

## Référencement IA

- **`/llms.txt`** (standard Jeremy Howard) — index markdown du site pour LLMs. Généré au build depuis les Content Collections.
- **`/llms-full.txt`** — corpus complet des articles en markdown, concaténé.
- **`/robots.txt`** autorise explicitement `GPTBot`, `ClaudeBot`, `anthropic-ai`, `Claude-Web`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `cohere-ai`. Bloque `Bytespider`.
- **TL;DR en tête d'article** — chaque post affiche un résumé 60–320 caractères structuré pour citation par LLM.
- **Sémantique HTML pro-LLM** — `<article>`, `<section>`, `<time>`, `<dl>` pour les données factuelles.

## Performance — budgets

| Metric        | Objectif |
| ------------- | -------- |
| LCP (mobile)  | < 1.5 s  |
| CLS           | < 0.05   |
| INP           | < 100 ms |
| JS total gzip | < 10 KB  |

État actuel : JS page-level ≈ 1 KB gzip (scroll-spy + progress bar + filtre blog + share), polices self-hostées, CSS critique inline, compression Brotli via Cloudflare.

## Déploiement (Cloudflare Pages)

1. Pousser le repo sur GitHub (public ou privé).
2. Cloudflare dashboard → Pages → **Connect to Git** → sélectionner le repo.
3. Build config :
   - Framework preset : **Astro**
   - Build command : `npm run build`
   - Build output : `dist`
   - Node version : `22` (variable `NODE_VERSION=22`)
4. Après premier déploiement : configurer DNS (`mustiere.fr` → Cloudflare).
5. Search Console + Bing Webmaster : soumettre `https://mustiere.fr/sitemap-index.xml`.

Preview deploys automatiques sur chaque PR.

## Qualité — CI GitHub Actions

Trois jobs dans [.github/workflows/ci.yml](.github/workflows/ci.yml) :

1. **check** — `astro check` (TS) + `astro build`
2. **lighthouse** — Lighthouse CI mobile, seuils : perf ≥ 95, a11y = 100, SEO = 100, BP ≥ 95 ([lighthouserc.json](lighthouserc.json))
3. **a11y** — pa11y-ci WCAG 2 AA sur les pages clés ([.pa11yci.json](.pa11yci.json))

## Références design

- [README.md](README.md) — brief de design original
- [designs/](designs/) — 3 maquettes HTML haute-fidélité (source de vérité visuelle)
