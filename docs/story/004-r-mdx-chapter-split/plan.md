---
status: draft
---

# Refacto — Découpage des MDX longs en chapitres

> Date : 2026-04-28 Stack : astro 6 + mdx

## Motivation

Les fichiers de contenu (articles de blog et fiches projet) sont des MDX monolithiques de 130 à 210 lignes. Le cas concret qui motive :
`src/content/blog/php-2026-cto-considerer.mdx` (211 lignes, 7 chapitres `H2`, frontmatter de 27 lignes avec FAQ + tldr + keywords).

Le travail éditorial assisté par LLM sur ces articles est devenu pénible :

- Un Read complet du fichier pollue le contexte d'édition d'un seul chapitre.
- Demander à un LLM de réécrire ou challenger un chapitre fait peser le risque qu'il « harmonise » ou réécrive d'autres sections sans qu'on l'ait demandé.
- Le diff d'une révision chapitre devient bruité.
- Au fur et à mesure que les articles s'allongeront (rythme de publication régulier prévu), le coût n'ira qu'en augmentant.

Sans ce refacto, on continue à éditer des fichiers qui grossissent et qui forcent un compromis entre confort de relecture humaine et qualité de l'assistance
LLM.

## Périmètre

### Code visé

- `src/content/blog/*.mdx` — 3 articles (188, 188, 211 lignes), 2 langues : FR sans préfixe, EN sous `/en/blog/`.
- `src/content/projects/*.md` — 2 fiches (131 lignes chacune), 2 langues.
- `src/content.config.ts` — schéma Zod et loader actuel `glob({ pattern: '**/*.mdx', ... })`.
- `astro.config.mjs` — `buildTranslationIndex()` (lignes 15-43) qui lit le frontmatter via regex sur les fichiers physiques. **Adaptation obligatoire** pour
  reconnaître le format dossier.

### Clients identifiés

Tout consommateur de `post.body` ou de l'objet `post` rendu doit conserver une sortie strictement identique :

| Client                                           | Usage                                                                      | Sensibilité                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------- |
| `src/pages/blog/[...slug].astro:33-37`           | `render(post)` → `Content` + `headings` ; `readingTimeFromText(post.body)` | HTML rendu, IDs des headings, reading time      |
| `src/pages/en/blog/[...slug].astro`              | idem                                                                       | idem                                            |
| `src/pages/projects/[...slug].astro:29`          | `render(project)`                                                          | HTML, headings                                  |
| `src/pages/en/projects/[...slug].astro`          | idem                                                                       | idem                                            |
| `src/pages/llms-full.txt.ts:67-69`               | `parts.push(post.body.trim())` (dump direct)                               | **byte-à-byte** sensible                        |
| `src/pages/en/llms-full.txt.ts`                  | idem                                                                       | idem                                            |
| `src/pages/rss.xml.ts` + EN                      | frontmatter only                                                           | safe                                            |
| `src/pages/llms.txt.ts` + EN                     | frontmatter only                                                           | safe                                            |
| `astro.config.mjs:15-43` `buildTranslationIndex` | regex sur `.mdx`/`.md` à plat                                              | **doit être étendu** pour lire `slug/index.mdx` |
| `ArticleLayout.astro` / `ProjectLayout.astro`    | frontmatter (`tldr`, `faq`, `excerpt`...)                                  | safe                                            |

### Hors scope

- **Schéma Zod du frontmatter inchangé** — aucune nouvelle propriété, aucun champ retiré.
- **Imports MDX dans les chapitres interdits** au premier jet (option i). L'agrégateur lèvera une erreur si un chapitre déclare `import`/`export` au top-level.
  La possibilité de hisser/dédupliquer les imports (option ii) sera considérée plus tard quand un cas d'usage réel apparaîtra.
- **Pas de réécriture éditoriale** des articles à l'occasion du refacto. Le `body` agrégé doit être identique caractère pour caractère à l'original (au
  whitespace de séparation près, contrôlé en snapshot).

## Cible

### Forme attendue après refacto

```
src/content/blog/
  php-2026-cto-considerer/
    index.mdx              # frontmatter complet + corps optionnel d'introduction
    01-langage.mdx         # corps markdown brut, pas de frontmatter
    02-symfony.mdx
    03-outillage.mdx
    04-frankenphp.mdx
    05-front-mobile.mdx
    06-ia.mdx
    07-grille-decision.mdx
  php-2026-cto-considerer-en/        # convention pendant FR/EN existante préservée
    index.mdx
    01-langage.mdx
    ...
  construire-ce-site-avec-claude-et-astro/
    ...
  building-this-site-with-claude-and-astro/
    ...

src/content/projects/
  symfony-template/
    index.md
    01-...
    ...
  symfony-template-en/
    index.md
    ...
```

Règles :

- **Un dossier = une entrée** dans la collection. L'`id` de l'entrée reste le nom du dossier (= ancien nom de fichier sans extension), donc les URLs
  (`/blog/php-2026-cto-considerer/`, etc.) sont strictement identiques à aujourd'hui.
- **`index.mdx` (ou `index.md`)** : porte le **frontmatter complet** (validé par le schéma Zod existant). Son corps markdown est optionnel — utile pour une
  introduction qui précède le premier `H2`.
- **Chapitres** : `NN-slug.mdx` (préfixe numérique à 2 chiffres + tiret + slug kebab-case). Pas de frontmatter. Pas d'`import`/`export` au top-level. Juste du
  markdown.
- **Ordre** : déterminé par le tri alphabétique des noms de fichiers chapitre (donc par préfixe numérique). `index.{md,mdx}` n'entre pas dans cet ordre — son
  corps est inséré **avant** le premier chapitre.
- **`body` agrégé** = `index.body` + (`'\n\n'` + chapter.body) pour chaque chapitre dans l'ordre. Convention de séparation stricte pour stabilité byte-à-byte.

### Pattern de refacto retenu

**Loader Astro custom** (option A validée). On remplace le `glob({ pattern: '**/*.mdx', ... })` actuel par un loader maison qui :

1. Scanne `src/content/blog/` (ou `projects/`) en distinguant deux formes :
   - Forme **fichier plat** : `slug.mdx` ou `slug.md` (forme actuelle, conservée pour compat).
   - Forme **dossier** : `slug/index.mdx` (ou `index.md`) + chapitres `NN-*.mdx` (ou `NN-*.md`).
2. Lit le frontmatter de `index.{md,mdx}` (forme dossier) ou du fichier (forme plate) et le valide via le schéma Zod existant (réutilisé tel quel).
3. Construit le `body` :
   - Forme plate → `body` = contenu sous le frontmatter (comportement actuel).
   - Forme dossier → `body` = `index.body` puis chapitres triés alphabétiquement, joints avec `'\n\n'`. Si `index.body` est vide, on commence directement avec
     le 1er chapitre, sans préfixe.
4. Fournit l'entrée à Astro (id = nom de dossier ou de fichier sans extension), MDX rendu via le pipeline standard.
5. **Erreur build explicite** si :
   - un chapitre contient un `import`/`export` au top-level,
   - un dossier ne contient pas de `index.{md,mdx}`,
   - un dossier ne contient aucun chapitre **et** son `index` a un body vide,
   - un nom de chapitre ne respecte pas `^\d{2}-[a-z0-9-]+\.mdx?$`.

Le compromis entre plat et dossier permet une migration **en bloc mais incrémentale par fichier** : on bascule un article à la fois, le snapshot reste
comparable à chaque étape.

### Alternatives écartées

| Alternative                                                                   | Pourquoi écartée                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B — Pre-build script** (régénère un `.mdx` plat depuis `_chapters/<slug>/`) | Source de vérité dupliquée → risque de drift si le script n'est pas appelé ; complique `npm run dev` (watcher à gérer).                                                                                                       |
| **C — `index.mdx` qui importe les chapitres comme composants `<Chapter1 />`** | Casse le contrat externe : `post.body` deviendrait du JSX-MDX (`import ... ; <Chapter1 />`), donc `llms-full.txt` et `readingTimeFromText` produiraient des sorties différentes. Incompatible avec la contrainte refacto pur. |
| **Status quo + balises `<!-- chapitre: X -->` pour navigation**               | Ne résout pas la pollution de contexte LLM (le fichier reste un seul gros bloc).                                                                                                                                              |
| **Hisser/dédupliquer les imports MDX des chapitres (option ii)**              | Pas de cas d'usage actuel (aucun MDX existant n'a d'import top-level). Complexité gratuite à ce stade.                                                                                                                        |

## Comportement externe à préserver

Liste explicite de ce qui ne doit **pas** bouger après le refacto. Tout diff byte-à-byte sur ces sorties est un échec.

- **HTML rendu** des pages d'article (`/blog/<slug>/index.html`) et de projet (`/projects/<slug>/index.html`), FR et EN.
  - Identique au caractère près : balises, IDs des headings (slugify), classes CSS, ordre du DOM, syntax highlighting Shiki.
- **`/llms-full.txt`** et **`/en/llms-full.txt`** — dump direct du `post.body`, byte-à-byte sensibles.
- **`/llms.txt`**, **`/en/llms.txt`** — frontmatter only, doit rester strictement identique.
- **`/rss.xml`**, **`/en/rss.xml`** — frontmatter only.
- **`/sitemap-*.xml`** — URLs et hreflang inchangés. Ignorer le `lastmod` (timestamp de build) dans la comparaison.
- **`readingTime`** calculé via `readingTimeFromText(post.body)` — doit donner exactement la même valeur entière.
- **IDs des headings** générés par MDX (slugify automatique) — préservés pour ne pas casser les ancres externes.
- **Schémas JSON-LD** (`blogPostingSchema`, `breadcrumbSchema`, `faqPageSchema`) — invariants, dérivent du frontmatter inchangé.
- **`buildTranslationIndex()` dans `astro.config.mjs`** — produit la même `Map` (paires de slugs FR↔EN) après adaptation au format dossier.

## Stratégie de caractérisation

### Tests existants utilisés comme filet

**Aucun runner de tests dans le projet.** La QA repose sur `astro check` (TypeScript + diagnostics content collections), Lighthouse CI, pa11y-ci. Aucun test ne
couvre le rendu ou la cohérence du `body` MDX.

Le filet de sécurité doit donc être construit pour le refacto.

### Tests de caractérisation à écrire AVANT le refacto

**Filet par snapshot du build complet**, validé en début de phase 2.

| Test à créer                 | Comportement à verrouiller                                                                                                                                           | Niveau  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `scripts/snapshot-build.mjs` | Build complet du site, copie de `dist/` vers `tmp/snapshot/` (chemin paramétrable).                                                                                  | tooling |
| `scripts/diff-snapshot.mjs`  | Comparaison byte-à-byte entre `tmp/snapshot/before/` et `tmp/snapshot/after/`. Masquer les seuls champs volatiles (`<lastmod>` du sitemap). Tout autre diff = échec. | tooling |

Procédure :

1. **Avant tout changement** : `npm run build` puis `node scripts/snapshot-build.mjs before`. On archive `dist/` complet dans `tmp/snapshot/before/`. Cette
   archive est la **vérité de référence** pour tout le refacto.
2. **Après chaque étape** : `npm run build` puis `node scripts/diff-snapshot.mjs before dist`. Sortie attendue : aucun diff (hors `<lastmod>`).
3. **À tout moment où un diff non trivial apparaît** : on s'arrête, on diagnostique, on corrige avant d'avancer.

Pourquoi ce filet et pas autre chose : c'est la seule preuve possible que les artefacts publiés (HTML, RSS, sitemap, llms.txt, llms-full.txt) sont strictement
identiques après refacto. Un test unitaire sur le loader ne couvrirait pas la chaîne complète (rendu MDX → HTML → IDs des headings → reading time → dump txt).
Le snapshot, lui, couvre tout par construction.

**Règle absolue** : aucune migration de fichier de contenu vers la forme dossier tant que :

- le snapshot `before` n'est pas archivé,
- le loader custom n'est pas en place et validé en mode no-op (rebuild sans aucun fichier migré → diff = 0).

## Stratégie d'exécution incrémentale

Chaque étape est commitable et déployable seule. Si une étape casse quoi que ce soit, on s'arrête sans dette.

1. [ ] **Étape 1 — Outillage de snapshot**
   - Objectif : disposer du filet avant de toucher au code.
   - Livrables : `scripts/snapshot-build.mjs` et `scripts/diff-snapshot.mjs` ; archive `tmp/snapshot/before/` produite à partir du `main` actuel ; `tmp/` ajouté
     au `.gitignore` si besoin.
   - Vérification : `node scripts/diff-snapshot.mjs before before` → 0 diff.

2. [ ] **Étape 2 — Loader custom Astro avec compat ascendante**
   - Objectif : remplacer le `glob` par le loader maison qui supporte forme plate ET forme dossier, sans encore migrer de fichier.
   - Fichiers touchés : `src/content.config.ts` (changement de loader), nouveau fichier `src/content-loaders/chaptered-glob.ts` (le loader custom).
   - Convention de tri, validation des erreurs build (chapitre avec import top-level, dossier sans index, etc.) implémentées dès cette étape.
   - Vérification : `npm run build` passe ; `node scripts/diff-snapshot.mjs before dist` → 0 diff (hors `lastmod`). C'est le **test no-op** : le loader produit
     exactement le même résultat tant que tous les fichiers sont en forme plate.

3. [ ] **Étape 3 — Adaptation de `buildTranslationIndex` dans `astro.config.mjs`**
   - Objectif : faire en sorte que la fonction reconnaisse aussi `slug/index.mdx` (en plus de `slug.mdx`).
   - Fichier touché : `astro.config.mjs:15-43`.
   - Implémentation : si une entrée du `readdirSync` est un dossier contenant `index.{md,mdx}`, lire ce fichier ; sinon comportement actuel.
   - Vérification : `node scripts/diff-snapshot.mjs before dist` → 0 diff. (Toujours en mode no-op, aucun fichier migré encore.)

4. [ ] **Étape 4 — Migration pilote : `php-2026-cto-considerer` (FR + EN)**
   - Objectif : valider la chaîne complète sur l'article qui a motivé le refacto.
   - Découpage proposé sur le FR (211 lignes, 7 H2) — confirmé pendant l'exécution :
     - `index.mdx` : frontmatter + corps d'introduction (lignes 28-33 de l'original) + section « Ce que j'ai vu se transformer en quatorze ans » (jusqu'avant le
       1er H2 « Le langage… »).
     - `01-langage.mdx`, `02-symfony.mdx`, `03-outillage.mdx`, `04-frankenphp.mdx`, `05-front-mobile.mdx`, `06-ia.mdx` (incluant le H3 « grille de décision »).
   - Même découpage pour la version EN (`building-this-site-with-claude-and-astro` … oups, mauvais slug pour cet article ; vérifier le pendant EN exact à
     l'exécution).
   - Vérification : `node scripts/diff-snapshot.mjs before dist` → 0 diff (hors `lastmod`).
   - Si diff non nul : on suspend, on diagnostique avant toute migration supplémentaire.

5. [ ] **Étape 5 — Migration des autres articles (FR + EN)**
   - `construire-ce-site-avec-claude-et-astro` + pendant EN.
   - (Si d'autres articles arrivent entre-temps, les inclure.)
   - Vérification : diff = 0 après chaque article, FR et EN.

6. [ ] **Étape 6 — Migration des fiches projet (FR + EN)**
   - `symfony-template` + `symfony-template-en`.
   - Le découpage est moins évident sur 131 lignes — discuter à l'exécution si on découpe ou si on laisse en forme plate. Le mécanisme supportant les deux, ce
     n'est pas bloquant.
   - Vérification : diff = 0.

7. [ ] **Étape 7 — Documentation de la convention**
   - Mettre à jour `CLAUDE.md` (section content collections) et/ou `DEVELOPMENT.md` pour décrire :
     - La forme dossier vs forme plate, quand utiliser laquelle.
     - Les règles de nommage chapitres (`NN-slug.mdx`).
     - L'interdiction des imports MDX au top-level dans les chapitres.
     - Comment vérifier la non-régression d'un chapitre via le snapshot.
   - Vérification : doc à jour, prochains articles seront créés directement en forme dossier.

### Strangler Fig / feature flag

**Pas de feature flag**. La compatibilité ascendante du loader est elle-même la cohabitation : forme plate et forme dossier coexistent dans la collection. Le
refacto migre fichier par fichier, chaque étape déployable seule.

Pas de bascule différée : le cycle est `migrer un article → diff snapshot → commit → article suivant`.

## Critères de réussite

- [ ] `tmp/snapshot/before/` archivé avant la 1re modif et préservé jusqu'à la fin du refacto.
- [ ] Après chaque étape (2 à 6 inclus), `node scripts/diff-snapshot.mjs before dist` retourne 0 diff (hors `<lastmod>`).
- [ ] `npm run check` passe à l'identique (aucune nouvelle erreur de typage ni de schéma Zod).
- [ ] `npm run lint` passe.
- [ ] `npm run build` produit `dist/` byte-à-byte identique (au `lastmod` près) à l'archive `before/`.
- [ ] La forme plate continue de fonctionner (compat ascendante validée par l'étape 2 no-op).
- [ ] La forme dossier fonctionne pour les 5 fichiers migrés (FR + EN inclus).
- [ ] Documentation projet mise à jour (étape 7).

## Risques et mitigations

| Risque                                                                                                               | Probabilité     | Mitigation                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concaténation introduit du whitespace différent → IDs de headings ou reading time bougent                            | moyen           | Convention stricte `'\n\n'` entre `index.body` et chapitres ; entre chapitres ; pas de séparateur en tête. Snapshot byte-à-byte attrape immédiatement.                                    |
| `buildTranslationIndex` casse silencieusement → hreflang manquants dans le sitemap                                   | moyen           | Le diff sitemap (hors `lastmod`) attrape la régression à l'étape 3.                                                                                                                       |
| MDX/Shiki produit un HTML légèrement différent si le découpage altère le contexte (ex: bloc de code coupé en deux)   | faible          | Découper toujours **entre H2 entiers**, jamais au milieu d'un bloc markdown. Snapshot attrape sinon.                                                                                      |
| Un chapitre commence par un `H1` (vu comme titre d'article) au lieu d'un `H2`                                        | faible          | Convention : pas de `H1` dans les chapitres (le titre vient du frontmatter, géré par `ArticleLayout`). Validation à l'étape 2 du loader (warning si `H1` détecté).                        |
| Le glob `**/*.mdx` actuel matche les fichiers chapitre comme entrées indépendantes pendant la transition             | élevé si oublié | Le loader custom de l'étape 2 **remplace** le glob, donc le pattern récursif disparaît. C'est la première chose à vérifier après l'étape 2.                                               |
| Un chapitre contient accidentellement un `import` MDX → MDX agrégé invalide                                          | moyen           | Validation explicite dans le loader (erreur build claire pointant le fichier coupable).                                                                                                   |
| Le snapshot devient lourd à archiver dans `tmp/`                                                                     | faible          | Compression (`tar.gz`) si nécessaire, mais le `dist/` actuel est petit (5 articles). À voir à l'usage.                                                                                    |
| Les frontmatters utilisent des chaînes multi-ligne ou des caractères qui cassent le regex de `buildTranslationIndex` | faible          | Le code actuel marche déjà ainsi sur la forme plate ; on garde la même approche regex pour la forme dossier. Si besoin, on bascule la lecture sur un parser YAML proprement (hors scope). |

## Questions ouvertes

- **Découpage exact des articles courts** (`construire-ce-site-avec-claude-et-astro`, 188 lignes ; fiches projet 131 lignes) : on découpe ou on laisse en forme
  plate ? À trancher pendant l'exécution. Le mécanisme supportant les deux, on a le choix au cas par cas.
- **Granularité du découpage du pilote PHP-2026** : 7 chapitres comme proposé en étape 4, ou regrouper certains (ex: « front-mobile » + « ia » qui sont
  relativement courts) ? À valider en regardant le rendu final pendant l'exécution.
- **Évolution future vers l'option ii** (imports MDX hissés) : à reconsidérer si un chapitre a besoin d'un composant Astro spécifique. Pas un blocker
  maintenant.
- **`scripts/snapshot-build.mjs` checké en git ou non** : oui pour qu'il soit reproductible et utilisable par la CI plus tard si on veut. Le contenu de
  `tmp/snapshot/` reste hors git.
