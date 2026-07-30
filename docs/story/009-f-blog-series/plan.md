# Design — Séries d'articles de blog

> Feature spec : `docs/story/009-f-blog-series/pitch.md`
> Stack : Astro 6 SSG bilingue (FR/EN), TypeScript strict, content collections Zod, loader custom `chapteredGlob`.

## Approche retenue

Trois piliers :

1. **Nouvelle collection `series`** (FR + EN, séparées par `nestedByLang`), schema Zod simple : `title`, `description`, `lang`, `translationOf?`. Forme plate (`series/<lang>/<slug>.md`) — pas de body rendu, pas de sections SEO. Le loader actuel `chapteredGlob` la consomme tel quel sans modification.
2. **Extension du schema `blog`** avec `series?: string` + `seriesOrder?: number`, validés conjointement par `superRefine` (présents ensemble ou absents ensemble). Cohérence cross-collection (référence existante, `seriesOrder` unique par série) **non exprimable en Zod** : prise en charge en deux niveaux — test node natif + helper de validation runtime appelé en haut de `getStaticPaths` du blog (FR + EN).
3. **Helper unique `getSeriesContext(article)`** dans `src/utils/series.ts` qui consolide tout ce qu'il faut pour le rendu : entrée série, épisodes publiés triés, position courante, prev/next, premier épisode, `isFirst`. Renvoie `null` si l'article n'est pas dans une série. Calculé une fois en `getStaticPaths`, passé en prop à `ArticleLayout`, redistribué aux composants `SeriesBanner` et `SeriesNav`. Aucun double calcul.

**Alternatives écartées**

- _Forme dossier `series/<slug>/index.md`_ (suggérée dans la spec) : le loader `chapteredGlob` impose `resume.mdx` obligatoire dès qu'on est en forme dossier (cf. `chaptered-glob.ts:360-366`). Une série n'a pas de contenu long à résumer. Étendre le loader avec une option `requireSeoSections` ajoute de la friction sans gain. Forme plate retenue.
- _Loader Astro `glob` natif pour `series`_ : aucune complexité ajoutée, mais incohérence d'API entre les trois collections. Écarté au profit du `chapteredGlob` existant qui supporte déjà la forme plate.
- _Validation cross-collection au seul niveau test_ : `npm run build` peut alors passer avec une référence cassée. Inacceptable pour la garantie "le build casse si la spec se rompt" (cf. CLAUDE.md). Validation runtime ajoutée.
- _Page d'index série `/blog/series/<slug>/`_ : explicitement hors scope par la spec. Pas de route, pas de sitemap entry, pas d'OG.
- _`CreativeWorkSeries.url` dans le JSON-LD_ : omis. Schema.org tolère parfaitement une `CreativeWorkSeries` sans `url`. (a) "URL du premier épisode" est ambigu pour le crawler, (c) URL synthétique sans page derrière est mensongère.

## Entités et modèle de données

### Nouvelle collection `series`

`src/content/series/fr/<slug>.md` et `src/content/series/en/<slug>.md`.

```yaml
---
title: 'Symfony UX Live Components'
description: 'Cinq épisodes pour comprendre, mettre en œuvre et arbitrer Live Components dans une stack Symfony moderne.'
lang: fr
translationOf: 'symfony-ux-live-components'
---
```

Schema Zod (dans `src/content.config.ts`) :

```ts
const series = defineCollection({
  loader: chapteredGlob({
    base: './src/content/series',
    extensions: ['.md', '.mdx'],
    nestedByLang: ['fr', 'en'],
  }),
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(40).max(280),
    lang: langEnum.default('fr'),
    translationOf: z.string().optional(),
  }),
});
```

Pas de superRefine. Le body markdown est toléré (le `chapteredGlob` ne le rejette pas en forme plate) mais ignoré côté rendu en v1.

### Extension de `blog`

Deux champs ajoutés au schema `blog` (`src/content.config.ts:46-64`) :

```ts
series: z.string().optional(),
seriesOrder: z.number().int().positive().optional(),
```

Et un superRefine cumulé avec celui existant pour la cover :

```ts
.superRefine((data, ctx) => {
  // ... cover (existant)
  const hasSeries = data.series !== undefined;
  const hasOrder = data.seriesOrder !== undefined;
  if (hasSeries !== hasOrder) {
    ctx.addIssue({
      code: 'custom',
      path: hasSeries ? ['seriesOrder'] : ['series'],
      message: 'series et seriesOrder doivent être présents ensemble ou absents ensemble',
    });
  }
});
```

Aucun changement sur la collection `projects` — pas de notion de série pour les side projects.

## Mécanismes framework mobilisés

- **Content collections Astro + Zod** : ajout d'une collection, extension d'un schema existant. Aucun patch du loader.
- **`chapteredGlob` existant** : réutilisé tel quel pour `series` en forme plate (un fichier `.md` par entrée).
- **`isPublished()` (`src/utils/content.ts:43-48`)** : filtre canonique appliqué dans le helper série pour exclure les drafts. Toute la logique série en respecte la règle (CLAUDE.md insiste explicitement).
- **`findTranslation()` (`src/utils/content.ts:93-117`)** : réutilisable tel quel pour résoudre la série traduite via `translationOf`. La fonction est typée sur `'blog' | 'projects'` — élargir l'union à `'series'` (cf. `TranslatableCollection`).
- **`localizedPath()` + `routePath()`** : utilisés pour construire les URLs des épisodes dans le bandeau et la nav. Aucune route nommée nouvelle.
- **JSON-LD via `StructuredData.astro`** : extension de `blogPostingSchema()` pour ajouter un nœud `isPartOf: CreativeWorkSeries`.

## Fichiers à créer

| Fichier                                | Rôle                                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/series/fr/.gitkeep`       | Placeholder pour matérialiser la collection FR vide à la livraison du mécanisme.                                                                                       |
| `src/content/series/en/.gitkeep`       | Idem EN.                                                                                                                                                               |
| `src/utils/series.ts`                  | `getSeriesContext()`, `validateSeriesGraph()`, types `SeriesContext`.                                                                                                  |
| `src/components/ui/SeriesBanner.astro` | Bandeau haut : "Cet article fait partie de la série X — épisode N/M" + lien "Lire le premier épisode" (omis si `isFirst`).                                             |
| `src/components/ui/SeriesNav.astro`    | Nav prev/next épisodes en bas d'article, sautant les drafts.                                                                                                           |
| `tests/series.test.mjs`                | Test node natif couvrant `validateSeriesGraph()` : référence inexistante, seriesOrder dupliqué, mismatch de langue, cas valides. Modèle `tests/seo-sections.test.mjs`. |

## Fichiers à modifier

| Fichier                                                      | Modification                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content.config.ts`                                      | Ajout de la collection `series` ; ajout des champs `series`/`seriesOrder` au schema `blog` avec superRefine de présence conjointe ; export du type `Category` reste inchangé.                                                                                                                                              |
| `src/utils/content.ts`                                       | Élargir `TranslatableCollection` à `'series'` (`findTranslation` devient utilisable pour les séries traduites).                                                                                                                                                                                                            |
| `src/i18n/ui.ts`                                             | Nouvelles clés sous `article.series` : `partOf`, `episode` (avec placeholders `{n}`/`{m}`), `firstEpisodeCta`, `prevEpisode`, `nextEpisode`, `chipLabel`. Versions FR + EN.                                                                                                                                                |
| `src/pages/blog/[...slug].astro`                             | Appel `validateSeriesGraph()` en haut de `getStaticPaths` (lance Error si rompu) ; calcul de `seriesContext = await getSeriesContext(post)` ; passage en prop à `ArticleLayout`. `nextPosts` global conservé en parallèle (cf. Q4 = b).                                                                                    |
| `src/pages/en/blog/[...slug].astro`                          | Idem côté EN.                                                                                                                                                                                                                                                                                                              |
| `src/layouts/ArticleLayout.astro`                            | Nouvelle prop `seriesContext: SeriesContext \| null` ; rendu `<SeriesBanner>` **avant** la nav breadcrumb (l. 122) si `seriesContext` ; rendu `<SeriesNav>` **avant** `<RelatedItems>` (l. 199) si `seriesContext`.                                                                                                        |
| `src/components/ui/ArticleCard.astro` (variante `sm`)        | Ajout d'un chip informatif `Série X • N/M` à côté de la `CategoryPill` (l. 202), conditionnel à la présence d'un `seriesContext` (calculé en amont par `BlogArchive` et passé en prop, ou directement via `data.series` + lookup ponctuel — voir Risques). Non cliquable, classe `cat-pill` réutilisée sans `chip-active`. |
| `src/components/pages/BlogArchive.astro`                     | Calcul d'un map `articleId → seriesContext` une seule fois (un appel `getSeriesContext` par article de série), passé via prop à chaque `<ArticleCard>` pour éviter N+1.                                                                                                                                                    |
| `src/utils/schema.ts`                                        | Extension de `BlogPostingInput` avec `series?: { name, position }` ; ajout dans la sortie de `blogPostingSchema()` du nœud `isPartOf: { '@type': 'CreativeWorkSeries', name, position }` quand fourni. Sans `url`.                                                                                                         |
| `src/pages/llms.txt.ts`                                      | Boucle articles transformée en boucle "groupes" : un groupe par série (titre + description + items dans l'ordre `seriesOrder`) puis les articles orphelins par `publishedAt` desc. Section reste intitulée `## Articles`.                                                                                                  |
| `src/pages/llms-full.txt.ts`                                 | Même regroupement. Pour chaque série : `## <Title>` (description en italique) puis les `### <épisode>` dans l'ordre `seriesOrder`. Articles orphelins en queue.                                                                                                                                                            |
| `src/pages/en/llms.txt.ts` + `src/pages/en/llms-full.txt.ts` | Même logique côté EN.                                                                                                                                                                                                                                                                                                      |

## Impacts transverses

- **i18n / traduction** : essentiel. Une série FR ne peut référencer qu'un article FR, et vice versa (validé par `validateSeriesGraph`). La traduction d'une série suit `translationOf` standard. Libellés UI ajoutés dans `src/i18n/ui.ts`. Aucune route nommée nouvelle.
- **Multi-channel / multi-tenant / multi-thème** : N/A.
- **API** : N/A (SSG).
- **Permissions** : N/A.
- **i18n config / sitemap / hreflang** : aucun changement à `astro.config.mjs`. Pas de page de série, pas de nouvelle entrée à indexer dans le sitemap. Les paires FR/EN d'articles continuent d'être détectées par `buildTranslationIndex` via leur `translationOf` côté blog.
- **Drafts** : la politique existante (`isPublished()`) reste inchangée. Un épisode draft est invisible côté public — bandeau, nav, chip, JSON-LD `isPartOf`, llms.txt l'ignorent tous. Le compteur "N/M" se base exclusivement sur les épisodes publiés (M = nombre d'épisodes publiés, pas le total déclaré). En mode `SHOW_DRAFTS=1` ou en dev, les drafts deviennent visibles partout, naturellement.
- **Migration de données** : opération éditoriale séparée, hors scope de la feature elle-même. Démantèlement de `src/content/blog/fr/live-components-symfony-modele-composant-serveur/` en 5 dossiers d'articles distincts (un par chapitre), création d'une entrée `src/content/series/fr/symfony-ux-live-components.md`. Préservation du `number: 3` sur l'épisode 1 ; les 4 autres prennent les `number` disponibles à la suite des articles publiés au moment de l'opération. À conduire via `editorial:article-rework` ou manuellement, **après** livraison du mécanisme.

## Ordre d'implémentation

Stratégie : verrouiller le mécanisme (schemas + validation + helper) avant tout rendu. Chaque étape est indépendamment vérifiable.

1. [ ] **Étape 1 — Collection `series` + schema + validation conjointe blog**
       Ajouter la collection `series`, étendre le schema `blog`, créer `src/content/series/{fr,en}/.gitkeep`. Vérifier : `npm run check` + `npm run build` passent (aucune entrée série, aucune référence sur les articles existants).
2. [ ] **Étape 2 — Helper `src/utils/series.ts`**
       Implémenter `getSeriesContext()` et `validateSeriesGraph()`. Tests `tests/series.test.mjs` couvrant les cas pathologiques (référence inexistante, ordre dupliqué, mismatch de langue, série existante mais vide). Vérifier : `npm run test` passe.
3. [ ] **Étape 3 — Validation runtime dans `[...slug].astro` (FR + EN)**
       Appel de `validateSeriesGraph()` en haut de `getStaticPaths`. Vérifier : `npm run build` passe ; introduire localement un mauvais `series:` dans un article fait casser le build avec un message clair, puis revert.
4. [ ] **Étape 4 — Composants UI : `SeriesBanner` + `SeriesNav`**
       Créer les deux composants ; les insérer dans `ArticleLayout.astro` ; ajout des libellés i18n ; passage du `seriesContext` en prop depuis `[...slug].astro`. Vérifier visuellement avec une série de test (deux articles fictifs créés temporairement).
5. [ ] **Étape 5 — Chip d'archive dans `ArticleCard sm`**
       Calcul du map `articleId → seriesContext` dans `BlogArchive.astro`, prop ajoutée à `ArticleCard`, rendu du chip à côté de `CategoryPill`. Vérifier : pas de régression visuelle sur les articles non-série.
6. [ ] **Étape 6 — JSON-LD `isPartOf`**
       Étendre `blogPostingSchema()` ; passer `series` depuis `ArticleLayout.astro`. Vérifier le JSON-LD émis avec curl + `jq` sur le build local d'un article de série.
7. [ ] **Étape 7 — `llms.txt` + `llms-full.txt` (FR + EN)**
       Refactor de la boucle articles en boucle "groupes". Vérifier : sortie ordonnée correctement, articles orphelins toujours présents, pas de régression sur le contenu non-série.
8. [ ] **Étape 8 — Garde-fou non-régression**
       `node scripts/snapshot-build.mjs before` (sur un commit AVANT série), `after` après livraison sur un état SANS aucune entrée série déclarée ; `diff-snapshot.mjs before after` doit être **vide** (au lastmod sitemap près). Garantit que le mécanisme est inerte en l'absence de série.
9. [ ] **Étape 9 — QA finale**
       `npm run check`, `npm run test`, `npm run build`, `npx lhci autorun`, `npx pa11y-ci`. Tous passent.

La migration éditoriale de l'article live-components est faite **après** l'étape 9, dans un commit séparé.

## Stratégie de test

| Code                                                         | Type de test                                 | Ce qu'on vérifie                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/series.ts` (`validateSeriesGraph`)                | Unit (node natif, `tests/series.test.mjs`)   | Référence à une série inexistante → throw avec message pointant le slug fautif. `seriesOrder` dupliqué entre deux articles publiés de la même série → throw. Mismatch de langue (article FR référence une série EN) → throw. Cas valide → no throw. Drafts ignorés (un draft avec ordre dupliqué passe parce qu'invisible côté public — la spec impose qu'un draft "réserve" sa position côté contenu). |
| `src/utils/series.ts` (`getSeriesContext`)                   | Unit (mêmes test)                            | Article hors série → `null`. Article seul publié de sa série → `position=1, total=1, prev=null, next=null, isFirst=true`. Article au milieu → bons voisins, `isFirst=false`. Article après un draft → le draft est sauté (next pointe vers l'épisode publié suivant).                                                                                                                                   |
| `src/content.config.ts` (superRefine `series`/`seriesOrder`) | Functional (via `npm run check` sur fixture) | `series` seul ou `seriesOrder` seul → erreur Zod claire au build. Couverture testée par un build avec une fixture cassée puis revert (manuel pendant le dev, pas en CI permanente).                                                                                                                                                                                                                     |
| `src/components/ui/SeriesBanner.astro` + `SeriesNav.astro`   | Visual + E2E (manuel via dev server)         | Bandeau présent sur article de série, absent sinon. Lien "Lire le premier épisode" disparaît sur l'épisode 1. Nav prev/next saute les drafts en mode `SHOW_DRAFTS=0`.                                                                                                                                                                                                                                   |
| `src/utils/schema.ts` (`blogPostingSchema`)                  | Sanity (curl + grep manuel)                  | `isPartOf` présent sur un article de série, absent sinon. `position` correct. Pas de champ `url` sur le `CreativeWorkSeries`.                                                                                                                                                                                                                                                                           |
| `src/pages/llms.txt.ts` + `llms-full.txt.ts`                 | Sanity (curl)                                | Articles d'une même série regroupés sous une section commune introduite par titre+description, ordre `seriesOrder` croissant, drafts absents. Articles orphelins préservés.                                                                                                                                                                                                                             |
| Suite globale                                                | Régression (`scripts/snapshot-build.mjs`)    | Snapshot avant livraison vs après livraison **sans entrée série déclarée** doit être byte-équivalent (étape 8).                                                                                                                                                                                                                                                                                         |

Les tests E2E Playwright n'existent pas sur ce projet (mention `workflow:test-scenario` non applicable ici en CI). Vérification visuelle manuelle suffisante pour les composants Astro statiques.

## Risques et points d'attention

- **N+1 dans l'archive blog** : `getSeriesContext()` faisant un `getCollection('blog')` à chaque appel, l'appeler une fois par card de l'archive multiplie les lectures. **Mitigation** : `BlogArchive.astro` calcule un map en une passe (un `getCollection('blog')` + un `getCollection('series')` partagés), passé via prop à `ArticleCard`. Coût constant quel que soit le nombre d'articles.
- **Cohérence du compteur en cas de publication progressive** : "épisode 2/3" affiché aujourd'hui devient "2/4" demain quand l'épisode suivant est publié. C'est par construction (compteur sur les publiés, cf. spec). À documenter dans le commentaire du helper pour que ça ne soit pas signalé comme bug plus tard.
- **Mismatch lang sur `findTranslation` série** : un article EN qui cite une série FR (oubli de traduction) doit échouer au build, pas silencieusement passer. `validateSeriesGraph` doit explicitement vérifier `article.lang === series.lang`, pas seulement l'existence de la série.
- **`number` global vs `seriesOrder`** : ne pas confondre. `number` reste le compteur global d'articles du blog (chronologique de publication), `seriesOrder` est le rang dans la série. Les deux coexistent sur un article de série. La card `lg` continue d'afficher `№ 03` (le `number` global), pas le `seriesOrder`.
- **Cohérence FR/EN d'une série traduite** : si la série FR a 5 épisodes publiés et que la série EN n'en a que 3 traduits, les compteurs divergent (5/5 côté FR, 3/3 côté EN). C'est correct — chaque langue a sa réalité de publication. À ne pas tenter d'aligner.
- **Tests éditoriaux pendant le dev** : pour itérer visuellement sur les composants avant la migration, créer une série de fixture FR + 2 articles draft pointant dessus, vérifiables en `make serve` (drafts visibles en dev). À supprimer avant le commit final.

## Questions ouvertes

- **Slugs des 4 nouveaux articles issus du démantèlement live-components** : choix éditorial à faire pendant la migration, pas pendant le mécanisme. Pointeurs candidats : dériver des chapitres actuels (`live-components-archeologie-pre-ux`, `live-components-twig-components-le-socle`, etc.) ou repenser pour articles autonomes. À trancher hors scope feature-design.
- **Sort de l'`index.mdx` actuel** (619 mots, intro de l'article live-components) : absorbé dans l'épisode 1 ou redistribué. Choix éditorial.
- **Réutilisation de la cover** : déclinée en 5 visuels, identique sur les 5, ou retravaillée. Choix éditorial.
- **Comportement en cas de série déclarée mais sans aucun épisode publié** : `getSeriesContext` renvoie `null` pour ses (futurs) épisodes encore drafts ? Ou un contexte avec `episodes=[]` et tout à null/-1 ? Je penche pour `null` (cohérent avec "aucun rendu si rien n'est publié"), mais à confirmer en cours d'implémentation. Le test de l'étape 2 le tranche.

---

## Changelog

| Date       | Type             | Description                                                                                                                                         |
| ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-31 | Migration legacy | Alignement au gabarit unifié v1.1.0 : renommage `feature.md`→`pitch.md` / `design.md`→`plan.md` + ajout de la table de changelog. Contenu inchangé. |
