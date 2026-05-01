# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et ce projet adhère au
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-04-30

### Added

- Cover image obligatoire pour les articles de blog (ratio 16:9), affichée dans le header de l'article, les cartes de l'archive `/blog/` et le bloc « articles
  liés ». Vignettes `og:image` / `twitter:image` et JSON-LD `BlogPosting.image` dérivées au build avec ratio source préservé.
- Traduction EN de l'article « PHP en 2026 : pourquoi un CTO devrait sérieusement le considérer » (encore en brouillon).
- FAQ ajoutée à l'article « Comment j'ai construit ce site avec Claude et Astro » (FR + EN).
- Loader `chaptered-glob` étendu pour copier les assets co-localisés (`.png` / `.webp` / ...) à côté du fichier matérialisé — permet `cover: ./cover.png` dans
  le frontmatter.

### Changed

- I18n unifiée : gestion centralisée des traductions, helpers de routage cohérents, meilleure maintenabilité.
- Cover des side-projects déplacée de la grille `ProjectsSection` (home) vers le header de la page projet — la home retrouve une liste texte-only cohérente avec
  le rendu blog.
- Article PHP 2026 (FR brouillon) retravaillé : chapitres resserrés (historique, langage, Symfony, outillage), nouveaux chapitres `FrankenPHP` / `front-mobile`
  / `IA` dans la version EN.
- Prose harmonisée : couleur de corps `#2a2622`, `font-size 16px`, `line-height 1.7`, et grille typographique complète sur les tables (`.prose table`).

### Removed

- Champ `ogImage` du schéma de la collection `blog` (absorbé par le champ `cover` obligatoire). Le `SITE.ogImage` global subsiste comme fallback site-wide pour
  les pages non-article.

## [0.1.0] - 2026-04-29

Première version publique du site mustiere.fr déployé en SSG sur Cloudflare Pages.

### Added

- Site Astro 6 SSG bilingue FR/EN avec toggle de langue, hreflang, redirections de compatibilité depuis les anciennes URLs `/fr/*`.
- Page d'accueil avec sections About, Blog, Projects, Contact, CV.
- Page « Parcours » détaillée (FR) / « Background » (EN) avec FAQ intégrée, expériences et expertises.
- Section blog avec scroll-spy, barre de progression de lecture, partage social, articles liés.
- Section projets (side projects) avec cards, statut, type, année.
- Sections SEO standardisées par convention de fichiers MDX réservés (`resume.mdx` obligatoire, `faq.mdx` et `sources.mdx` optionnels) avec validation parité
  i18n stricte.
- JSON-LD complet : `Person`, `Organization`, `WebSite`, `Blog`, `BlogPosting`, `SoftwareSourceCode`, `BreadcrumbList`, `FAQPage`, `ProfilePage`, `AboutPage`.
- `llms.txt` et `llms-full.txt` (FR + EN) selon le standard Jeremy Howard pour les crawlers IA.
- `robots.txt` autorisant explicitement les crawlers IA majeurs (GPTBot, ClaudeBot, PerplexityBot, etc.) et bloquant Bytespider.
- Sitemap auto avec liens hreflang entre paires de traductions.
- Loader custom `chaptered-glob` permettant de découper un long article en chapitres `NN-slug.mdx` agrégés au build.
- Outillage de snapshot de build (`scripts/snapshot-build.mjs` + `diff-snapshot.mjs`) pour vérifier la non-régression byte-à-byte.
- Articles publiés : « Comment j'ai construit ce site avec Claude et Astro » (FR + EN), « PHP en 2026 : pourquoi un CTO devrait sérieusement le considérer »
  (FR, brouillon).
- Side-projects publiés : « Symfony Template » (FR + EN).
- CI Lighthouse + pa11y, déploiement automatique.

### Changed

- Migration vers Astro 6 et la Content Layer API.
- URLs unifiées avec trailing slash systématique.
- Navigation unifiée avec menu mobile.

[Unreleased]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gabrielmustiere/mustiere.fr/releases/tag/v0.1.0
