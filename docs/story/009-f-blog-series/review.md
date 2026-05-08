---
name: Review 009-f-blog-series
description: Code review pré-merge du mécanisme séries d'articles (collection series, helper, composants UI, JSON-LD, llms.txt)
type: project
---

# Review — Séries d'articles de blog

> Date : 2026-05-08
> Stack : Astro 6 SSG bilingue (TypeScript strict, content collections Zod, loader `chapteredGlob`)
> Périmètre : working tree (13 fichiers modifiés, ~412 lignes ajoutées) + 5 fichiers/dossiers nouveaux (`src/components/ui/SeriesBanner.astro`, `SeriesNav.astro`, `src/utils/series.ts`, `src/content/series/{fr,en}/`, `tests/series.test.mjs`)
> Référence d'intention : `docs/story/009-f-blog-series/design.md` + `feature.md`

## Bloquants

_Aucun._ Le mécanisme tourne — `npm run check` clean, `npm run test` passe (27/27, dont 11 sur la série).

## Importants

- [x] **[BUG]** `src/utils/series.ts` — `defaultIsVisible` filtrait uniquement sur `!entry.data.draft`, divergent de `isPublished()`. **Corrigé** : nouveau `buildSeriesIndex(articles, seriesEntries, options)` qui valide + pré-calcule en une passe ; chaque appelant Astro (`[...slug].astro` FR + EN, `BlogArchive.astro`, les 4 `llms*.txt.ts`) passe `isVisible: (a) => isPublished(a, lang)`. Le compteur N/M, le bandeau, la nav, le chip, le JSON-LD `isPartOf` et `llms.txt` sont désormais alignés sur la visibilité réelle (DEV / SHOW_DRAFTS). Test ajouté `buildSeriesIndex — isVisible custom inclut les drafts (mode DEV/SHOW_DRAFTS)`.

## Mineurs

- [x] **[ARCHI]** `src/utils/schema.ts` — `position` déplacé du nœud `CreativeWorkSeries` vers `BlogPosting` (`position: p.series ? p.series.position : undefined`). Le `CreativeWorkSeries` ne porte plus que `@type` + `name`. Sémantiquement correct : `position` décrit la position de l'article dans la série, pas la position de la série.

- [x] **[CONV]** `src/utils/content.ts` — `TranslatableCollection` et `PublishableEntry` étendus à `'series'`. `isPublished` et `getDraftPreviewEntries` traitent l'absence de `draft` sur les entrées série via un narrow `'draft' in entry.data`. `findTranslation` devient utilisable sur les séries traduites, en accord avec le design ligne 110.

- [x] **[ARCHI]** Validation cross-collection dupliquée FR/EN — supprimée. La validation est désormais portée par `buildSeriesIndex` (appelée en interne dès la construction). Chaque appelant la déclenche en construisant son index, sans appel séparé à `validateSeriesGraph`.

- [x] **[PERF]** O(N×K) → O(N + Σ K log K). `buildSeriesIndex` groupe une seule fois les épisodes visibles par clé `${lang}/${seriesSlug}`, trie chaque groupe, puis fait des lookups O(1). Le cas spécial du draft preview (l'article courant insère sa position synthétique sans muter la liste partagée) est traité en amont. Test `buildSeriesIndex — lookup O(1) par article id` ajouté.

- [ ] **[STYLE]** `src/components/ui/ArticleCard.astro:206-209` — le `flex-wrap` n'est appliqué que si `seriesChipLabel` est présent. À vérifier visuellement sur mobile (320-375px) que le saut de ligne ne décroche pas l'alignement vertical entre cards d'une grille mixte. Pas un défaut de code, juste un point de QA visuelle à faire avant la migration éditoriale.

## Points positifs

- **Helper testable hors Astro** : `src/utils/series.ts` est strictement structural (`BlogEntryLike`, `SeriesEntryLike`), aucun import de `astro:content`. Permet le test Node natif `tests/series.test.mjs` qui couvre 11 cas — pathologiques inclus (mismatch lang, duplicate draft toléré, draft courant inclus dans sa propre page).
- **Byte-équivalence préservée par construction** : `isPartOf` reste `{'@id': WEBSITE_ID}` sans série ; `seriesGroups` vide ⇒ `orphans = posts` ⇒ rendu llms.txt identique à la version pré-feature ; `seriesChipLabel` null ⇒ `class:list` ne pousse pas la classe `flex-wrap`. Le critère « aucune régression sur articles non-série » du `feature.md` ligne 59 sera vérifiable via `scripts/snapshot-build.mjs` (étape 8 du plan, à dérouler).
- **Validation cross-collection au seuil de la page** : `validateSeriesGraph` lance avec un message qui pointe l'`id` fautif et propose la correction (`Crée src/content/series/<lang>/<slug>.md`). Casse le build au moment où c'est rattrapable, comme exigé par CLAUDE.md.

## Verdict

- Bloquants restants : 0 / 0
- Importants restants : 0 / 1
- Mineurs restants : 1 / 5 (uniquement la QA visuelle `flex-wrap` mobile, pas de modif code)
- Statut : **READY TO COMMIT**

QA passée : `npm run test` (30/30, dont 14 sur la série), `npm run check` (0 errors), `npm run build` (15 pages), `npm run lint` (clean).

Prochaine étape : QA visuelle mobile sur le chip d'archive, puis dérouler l'étape 8 du plan (`scripts/snapshot-build.mjs` avant/après pour verrouiller la byte-équivalence des articles non-série), puis `/commit`.
