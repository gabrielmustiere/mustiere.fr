# Stack technique — mustiere.fr

> Dernière mise à jour : 2026-05-31 — cartographie factuelle de la stack. Chaque entrée est prouvée par un fichier du dépôt (source entre parenthèses) ou marquée _non renseigné_.

## Vue d'ensemble

Site personnel **bilingue FR/EN** (CTO freelance) construit en **Astro 6 en mode SSG pur** : aucune base de données, aucun runtime serveur, aucune île JS framework — uniquement du HTML/CSS statique généré au build et quelques scripts inline. Déployé sur **GitHub Pages** derrière le domaine custom `mustiere.fr`. Contenu géré via Content Collections (blog MDX, projets MD) avec un loader maison « chaptered ».

| Couche     | Techno principale                           |
| ---------- | ------------------------------------------- |
| Langage(s) | TypeScript 5.7, JavaScript (ESM)            |
| Backend    | _aucun_ — SSG, pas de runtime serveur       |
| Frontend   | Astro 6 (SSG) + Tailwind CSS 4              |
| Données    | _aucune_ — contenu en fichiers MDX/MD       |
| Ops        | GitHub Pages (domaine custom `mustiere.fr`) |
| DevOps     | GitHub Actions (build + deploy uniquement)  |

## Langages & runtimes

- **TypeScript** `^5.7` (strict) — source : `package.json` (devDeps), `tsconfig.json`
- **JavaScript / ESM** — source : `package.json` (`"type": "module"`), scripts `.mjs` sous `scripts/` et `tests/`
- **Node** `22` côté CI/build — source : `.github/workflows/deploy.yml` (`setup-node node-version: 22`, env `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`). Aucune version Node épinglée localement (pas de `.nvmrc`, pas de `engines`).

## Frontend / génération de site

- **Méta-framework** : **Astro** `^6.1.9` en mode **SSG** (`output` statique, `build.format: 'directory'`) — source : `package.json`, `astro.config.mjs`
- **Intégrations Astro** (source : `package.json` + `astro.config.mjs`) :
  - `@astrojs/mdx` `^5.0.4` — articles en MDX
  - `@astrojs/sitemap` `^3.7.2` — sitemap avec `hreflang` injectés via `serialize` custom (paires de traduction FR/EN)
  - `@astrojs/rss` `^4.0.18` — flux RSS par langue
  - `astro-robots-txt` `^1.0.0` — `robots.txt` (autorise crawlers IA, bloque `Bytespider`)
- **i18n** : i18n natif Astro, `defaultLocale: 'fr'`, `locales: ['fr', 'en']`, `prefixDefaultLocale: false` (FR sans préfixe, EN sous `/en/`) — source : `astro.config.mjs`. Redirections SEO des anciennes URLs `/fr/*` et `/projects/*` → `/projets/*` déclarées dans `redirects`.
- **CSS** : **Tailwind CSS** `^4` via `@tailwindcss/postcss` — source : `package.json`, `postcss.config.mjs`. Tokens design (oklch, typo, spacing) dans `src/styles/global.css` sous `@theme` (cf. `CLAUDE.md`).
- **Fonts** : self-hostées via Fontsource — Inter, Instrument Serif, JetBrains Mono (`@fontsource/*` `^5.1.0`) — source : `package.json`
- **Coloration syntaxique** : Shiki `^1.24.0`, thème `github-light` — source : `package.json`, `astro.config.mjs` (`markdown.shikiConfig`)
- **Traitement d'images** : Sharp `^0.33.5` — source : `package.json`
- **TypeScript** : oui, strict — source : `tsconfig.json`
- **JS embarqué** : aucune île framework ; quelques scripts inline (~1 KB gzip : scroll-spy, progress bar, filtres blog) — source : `CLAUDE.md`

## Contenu (Content Collections)

- **Collections** : `blog` (`*.mdx`) et `projects` (`*.md`), schémas Zod stricts — source : `src/content.config.ts` (référencé par `CLAUDE.md`)
- **Loader maison** : `chapteredGlob` (`src/content-loaders/chaptered-glob.ts`) — remplace le `glob` Astro, supporte forme plate et forme dossier (chapitres `NN-<kebab>.{md,mdx}` + sections SEO réservées `resume.mdx`/`faq.mdx`/`sources.mdx`)
- **Parsing** : `marked` `^18.0.2` (markdown) + `yaml` `^2.8.3` (frontmatter de sections SEO) — source : `package.json` (devDeps)
- **Génération LLM-friendly** : `llms.txt` / `llms-full.txt` au build (FR + EN) — source : `CLAUDE.md`, `src/pages/llms*.txt.ts`

## Données & stockage

- **Aucune** : pas de SGBD, cache, broker, recherche ni stockage objet. Aucun `docker-compose`, aucun `.env`, aucune DSN dans le dépôt. Le contenu vit en fichiers MDX/MD versionnés.

## Ops / Infrastructure

- **Hébergement de production** : **GitHub Pages** — source : `.github/workflows/deploy.yml` (`upload-pages-artifact` + `deploy-pages`)
- **Domaine** : `mustiere.fr` (custom domain GitHub Pages) — source : `public/CNAME`, `src/consts.ts` (`SITE.url`)
- **CDN / reverse proxy** : aucun proxy dédié — le domaine pointe directement sur GitHub Pages (CDN Fastly intégré de GH Pages) — source : déclaratif utilisateur (2026-05-31)
- **Conteneurisation** : _aucune_ (pas de `Dockerfile` ni `docker-compose`)
- **IaC** : _aucune_
- **Gestion des secrets** : _aucune_ — déploiement via les permissions OIDC GitHub Pages (`id-token: write`), pas de secret applicatif (`.github/workflows/deploy.yml`)
- **Environnements** : prod uniquement (le site statique). Dev local via `astro dev` ; pas de staging — source : `Makefile`, `package.json`

## DevOps / CI-CD

- **Pipeline CI** : **GitHub Actions**, workflow unique `deploy.yml` — déclencheurs `release: published` + `workflow_dispatch` — jobs : checkout, `npm ci`, `npm run build`, upload + deploy GitHub Pages. **Pas de job de validation** (ni `check`, ni `lint`, ni `test`, ni Lighthouse, ni pa11y) — source : `.github/workflows/deploy.yml`
- **Tests** : Node test runner natif (`node --test` avec `--experimental-strip-types`) ciblant les loaders / parseurs de content collections — 6 fichiers sous `tests/` (`chaptered-glob`, `content-slug`, `content-translation`, `draft-isolation`, `seo-sections`, `series`) — source : `package.json` (`scripts.test`), `tests/`
- **Vérif de types** : `astro check` via `@astrojs/check` `^0.9.8` — source : `package.json`
- **Lint / style** : ESLint `^10` (`eslint.config.js`, plugins `eslint-plugin-astro` + `typescript-eslint`) ; Prettier `^3.4` + `prettier-plugin-astro` `^0.14` — source : `package.json`, `eslint.config.js`
- **Audits qualité (locaux)** : Lighthouse CI (`lighthouserc.json` — perf ≥ 0.95, accessibilité = 1.0, SEO = 1.0, best-practices ≥ 0.95) et pa11y-ci WCAG2AA (`.pa11yci.json`). ⚠️ Ces audits sont configurés mais **exécutés en local uniquement** (`npx lhci autorun`, `npx pa11y-ci`), ils ne tournent dans **aucun** workflow CI — source : `lighthouserc.json`, `.pa11yci.json`, déclaratif utilisateur (2026-05-31)
- **Scripts maison** : `snapshot-build.mjs` + `diff-snapshot.mjs` (non-régression byte-à-byte d'un build, cf. `CLAUDE.md`), `draft-url.mjs` (URL d'un draft) — source : `scripts/`
- **Hooks git / automatisation deps** : _aucun_ (pas de `.husky/`, `.pre-commit-config.yaml`, `renovate.json` ni `dependabot.yml`)
- **Déploiement** : publication d'une **release GitHub** (ou déclenchement manuel) → build SSG → push de l'artefact sur GitHub Pages — source : `.github/workflows/deploy.yml`

## Monitoring / observabilité

- **Erreurs** : _aucun_ (déclaratif utilisateur, 2026-05-31)
- **Métriques / traces** : _aucun_
- **Analytics** : _aucun_
- **Logs** : _non renseigné_ (logs de build GitHub Actions uniquement ; pas de logging applicatif sur un site statique)

## Outillage de développement local

- **Commandes npm** (source : `package.json`) : `dev` (astro dev :4321), `build` (SSG → `dist/`), `preview`, `check`, `test`, `lint` / `lint:fix`, `format`
- **Makefile** (source : `Makefile`) : `make serve` lance dev sur `http://mustiere.wip:4321` via `portless` (ajoute l'entrée `/etc/hosts` en sudo) ; `make expose` (bind `0.0.0.0` pour ngrok/LAN) ; `make wrap-md` (hard-wrap des `.md`/`.mdx` à 160 colonnes) ; `make clean`
- **Services de dev** : aucun (pas de conteneur ni service externe à lancer)

## Contraintes & dette de stack connues

- **Désynchro doc ⇄ CI** : le `CLAUDE.md` affirme « La CI ajoute `astro check`, Lighthouse CI et pa11y-ci », mais aucun workflow ne les exécute — la garantie qualité repose entièrement sur une discipline locale. Risque : une régression perf/a11y/SEO ou une erreur de type peut passer en prod sans garde-fou automatisé. (Choix assumé en l'état au 2026-05-31 ; piste : ajouter un workflow CI de validation sur PR.)
- **Node non épinglé localement** : la CI fixe Node 22 mais rien ne contraint la version en dev (pas de `.nvmrc`/`engines`) — risque de dérive entre poste de dev et build CI.
- **Astro 6 / Tailwind 4** : versions majeures récentes, surface d'évolution rapide — surveiller les breaking changes au bump.

## Changelog

- 2026-05-31 — Création — inventaire initial
