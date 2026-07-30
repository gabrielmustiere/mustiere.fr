# Séries d'articles de blog

> Regrouper plusieurs articles distincts d'un même fil éditorial sous une bannière commune avec navigation prev/next entre épisodes — modèle dev.to, version minimaliste sans page d'index.

## Contexte

L'article `live-components-symfony-modele-composant-serveur` (~8 600 mots, ~38 min de lecture, en draft) cumule cinq sujets dans un seul billet via la forme dossier `chapteredGlob` (5 chapitres internes agrégés à une URL unique). Cet usage du chapitrage atteint sa limite éditoriale et SEO :

- **Lisibilité** : un billet de ~38 min décourage la lecture et le retour.
- **SEO** : 1 article = 1 entrée indexée. Cinq sujets distincts (archéologie pré-UX / Twig Components / cycle Live Components / tests-perf-sécu / décider en code review) mériteraient cinq pages indexées avec leurs propres keywords cibles.
- **Cycle de publication** : la forme dossier impose un release monolithique. Pas de cadence, pas de teasing, pas d'itération chapitre par chapitre.
- **Discoverability croisée** : aucun mécanisme actuel pour signaler "cet article fait partie d'un parcours". Un lecteur arrivé par recherche sur un sujet précis ignore que d'autres articles du même fil existent.

Le mécanisme de **chapitrage interne** (`chapteredGlob`) reste pertinent pour les articles long format autonomes ; il n'est pas remis en cause. La feature ajoute un mécanisme **complémentaire** de regroupement de N articles **distincts** sous une série commune.

## Utilisateurs concernés

- **Auteur** (Gabriel) : crée les séries, marque ses articles comme appartenant à une série, contrôle l'ordre des épisodes, publie progressivement (un épisode peut sortir avant que les suivants soient écrits).
- **Lecteur** : identifie immédiatement qu'un article fait partie d'un parcours, navigue prev/next entre épisodes publiés, accède au premier épisode depuis n'importe quel point d'entrée dans la série.
- **Crawler / LLM** : reçoit du structured data `BlogPosting.isPartOf → CreativeWorkSeries` et un corpus `llms.txt` groupé par série pour comprendre la cohérence éditoriale.

Pas de notion de rôle/permission — projet SSG mono-auteur.

## User Stories

- **En tant qu'auteur**, je veux déclarer une série dans `src/content/series/<lang>/<slug>/index.md` avec son titre et sa description, afin que mes articles puissent y être rattachés.
- **En tant qu'auteur**, je veux marquer un article comme épisode N d'une série en ajoutant `series` et `seriesOrder` à son frontmatter, afin de le lier sans toucher au layout.
- **En tant qu'auteur**, je veux pouvoir publier les épisodes au fur et à mesure (les drafts restent invisibles), afin de cadencer la publication d'une série au rythme de sa rédaction.
- **En tant que lecteur**, je veux voir en haut d'un article de série un bandeau "Cet article fait partie de la série X — épisode 2/5", afin de comprendre immédiatement le contexte éditorial.
- **En tant que lecteur**, je veux trouver en bas d'un article de série un bloc prev/next sautant les drafts, afin de continuer la lecture sans deviner les URLs.
- **En tant que lecteur**, je veux pouvoir revenir au premier épisode publié de la série depuis n'importe quel article (lien explicite dans le bandeau), afin de reprendre la série dans l'ordre prévu.
- **En tant que lecteur sur l'archive blog**, je veux qu'un chip informatif "Série X — 2/5" m'indique qu'un article appartient à un parcours, afin d'identifier les billets autonomes vs liés.
- **En tant que crawler / LLM**, je veux recevoir le `isPartOf → CreativeWorkSeries` dans le JSON-LD et un corpus `llms.txt` groupé par série, afin d'inférer la structure éditoriale.

## Règles métier

- **Une série = une collection FR + une collection EN distinctes**, liées par `translationOf` exactement comme les articles (cohérent avec `nestedByLang: ['fr', 'en']`).
- **Un article appartient à zéro ou une série**, jamais plusieurs (multi-appartenance hors scope v1).
- **`seriesOrder` est obligatoire** dès qu'un article référence une `series`, et doit être un entier positif unique au sein de la série.
- **`series` doit référencer une série existante dans la même langue** que l'article ; le build casse sinon (validation Zod ou cross-validation post-loader).
- **Un article draft de série reste invisible** côté public (politique existante `isPublished()` inchangée). Il n'apparaît ni dans le bandeau, ni dans la nav prev/next, ni dans le chip d'archive, ni dans le JSON-LD `hasPart`, ni dans `llms.txt`. Il continue de "réserver" sa position `seriesOrder` côté contenu mais le rendu public l'ignore complètement.
- **Le bandeau saute les drafts** : si l'épisode 4 est draft, depuis l'épisode 3 on a `next = épisode 5` ; l'utilisateur ne sait pas qu'un épisode 4 existe (pas de placeholder "à paraître").
- **Le compteur affiché ("épisode 2/5")** se base sur les épisodes **publiés**, pas sur le total des `seriesOrder` déclarés. Si la série a 7 épisodes déclarés mais 3 publiés, on affiche "2/3" (et "1/3", "3/3"). Cela évite de teaser des contenus non publiés et reste juste pour le lecteur.
- **L'URL des articles reste plate** : `/blog/<slug>/` (FR) et `/en/blog/<slug>/` (EN). Pas de hiérarchisation `/blog/series/<series>/<slug>/`. Un article peut être retiré ou déplacé d'une série sans casser d'URL.
- **Pas d'URL pour la série elle-même** : `/blog/series/<slug>/` n'existe pas, pas dans le sitemap, pas dans la navigation. Le chip d'archive est non cliquable. Le "voir toute la série" du bandeau renvoie au **premier épisode publié** de la série (par `seriesOrder` croissant).
- **Migration de l'article existant** : `live-components-symfony-modele-composant-serveur` est découpé en 5 articles. L'article actuel (number 3) devient l'épisode 1 et conserve son `number: 3`. Les 4 autres prennent les `number` disponibles à la suite des articles publiés au moment de la migration. Le découpage suit le mapping 1:1 des chapitres existants (`01-archeologie-pre-ux`, `02-twig-components-le-socle`, `03-live-components-le-cycle`, `04-tests-perf-securite`, `05-decider-en-code-review`).

## Critères d'acceptation

- [ ] La collection `series` (FR et EN) valide au build : `title`, `description`, `slug` dérivé de l'id, `lang`, `translationOf` optionnel.
- [ ] Le frontmatter blog accepte `series?: string` et `seriesOrder?: number`, validés conjointement (présents ensemble ou absents ensemble) par superRefine Zod.
- [ ] Le build casse explicitement si un article référence une série inexistante dans sa langue, ou si deux articles publiés de la même série ont le même `seriesOrder`.
- [ ] Le bandeau "Cet article fait partie de la série X — épisode N/M" s'affiche au-dessus du titre H1 sur tout article ayant `series` défini, avec lien vers le premier épisode publié de la série (sauf si l'article courant **est** ce premier épisode, dans ce cas le lien disparaît).
- [ ] Le bloc nav prev/next s'affiche en bas d'article (au-dessus du `RelatedItems` existant), sautant les épisodes drafts dans les deux directions.
- [ ] Les cards de l'archive `/blog` (FR) et `/en/blog` (EN) affichent un chip informatif `Série X • N/M` à côté de la chip catégorie pour les articles de série, non cliquable, calculé sur les seuls publiés.
- [ ] Le JSON-LD `BlogPosting` d'un article de série contient `isPartOf` pointant vers un nœud `CreativeWorkSeries` (avec `name`, `position`). Le `CreativeWorkSeries.url` est traité dans les questions ouvertes.
- [ ] `llms.txt` et `llms-full.txt` (FR et EN) regroupent les articles d'une même série sous une section commune introduite par le titre + description de la série, dans l'ordre `seriesOrder` croissant et limité aux publiés.
- [ ] Les 5 articles issus du découpage de `live-components-symfony-modele-composant-serveur` valident, le bandeau et la nav fonctionnent en draft local (`SHOW_DRAFTS=1`).
- [ ] Aucune régression sur les articles non-série : leur rendu, leur JSON-LD, leur entrée `llms.txt`, leur card d'archive sont byte-équivalents à avant (vérifiable via `scripts/snapshot-build.mjs` + `diff-snapshot.mjs`).
- [ ] `npm run check`, `npm run test`, `npm run build`, Lighthouse CI et pa11y-ci passent.

## Hors scope

- **Page d'index série** (`/blog/series/<slug>/`). Décision : la série est un chemin de navigation, pas une destination. Pas d'éditorial dédié à produire, pas d'URL à maintenir, pas d'OG image. Si le besoin émerge plus tard (analytics qui montrent une demande, série très grosse), on l'ajoutera.
- **Inscription au sitemap d'une URL de série** : conséquence directe du point ci-dessus.
- **Flux RSS dédié par série** (`/blog/series/<slug>/rss.xml`). Le RSS global suffit pour v1.
- **Filtre "série"** sur l'archive blog (à côté des filtres catégories existants). Le chip informatif suffit en v1.
- **Cover de série** : abandonnée puisqu'elle n'avait d'usage que sur la page d'index.
- **Multi-appartenance** : un article ne peut appartenir qu'à une série. Pas de cas d'usage immédiat, et la nav prev/next devient ambiguë.
- **Placeholder "à paraître"** pour les drafts dans le bandeau ou la nav. Décision : on ne teaser pas du WIP, on saute purement.
- **Réordonnancement à la volée** d'une série après publication. Une fois un article publié dans une série, son `seriesOrder` est considéré stable. Si réordonnancement nécessaire, c'est une opération éditoriale manuelle assumée (peut briser des liens externes pointant vers "épisode N de la série X" — mais c'est un lecteur, pas un crawler, qui s'y fie).
- **Visibilité OG/Twitter card spécifique pour la série en tant qu'entité partagée**. Pas de page d'index → rien à partager côté série.

## Impacts transverses

- **i18n / traduction** : essentiel. La collection `series` est `nestedByLang`, schema parallèle aux articles. Les libellés UI (`Cet article fait partie de la série`, `épisode N/M`, `Article précédent` / `Article suivant`, `Lire le premier épisode`, `Série`) vont dans `src/i18n/ui.ts`. Un article FR ne peut référencer qu'une série FR ; idem EN. La traduction d'une série suit le mécanisme `translationOf` standard.
- **Routes nommées** : aucune nouvelle route nommée à ajouter (pas de page d'index, URLs articles inchangées).
- **API** : N/A (projet SSG, pas d'API).
- **Permissions** : N/A.
- **Emails / notifications** : N/A.
- **Migration de données** : oui, ponctuelle. Le dossier `src/content/blog/fr/live-components-symfony-modele-composant-serveur/` est démantelé en 5 dossiers d'articles distincts (un par chapitre), chacun avec son propre `index.mdx` (ex-chapitre), `resume.mdx`, et éventuellement `faq.mdx` / `sources.mdx` propres. La cover actuelle est dupliquée ou redécoupée par épisode (au choix éditorial). Une nouvelle entrée `src/content/series/fr/symfony-ux-live-components/index.md` est créée. Le découpage est traité comme une opération éditoriale séparée (skill `editorial:article-rework` ou manuel) **après** livraison du mécanisme — il n'est pas un livrable de la feature elle-même mais sa première application.
- **Multi-channel / multi-tenant** : N/A.
- **Multi-thème** : N/A.

## Notes pour le design technique

Pointeurs bruts pour `/feature-design`, sans concevoir ici :

- **Schema** : nouvelle collection `series` dans `src/content.config.ts`, nestedByLang, schema avec `title`, `description`, `lang`, `translationOf`. Extension du schema `blog` avec `series` et `seriesOrder` (validation conjointe via `superRefine`).
- **Validation cross-collection** : la cohérence `series` (article → série existante, `seriesOrder` unique au sein d'une série) ne peut pas être exprimée par Zod seul (validation par entrée). Probablement un check post-loader (script de validation appelé dans `astro check` via un hook custom, ou un test `node --test` qui charge les collections).
- **Helper série** : un module `src/utils/series.ts` exposant `getSeriesEpisodes(seriesSlug, lang)`, `getEpisodeNeighbors(article)`, `getFirstPublishedEpisode(seriesSlug, lang)`, `isPublishedInSeries(article)` — toutes opérant sur les articles **publiés** (réutiliser `isPublished` de `src/utils/content.ts`).
- **Composants UI** : un `SeriesBanner.astro` (bandeau haut), un `SeriesNav.astro` (prev/next bas), une intégration légère dans la card d'archive blog (chip informatif). Pas d'île JS framework — Astro statique.
- **Layouts impactés** : `ArticleLayout.astro` accueille bandeau + nav. La card d'archive est dans `src/components/pages/BlogArchive.astro` (ou similaire — à vérifier).
- **JSON-LD** : `src/utils/schema.ts` étendu pour émettre `isPartOf: { @type: 'CreativeWorkSeries', name, position }` sur `BlogPosting` quand `series` est défini. Le `url` du `CreativeWorkSeries` reste à arbitrer (cf. questions ouvertes).
- **llms.txt** : `src/pages/llms.txt.ts` et `llms-full.txt.ts` réorganisent leur sortie pour grouper par série.
- **i18n** : nouvelles clés dans `src/i18n/ui.ts`.
- **Tests** : ajouter un test `tests/series.test.mjs` couvrant la validation cross-collection (référence inexistante, ordre dupliqué, mismatch de langue) — modèle existant `tests/seo-sections.test.mjs`.
- **Migration de l'article live-components** : opération éditoriale séparée à conduire via `editorial:article-rework` ou manuel, **après** livraison du mécanisme. Préserver le `number: 3` sur l'épisode 1, attribuer `4`+ aux suivants en respectant la chronologie globale au moment de l'opération. Slugs des nouveaux articles à dériver des noms de chapitres actuels mais à valider éditorialement.

## Questions ouvertes

- **`CreativeWorkSeries.url` dans le JSON-LD** : trois options — (a) URL du premier épisode publié, (b) champ omis (le standard schema.org tolère une `CreativeWorkSeries` sans `url`), (c) URL canonique synthétique (déconseillé, casse le crawl). À trancher en `/feature-design`. Penche vers (b) : honnête (il n'y a pas de page de série) et n'implique aucun maintenance lié à la publication progressive.
- **Sort de l'`index.mdx` actuel** (619 mots, intro de l'article live-components) : absorbé dans le futur épisode 1 (`01-archeologie-pre-ux`), ou re-cassé et redistribué sur les 5 introductions ? Choix éditorial à faire au moment de la migration, pas du mécanisme.
- **Slugs des 4 nouveaux articles** : à dériver des chapitres actuels (`live-components-archeologie-pre-ux`, `live-components-twig-components-le-socle`, etc.) ou complètement repensés (les chapitres ont été nommés pour s'enchaîner, pas pour être des billets autonomes). À valider éditorialement.
- **Position visuelle exacte du bandeau de série dans `ArticleLayout.astro`** : avant H1, après H1 mais avant la cover, ou après la cover ? À trancher en review du design — cohérence avec `ReadingProgress`, breadcrumbs et autres éléments en tête de page.
- **Réutilisation de la cover de l'article actuel** : la cover existante (`cover.png` du dossier live-components) sert-elle de cover de l'épisode 1, est-elle retravaillée pour 5 visuels, ou est-elle déclinée sur le même thème ? Choix éditorial.

---

## Changelog

| Date       | Type             | Description                                                                                                                                         |
| ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-31 | Migration legacy | Alignement au gabarit unifié v1.1.0 : renommage `feature.md`→`pitch.md` / `design.md`→`plan.md` + ajout de la table de changelog. Contenu inchangé. |
