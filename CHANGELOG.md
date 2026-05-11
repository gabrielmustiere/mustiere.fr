# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et ce projet adhère au
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-11

### Added

- Système de séries d'articles : bannière en tête, navigation prev/next entre épisodes, nouvelle collection `series` (FR + EN) avec frontmatter dédié.
- Série « Live Components Symfony » publiée en 5 épisodes (inventaire UX, socle Twig Components, cycle live, tests/profiling/sécurité, arbitrage
  Twig/Stimulus/Live).
- Lien RSS ajouté au compteur d'articles sur l'archive blog.

### Changed

- Collections content séparées physiquement par langue (`blog/fr/`, `blog/en/`, `projects/fr/`, etc.) — simplifie le filtrage et la déduplication.
- Ligatures désactivées dans les blocs de code pour éviter les rendus ambigus (`!=`, `->`, `=>`).

### Removed

- Barre méta auteur/partage en pied d'article (redondante avec les infos en tête).

## [0.5.0] - 2026-05-05

### Changed

- Résolution des traductions FR/EN unifiée via `findTranslation` (`utils/content.ts`) : couvre les deux sens de la relation `translationOf` et exclut les drafts
  en production. `ArticleLayout` et `ProjectLayout` n'inlinent plus `getCollection` / `isPublished`.
- Frontmatter de l'article Symfony EN : `translationOf` ajouté pour refléter le lien vers la version FR.

## [0.4.0] - 2026-05-05

### Added

- Covers de projets optimisées via `image()` + `<Picture>` Astro (AVIF/WebP, srcset, sizes responsive, view-transition partagée), avec `coverAlt` requis dans le
  schéma `projects`.

### Changed

- Schéma `projects.cover` : passe de `string` à `image()` — covers résolues au build avec hash et optimisation.
- Typo : élargissement des colonnes de prose (`--w-prose` 720→780, `--w-blog` 820→920, `--w-home` 720→840), `text-wrap: pretty` sur la prose et `balance` sur
  les titres pour des coupures de lignes plus propres.
- Articles Symfony 2026 (FR + EN) : traits d'union insécables (`‑`) dans les mots composés (back‑office, e‑commerce, real‑time, front‑end, AI‑first…) pour
  éviter les coupures disgracieuses.

### Fixed

- Covers restaurées sur les articles « Comment j'ai construit ce site avec Claude et Astro » (FR + EN).

## [0.3.1] - 2026-05-05

### Added

- Article « PHP & Symfony en 2026 : pourquoi un CTO devrait sérieusement le considérer » publié (FR + EN).

### Changed

- Slug EN renommé en `php-symfony-2026-cto-perspective` pour intégrer Symfony et l'angle éditorial « perspective CTO ».
- Migration des trois dossiers `docs/story/` legacy vers le format `NNN-<type>-<slug>/` (compteur en tête).

## [0.3.0] - 2026-05-04

### Added

- URLs de prévisualisation pour les articles `draft: true` en build prod : chaque brouillon est généré sous `/blog/_drafts/<hash>/<slug>/` (hash dérivé du
  slug + d'une seed hardcodée), absent des sitemap/RSS/llms.txt/listings, avec `noindex,nofollow`. CLI `npm run draft:url <slug>` pour récupérer l'URL prod d'un
  draft.
- Transitions de page animées via `astro:transitions` (`ClientRouter` + `transition:name` sur titres et covers) pour une navigation fluide entre les pages.
- Champs `publishedAt` et `updatedAt` dans les schémas des collections `blog` et `projects` ; affichage des dates de publication et de mise à jour dans les
  layouts.
- Commande `npm run dev:expose` (et cible `make dev:expose`) pour exposer le dev server sur le réseau local.

### Changed

- Article « PHP en 2026 : pourquoi un CTO devrait sérieusement le considérer » (FR + EN) : chapitres retravaillés (langage, Symfony, outillage, FrankenPHP,
  front-mobile, IA), FAQ enrichie, résumé étoffé, conclusion ajoutée, cohérence stylistique entre les deux langues.
- Niveau de titre configurable (`headingLevel`) dans `ArticleCard` et `BlogArchive` pour préserver la hiérarchie sémantique des `h*` selon le contexte
  d'inclusion.
- Terminologie EN harmonisée (« Résumé » → « Resume ») dans les chaînes UI.

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

Première version publique du site mustiere.fr déployé en SSG sur Github Pages.

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

[Unreleased]: https://github.com/gabrielmustiere/mustiere.fr/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gabrielmustiere/mustiere.fr/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gabrielmustiere/mustiere.fr/releases/tag/v0.1.0
