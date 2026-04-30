# Refacto — Éradiquer les conditions `lang === '…'` des pages, layouts et composants

> Date : 2026-04-30
> Stack : Astro 6 SSG bilingue (FR/EN)

## Motivation

`src/components/pages/ParcoursPage.astro` fait 1 106 lignes pour 62 ternaires `lang === 'fr' ? … : …`, dont une dizaine encadrent du JSX riche (paragraphes avec
`<em>`, `<strong>`, `<span class="hl acc-about">`, listes). Le contenu textuel et le markup structurel sont entrelacés ; modifier une section devient
risqué (oubli de l'autre branche, divergence FR/EN), et toute évolution structurelle de la page se fait dans une soupe bilingue.

Au-delà de Parcours, le pattern est éparpillé : 103 occurrences au total réparties sur 14 fichiers (pages, layouts, sections home, composants nav, schémas
JSON-LD, helpers Intl).

Si demain on ajoute une 3ᵉ ou 5ᵉ langue, chaque ternaire devient une chaîne `lang === 'fr' ? … : lang === 'en' ? … : lang === 'es' ? …`. Les pages doublent de
taille, l'écart entre branches s'aggrave, et la moindre régression devient invisible. Le projet a déjà un `useTranslations(lang)` propre (utilisé par
`BlogArchive`, `NotFoundPage`) et un `LANG_META` typé — la dette se résorbe en **généralisant ce qui marche déjà**, pas en inventant un nouveau mécanisme.

**Objectif** : aucun fichier sous `src/components/`, `src/layouts/`, `src/pages/` ne contient `lang === '…'`. Toute logique par langue est confinée à
`src/i18n/**`. Ajouter une langue future = ajouter des clés dans des dictionnaires, sans toucher au markup des pages.

## Périmètre

### Code visé

103 occurrences `lang === '…'` réparties en 14 fichiers, classées en 7 familles :

| Famille | Description                                                               | Occurrences | Fichiers                                                              |
| ------- | ------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| F1      | Inversion FR/EN (`lang === 'fr' ? 'en' : 'fr'`)                           | 6           | BaseLayout, ArticleLayout, ProjectLayout, ParcoursPage, i18n/utils.ts |
| F2      | Slug traduit (`'/parcours' ↔ '/background'`)                              | 8           | ParcoursPage, HomePage, MobileNav, Sidebar, schema.ts                 |
| F3      | Locale BCP-47 (`'fr-FR' ↔ 'en-GB'`)                                       | 2           | i18n/utils.ts                                                         |
| F4      | Head metadata (rssHref, altUrl, ogLocale)                                 | 3           | BaseLayout                                                            |
| F5      | Labels courts ad hoc                                                      | ~50         | tous                                                                  |
| F6      | JSX riche bilingue (paragraphes, listes, balises de mise en valeur)       | ~15         | ParcoursPage (≈10), HomePage (2), BlogArchive (3)                     |
| F7      | Listes structurées (expériences, expertises, modes, FAQ, dl localisation) | ~15         | ParcoursPage                                                          |

### Inventaire détaillé par fichier

- `src/components/pages/ParcoursPage.astro` — 62 (toutes familles) — gros morceau.
- `src/components/pages/BlogArchive.astro` — 8 (F2, F5, F6).
- `src/components/pages/HomePage.astro` — 6 (F2, F5, F6).
- `src/layouts/ProjectLayout.astro` — 6 (F1, F5).
- `src/layouts/ArticleLayout.astro` — 6 (F1, F5).
- `src/layouts/BaseLayout.astro` — 4 (F1, F4).
- `src/i18n/utils.ts` — 3 (F1, F3) — _autorisé en cible mais à factoriser via `LANG_META`_.
- `src/utils/schema.ts` — 2 (F2, F5).
- `src/components/ui/AuthorCard.astro` — 1 (F5).
- `src/components/layout/SkipLink.astro` — 1 (F5).
- `src/components/layout/Sidebar.astro` — 1 (F2).
- `src/components/layout/MobileNav.astro` — 1 (F2).
- `src/components/home/CvSection.astro` — 1 (F5).
- `src/components/home/BlogSection.astro` — 1 (F5).

### Clients identifiés

Les pages d'entrée qui rendent ces composants :

- `src/pages/index.astro` + `src/pages/en/index.astro` → `HomePage`.
- `src/pages/parcours.astro` + `src/pages/en/background.astro` → `ParcoursPage`.
- `src/pages/blog/index.astro` + `src/pages/en/blog/index.astro` → `BlogArchive`.
- `src/pages/blog/[...slug].astro` + `src/pages/en/blog/[...slug].astro` → `ArticleLayout`.
- `src/pages/projects/[...slug].astro` + `src/pages/en/projects/[...slug].astro` → `ProjectLayout`.
- `src/pages/404.astro` + `src/pages/en/404.astro` → `NotFoundPage` (déjà propre).
- `src/pages/llms.txt.ts`, `llms-full.txt.ts`, `rss.xml.ts` (FR + EN) — ne devraient pas changer.

### Hors scope

- Migration vers Content Collections MDX pour le contenu narratif de Parcours (option D évaluée puis écartée — refacto plus profond, à traiter séparément si
  besoin un jour).
- Internationalisation effective d'une 3ᵉ langue (le critère "0 if dans pages" prouve la robustesse, mais l'ajout réel d'`es`/`de` est hors scope).
- Refonte de `src/i18n/utils.ts` au-delà des 3 ternaires F1/F3 (ses signatures publiques restent intactes).
- Ajout d'un lint custom anti-`lang === '`. Mentionné comme idée d'épilogue ; pas indispensable, et peut être fait en story séparée.

## Cible

### Forme attendue après refacto

- **Aucun `lang === '…'`** dans `src/components/`, `src/layouts/`, `src/pages/`. Vérification :
  `grep -RE "lang === '" src/components src/layouts src/pages` retourne 0 ligne.
- Toute logique par langue confinée à `src/i18n/**` :
  - `src/i18n/config.ts` (existant) — `LANGUAGES`, `DEFAULT_LANG`, `LANG_META`.
  - `src/i18n/utils.ts` (existant, simplifié) — helpers `localizedPath`, `swapLang`, `formatDate*`, `getLangFromUrl`. Les ternaires internes basculent sur
    `LANG_META[lang].bcp47` et `otherLang(lang)`.
  - `src/i18n/ui.ts` (existant, étendu) — dictionnaire de chaînes courtes (~50 nouvelles clés).
  - `src/i18n/routes.ts` (**nouveau**) — registre des slugs traduits + helper `routePath`.
  - `src/i18n/content/parcours.ts` (**nouveau**) — données structurées de la page Parcours typées (expériences, expertises, modes, localisation, FAQ).
  - `src/components/i18n/parcours/<bloc>/{fr,en}.astro` (**nouveau**) — un fichier par langue par bloc narratif riche (F6). Dispatch par dictionnaire dans la
    page consommatrice.
- `useTranslations(lang)` reste l'API de référence pour les chaînes courtes.
- Les listes (expériences, FAQ, modes) sont rendues par `.map(...)` sur les données issues de `src/i18n/content/parcours.ts`.

### Pattern de refacto

- **F1 + F3** : remplacer les ternaires inline par les helpers / constantes déjà en place (`otherLang(lang)`, `LANG_META[lang].bcp47`, `LANG_META[otherLang(lang)].ogLocale`).
- **F2** : registre `ROUTES` typé + `routePath(name, lang)`. À 5 langues, on ajoute la clé dans chaque entrée du registre.

  ```ts
  // src/i18n/routes.ts
  export const ROUTES = {
    parcours: { fr: '/parcours', en: '/background' },
    blog:     { fr: '/blog',     en: '/blog' },
    rssFeed:  { fr: '/rss.xml',  en: '/en/rss.xml' },
    // …
  } as const satisfies Record<string, Record<Lang, string>>;
  export function routePath(name: keyof typeof ROUTES, lang: Lang): string { … }
  ```

- **F4** : encapsuler le calcul head metadata (rssHref, altUrl, ogLocale, hreflang) dans un helper unique consommé par `BaseLayout`. Le ternaire devient un map
  `LANG_META[lang]` ou un appel à `routePath('rssFeed', lang)`.
- **F5** : étendre `src/i18n/ui.ts` avec namespaces `parcours.*`, `breadcrumb.*`, `skipLink.*`, `meta.*`, `article.*` (déjà partiel), `project.*` (déjà partiel),
  `blogIndex.*` (déjà partiel). Toutes les chaînes courtes passent par `tr.namespace.key`. TS strict détectera toute clé manquante à la compile.
- **F6** : un fichier `.astro` par langue par bloc narratif, sous `src/components/i18n/parcours/<bloc>/{fr,en}.astro`. La page consommatrice dispatche via un
  map :

  ```astro
  ---
  import HeroFR from '@components/i18n/parcours/hero/fr.astro';
  import HeroEN from '@components/i18n/parcours/hero/en.astro';
  const HERO = { fr: HeroFR, en: HeroEN } satisfies Record<Lang, unknown>;
  const Hero = HERO[lang];
  ---

  <Hero />
  ```

  À 5 langues : 5 fichiers `<bloc>/{fr,en,es,de,it}.astro` + 5 entrées dans la map. **Aucun `if`.** Markup riche écrit en JSX Astro natif, pas de `set:html`,
  pas de fragments stockés en TS.

- **F7** : `src/i18n/content/parcours.ts` exporte `parcoursContent: Record<Lang, ParcoursContent>` typé. La page itère :

  ```astro
  {
    parcoursContent[lang].experiences.map((xp) => (
      <li>
        <div>{xp.period}</div>
        <h3>{xp.title}</h3>
        <ul>
          {xp.bullets.map((b) => (
            <li>{b}</li>
          ))}
        </ul>
      </li>
    ))
  }
  ```

  Ajouter une langue = ajouter une entrée dans le `Record`. Le markup ne bouge pas.

### Alternatives écartées

| Alternative                                                      | Pourquoi écartée                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| (A) Tout extraire dans `ui.ts` avec `set:html`                   | Perd la sécurité TS sur le JSX, ouvre la porte à l'XSS si un jour on pousse du contenu user dans le dictionnaire, fait gonfler `ui.ts` au-delà du raisonnable.                                                     |
| (B) Une `ParcoursPage.<lang>.astro` par langue                   | Duplique le markup structurel — toute évolution UI à faire N fois. Empire avec 5 langues.                                                                                                                          |
| (D) Migration en Content Collection MDX                          | Refacto plus profond (change le modèle de stockage), couplé à un schéma Zod à concevoir. Possible plus tard ; pas pour ce refacto.                                                                                 |
| F6 inline `if` dans un fichier dédié                             | Plus court à écrire mais ne respecte pas le critère "0 if dans pages/composants". Le critère est précisément ce qu'on cherche à prouver.                                                                           |
| F6 dispatch via `Record<Lang, FactoryFn>` dans un fichier unique | Demande de typer la factory comme `AstroComponentFactory`, friction TS, et le markup doit être écrit en TS plutôt qu'en `.astro`. La variante "un `.astro` par langue" est plus naturelle dans l'écosystème Astro. |

## Comportement externe à préserver

Liste explicite de ce qui ne doit PAS bouger après le refacto :

- **HTML rendu, pour chaque page FR et EN** : structure DOM, attributs, classes Tailwind, ordre des éléments, contenu textuel y compris ponctuation, espaces
  non-sécables et caractères spéciaux (`{' '}` JSX préservés là où ils sont).
- **URLs internes** : `localizedPath`, `swapLang` retournent les mêmes chaînes ; tous les `href` rendus sont byte-identiques.
- **JSON-LD inline** (`Person`, `WebSite`, `Blog`, `BlogPosting`, `BreadcrumbList`, `FAQPage`) : sérialisation identique (clés, valeurs, ordre).
- **Sitemap.xml** : entrées et hreflang inchangés (hors `<lastmod>` masqué par le diff snapshot).
- **rss.xml** (FR + EN) : items, métadonnées identiques.
- **llms.txt + llms-full.txt** (FR + EN) : corpus identique.
- **Meta head** : `<title>`, `<meta description>`, `<link rel="canonical">`, `<link rel="alternate" hreflang>`, `<meta property="og:locale">`, `<meta property="og:locale:alternate">`, RSS feed link.
- **A11y** : `aria-label`, `lang` sur `<html>`, ordre des `<h1>`–`<h3>`, `<nav>` landmarks, focus visible (couvert par pa11y-ci).
- **Perf** : budgets Lighthouse inchangés (CSS / JS / image).
- **Routing** : aucune URL nouvelle, aucune URL retirée, aucune redirection touchée.

## Stratégie de caractérisation

### Tests existants utilisés comme filet

| Test / outil                                                    | Ce qu'il couvre                                                | Niveau     |
| --------------------------------------------------------------- | -------------------------------------------------------------- | ---------- |
| `npm run check` (astro check)                                   | Validation TS + content collections                            | type-check |
| `npm run lint` (eslint)                                         | Conventions JS/TS                                              | static     |
| `npm run format` (prettier)                                     | Formatage                                                      | static     |
| `node scripts/snapshot-build.mjs <label>` + `diff-snapshot.mjs` | **HTML rendu byte-identique entre deux builds** (prod + draft) | E2E SSG    |
| `npx lhci autorun` (lighthouserc.json)                          | Budgets perf                                                   | E2E perf   |
| `npx pa11y-ci` (.pa11yci.json)                                  | A11y                                                           | E2E a11y   |

### Tests de caractérisation à écrire AVANT le refacto

**Aucun test unitaire ou d'intégration à écrire.** Le seul comportement observable d'un site SSG, c'est le HTML produit. Le `snapshot-build.mjs` du projet
le verrouille à 100 %, c'est le filet de référence.

**Pré-requis bloquant** : confirmer que le snapshot est **reproductible** (deux builds successifs avec le même code → diff vide). C'est l'objet de l'étape 0
ci-dessous. Si une source de non-déterminisme est découverte (timestamps, ordres d'objets, IDs aléatoires), elle doit être isolée et corrigée avant tout
refacto.

**Règle absolue** : aucun code de production touché tant que le snapshot baseline n'est pas reproductible et que `tmp/before/` n'est pas committé en local
comme référence.

## Stratégie d'exécution incrémentale

Chaque étape est commitable et déployable seule. Après chaque étape, snapshot intermédiaire : `node scripts/snapshot-build.mjs after-stepN` puis
`diff-snapshot.mjs before after-stepN` doit être vide. Si une étape casse, on s'arrête sur cette étape.

### Étape 0 — Vérifier la reproductibilité du snapshot

- [ ] **Objectif** : prouver que `snapshot-build.mjs` est byte-déterministe sur le code actuel.
- [ ] **Actions** :
  - `node scripts/snapshot-build.mjs before` (premier baseline).
  - `node scripts/snapshot-build.mjs before-bis` (deuxième build, code inchangé).
  - `node scripts/diff-snapshot.mjs before before-bis` → doit retourner vide.
- [ ] **Si non vide** : identifier la source de non-déterminisme (date dans rss.xml, ordre `Object.keys`, etc.) et l'isoler. Le corriger avant de continuer.
- [ ] **Vérification** : diff vide ; `before/` conservé sous `tmp/` comme baseline pour toute la suite du refacto.

### Étape 1 — Outillage et dictionnaires (zéro consommateur touché)

- [ ] **Objectif** : poser tous les nouveaux artefacts d'i18n sans encore les brancher.
- [ ] **Fichiers créés** :
  - `src/i18n/routes.ts` : registre `ROUTES` + helper `routePath(name, lang)`.
  - `src/i18n/content/parcours.ts` : type `ParcoursContent` + `parcoursContent: Record<Lang, ParcoursContent>` reprenant à l'identique les données actuelles
    de `ParcoursPage.astro`.
- [ ] **Fichiers étendus** :
  - `src/i18n/ui.ts` : namespaces `parcours.*`, `breadcrumb.*`, `skipLink.*`, `meta.*`, complétion de `article.*` / `project.*` / `blogIndex.*`. Toutes les
    chaînes courtes des familles F5 sont ajoutées en miroir FR + EN.
- [ ] **Vérification** : `npm run check` 0/0/0, `npm run lint`, snapshot `after-step1` = `before` (rien n'est branché, donc rien ne change).

### Étape 2 — Quick wins F1, F3, F4 et F5 simples

- [ ] **Objectif** : appliquer les helpers déjà disponibles aux fichiers à 1-4 ternaires triviaux.
- [ ] **Fichiers touchés** :
  - `src/i18n/utils.ts` : `formatDate`, `formatDateShort` → `LANG_META[lang].bcp47`. `otherLang` reste tel quel (un seul ternaire dans `i18n/**`, autorisé).
  - `src/components/layout/SkipLink.astro` : `tr.skipLink.label`.
  - `src/components/ui/AuthorCard.astro` : `tr.author.role` (ou clé équivalente).
  - `src/components/layout/MobileNav.astro` + `Sidebar.astro` : `routePath('parcours', lang)`.
  - `src/components/home/BlogSection.astro` + `CvSection.astro` : `tr.home.*` étendu.
  - `src/utils/schema.ts` : `tr.author.role` + `routePath('parcours', lang)`.
  - `src/layouts/BaseLayout.astro` : `otherLang(lang)`, `LANG_META[otherLang(lang)].ogLocale`, `routePath('rssFeed', lang)`. Encapsuler dans une variable
    `head` locale ou un helper `pageHead(lang, …)` selon la lisibilité obtenue.
- [ ] **Vérification** : `grep "lang === '" src/components/layout src/components/home src/components/ui src/utils src/i18n/utils.ts` ne montre que `otherLang`
      et le minimum dans `i18n/**`. Snapshot `after-step2` = `before`.

### Étape 3 — Layouts ArticleLayout et ProjectLayout

- [ ] **Objectif** : zéro `lang === '…'` dans les layouts.
- [ ] **Fichiers touchés** :
  - `src/layouts/ArticleLayout.astro` : `otherLang(lang)`, `tr.breadcrumb.home`, `tr.article.tocTitle`, `tr.article.upNextTitle`, `tr.article.endLabel`,
    `tr.breadcrumb.ariaLabel`.
  - `src/layouts/ProjectLayout.astro` : `otherLang(lang)`, `tr.breadcrumb.home`, `tr.project.tocTitle`, `tr.project.endLabel`, `tr.breadcrumb.ariaLabel`,
    `tr.project.viewOnGitHub`.
- [ ] **Vérification** : `grep "lang === '" src/layouts/` retourne 0. Snapshot `after-step3` = `before`.

### Étape 4 — HomePage et sections home

- [ ] **Objectif** : zéro `lang === '…'` dans `HomePage.astro` et ses sections.
- [ ] **Fichiers touchés** :
  - **Création** `src/components/i18n/home/hero/{fr,en}.astro` (h1 + paragraphe intro avec `<em>`, `<strong>`, `<span class="hl">`).
  - `src/components/pages/HomePage.astro` : import + dispatch map `HERO[lang]`. Petits labels via `tr.home.*` étendu. `routePath('parcours', lang)`.
- [ ] **Vérification** : `grep "lang === '" src/components/pages/HomePage.astro` retourne 0. Snapshot `after-step4` = `before`.

### Étape 5 — BlogArchive

- [ ] **Objectif** : zéro `lang === '…'` dans `BlogArchive.astro`.
- [ ] **Fichiers touchés** :
  - **Création** `src/components/i18n/blog-archive/intro/{fr,en}.astro` (paragraphe intro riche).
  - `src/components/pages/BlogArchive.astro` : dispatch map intro + `tr.blogIndex.*` (titre, breadcrumb, "À la une", "Archive").
- [ ] **Vérification** : `grep "lang === '" src/components/pages/BlogArchive.astro` retourne 0. Snapshot `after-step5` = `before`.

### Étape 6 — ParcoursPage : données structurées (F7)

- [ ] **Objectif** : la page n'a plus que des ternaires F6 (markup riche) — toutes les listes (expériences, expertises liste, modes, localisation, FAQ)
      passent par `parcoursContent[lang]`.
- [ ] **Fichiers touchés** :
  - `src/i18n/content/parcours.ts` : compléter le typage et les données (déjà créé en étape 1, alimenté ici si pas déjà fait).
  - `src/components/pages/ParcoursPage.astro` : remplacer les blocs `<li>… (lang === 'fr' ? <FR/> : <EN/>) …</li>` par des `.map(...)` sur les arrays de
    `parcoursContent[lang]`. Petits labels (titres de section, "§ 01", "§ 02"…, dates, métiers, "Voir le parcours détaillé", etc.) via `tr.parcours.*`.
  - Le bloc localisation (`dl` avec `Basé à` / `Remote` / `On-site` / `Disponibilité` / `Email` / `LinkedIn`) devient une boucle sur un array de tuples
    typés.
- [ ] **Reste après cette étape** : ~10 ternaires F6 dans `ParcoursPage.astro` (paragraphes narratifs des expériences + introduction expertise "Product
      builder").
- [ ] **Vérification** : `grep -c "lang === '" src/components/pages/ParcoursPage.astro` ≤ 12. Snapshot `after-step6` = `before`.

### Étape 7 — ParcoursPage : blocs narratifs (F6) + finalisation

- [ ] **Objectif** : `grep "lang === '" src/components src/layouts src/pages` retourne **0 ligne**. La règle d'or est tenue.
- [ ] **Fichiers créés** sous `src/components/i18n/parcours/` :
  - `hero/{fr,en}.astro` — titre H1 + paragraphe intro + ligne CTA (Me contacter / CV / Retour à l'accueil).
  - `experience-passion-barbecue/{fr,en}.astro` — paragraphe + bulleted list logistique / recherche / industrialisation.
  - `experience-progicar/{fr,en}.astro` — paragraphe + bulleted list stratégie / stack / 0→n / direction.
  - `experience-xl-soft/{fr,en}.astro` — paragraphe + bulleted list NF 525 / Analytics / Vente accompagnée / thèse.
  - `expertise-symfony/{fr,en}.astro` — paragraphe `<em>`/`<strong>`.
  - `expertise-sylius/{fr,en}.astro` — paragraphe `<em>`/`<strong>`.
  - `expertise-product-builder/{fr,en}.astro` — 2 paragraphes + bulleted list "concrètement utile pour".
- [ ] **Fichiers touchés** :
  - `src/components/pages/ParcoursPage.astro` : dispatch maps `HERO[lang]`, `EXPERIENCE_BODIES[id][lang]`, `EXPERTISE_BODIES[id][lang]`. Le markup
    structurel devient une coquille : `<header><Hero /></header>` + `experiencesData.map(xp => <li>… <ExperienceBody id={xp.id} lang={lang} /> …</li>)`.
  - Si `Anytime` (Lead WebAuthn & PSD2) reste assez court pour passer en données structurées (`parcoursContent[lang].experiences[0].bullets`), pas de bloc
    narratif dédié.
- [ ] **Vérification finale** :
  - `grep -RE "lang === '" src/components src/layouts src/pages` → 0 ligne.
  - `npm run check`, `npm run lint`, `npm run format -- --check`.
  - `node scripts/snapshot-build.mjs after-final` ; `node scripts/diff-snapshot.mjs before after-final` → vide.
  - `npx lhci autorun` ; `npx pa11y-ci` → pas de régression.

### Strangler Fig / feature flag

Pas nécessaire. Refacto purement structurel sur un site SSG, pas de bascule progressive en prod. Le filet snapshot suffit. Chaque étape est un PR (ou un
commit) autonome qui peut être mergé et déployé seul.

## Critères de réussite

- [ ] Étape 0 : snapshot reproductible deux fois de suite (diff vide).
- [ ] Après chaque étape : snapshot vs baseline `before` = diff vide.
- [ ] Après l'étape 7 : `grep -RE "lang === '" src/components src/layouts src/pages` retourne 0 ligne.
- [ ] `npm run check` 0/0/0, `npm run lint` clean, `npm run format -- --check` clean.
- [ ] Lighthouse CI : aucun budget rouge.
- [ ] pa11y-ci : aucune régression.
- [ ] Aucune URL nouvelle, retirée, ou redirigée.
- [ ] Le diff `git diff main...HEAD --stat` montre principalement des **suppressions** dans `pages/components/layouts` et des **créations** dans `i18n/`.

## Risques et mitigations

| Risque                                                                                                  | Probabilité    | Mitigation                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot non-déterministe dès le baseline (timestamps, ordres `Object.keys`, IDs Astro)                 | moyenne        | Étape 0 dédiée. Si rouge, isoler la source (probable : ordre de sérialisation JSON-LD, dates RSS) et la rendre déterministe avant tout refacto. |
| `routePath` retourne une chaîne légèrement différente du ternaire actuel (slash final, encodage)        | faible         | Snapshot HTML détecte toute divergence d'href. Tests manuels : suivre les liens `/parcours/`, `/en/background/` après chaque étape.             |
| JSON-LD `occupationName`, `breadcrumb`, FAQ bougent (ordre clés, espaces)                               | faible-moyenne | Snapshot couvre le HTML inline incluant `<script type="application/ld+json">`. À surveiller spécifiquement après étapes 2, 5, 6, 7.             |
| Clé manquante dans `tr.namespace.key` (typo)                                                            | faible         | TS strict + type `UiDict` : échec à la compile. `astro check` bloque.                                                                           |
| Composants `<bloc>/{fr,en}.astro` divergent du markup d'origine (espaces JSX, `{' '}`, ordre attributs) | moyenne        | Snapshot byte-identique = filet absolu. Copier-coller scrupuleux du markup d'origine ; ne **pas** "nettoyer" en passant.                        |
| Régression a11y silencieuse (un `aria-label` perdu lors de l'extraction)                                | faible         | pa11y-ci CI. À surveiller spécifiquement sur ArticleLayout / ProjectLayout (étape 3).                                                           |
| Explosion du nombre de fichiers (étape 7 crée ≈14 fichiers `.astro`)                                    | acceptée       | C'est le coût explicite du choix "un fichier par langue par bloc". Co-localisation sous `src/components/i18n/parcours/<bloc>/` la rend gérable. |

## Questions ouvertes

- **Lint custom anti-`lang === '`** : à ajouter en ESLint custom rule (`no-restricted-syntax`) en option finale, ou hors scope ? Décision : **hors scope par
  défaut**, on en reparle si pertinent à la fin.
- **Anytime (1ʳᵉ expérience)** : son contenu est court (3 bullets). Est-ce qu'on le garde en données structurées (`parcoursContent[lang].experiences[0].bullets`)
  comme les autres, ou on lui crée aussi un bloc narratif `experience-anytime/{fr,en}.astro` pour homogénéité ? **Décision proposée** : données structurées,
  cohérent avec son volume.
- **Faut-il déjà préparer le terrain pour une future migration MDX** ? Non — `parcoursContent` est un objet TS, pas un MDX. Si un jour on migre, le mapping
  TS → frontmatter MDX sera direct (les `experiences` deviennent un array dans le frontmatter, les blocs narratifs deviennent des sections MDX). Pas
  d'investissement prématuré.
- **Vérifier reproductibilité du snapshot** : si l'étape 0 révèle du non-déterminisme, on annexe un mini-PR de stabilisation avant de démarrer. À évaluer
  uniquement après avoir fait tourner le double build.
