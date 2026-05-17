# Refacto — Découpler les noms de dossiers du frontmatter (slug + translationKey)

> Date : 2026-05-17
> Stack : Astro 6 SSG / TypeScript (pas de référence stack dédiée)

## Motivation

Aujourd'hui, le nom de dossier d'une entrée de collection (`blog/`, `projects/`, `series/`) **porte de l'information publique** : il pilote l'URL canonique, les hreflang, le pair-matching i18n, les références `series`. Conséquences :

- Renommer un dossier pour clarifier l'arbo casse l'URL publique → impossible sans rediriger.
- Le préfixe `NNN-` (déjà strippé par `stripOrderPrefix`) ne traite que le tri visuel ; le reste du nom reste signifiant.
- `astro.config.mjs > buildTranslationIndex` duplique la logique de parsing du frontmatter en JS pour reconstruire ce que le loader Astro fait déjà — chaque ajout de champ doit être propagé aux deux endroits.
- Toute nouvelle convention éditoriale (regrouper par thème, renommer pour clarification, déplacer en archive) implique une migration d'URL.

Si on ne le fait pas : on continue de payer une taxe à chaque réorganisation, et le drift entre les deux parseurs (loader vs `astro.config.mjs`) reste un risque silencieux.

## Périmètre

### Code visé

- `src/content-loaders/chaptered-glob.ts` (~460 lignes) — calcule l'`id` Astro depuis le nom de dossier
- `src/content-loaders/order-prefix.ts` (~15 lignes) — strip `NNN-` (conservé pour le tri visuel)
- `src/content.config.ts` (~167 lignes) — schémas Zod `blog`, `projects`, `series`
- `src/utils/content.ts` (~135 lignes) — `publicSlug`, `findTranslation`, `blogPath`, `projectPath`
- `src/utils/series.ts` — `entrySlug`, `validateSeriesGraph`
- `astro.config.mjs` lignes 1-200 — `readEntryMetadata`, `buildTranslationIndex`, `buildLocalizedUrl`
- Frontmatters des entrées existantes (5 articles FR, 2 articles EN, 1 projet × 2 langues, 1 série × 2 langues — soit ~11 fichiers `index.{md,mdx}`)

### Clients identifiés (à vérifier qu'ils ne cassent pas)

- `src/pages/blog/[...slug].astro`, `src/pages/en/blog/[...slug].astro`
- `src/pages/projets/[...slug].astro`, `src/pages/en/projects/[...slug].astro`
- `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`, `src/pages/rss.xml.ts`
- `src/layouts/ArticleLayout.astro`, `src/layouts/ProjectLayout.astro`
- `src/components/ui/ArticleCard.astro`, `RelatedItems.astro`
- `src/components/home/ProjectsSection.astro`

Tous consomment `publicSlug()`, `blogPath()`, `projectPath()`, `findTranslation()` — donc le refacto leur est transparent tant que ces helpers gardent leur signature.

### Hors scope

- **Suppression de `nestedByLang`** — décision actée : on garde `blog/fr/`, `blog/en/`, etc. comme convention de rangement.
- **Suppression du préfixe `NNN-`** — conservé pour le tri visuel d'arbo, devient simplement redondant pour le slug.
- **Refonte profonde du système `series`** — on touche au strict minimum (référence par `seriesKey` au lieu du slug public) pour rester cohérent avec le découplage.
- **Migration vers un CMS / système de slug routé en base** — hors sujet.
- **Suppression définitive de `translationOf`** dans une étape unique : on déprécie en fin de plan (étape 10), mais on n'introduit pas de redirections legacy puisqu'aucune URL ne bouge.

## Cible

### Forme attendue après refacto

- **Schémas Zod** : `blog`, `projects`, `series` exposent `slug` (obligatoire après migration, regex `^[a-z0-9-]+$`) et `translationKey` (optionnel, regex idem). `translationOf` retiré du schéma à l'étape 10.
- **`publicSlug(entry)`** lit `entry.data.slug` (source de vérité) ; le fallback nom de dossier disparaît à l'étape 10.
- **`findTranslation(collection, entry, otherLang)`** match par `translationKey` partagé entre paires. Plus de fallback `translationOf` après étape 10.
- **`astro.config.mjs > buildTranslationIndex`** lit `slug` et `translationKey` du frontmatter en priorité.
- **Loader `chapteredGlob`** valide deux invariants nouveaux :
  - `data.lang` doit matcher le dossier parent (`fr/` ou `en/`) — sinon erreur build.
  - Pas de collision de `data.slug` final par `(collection, lang)` — sinon erreur build.
  - Tout `translationKey` doit être porté par exactement 0 ou 2 entrées d'une même collection (une par lang) — sinon erreur build.
- **Nom de dossier d'entrée** : libre. Peut être renommé/préfixé/déplacé (dans la même `lang/`) sans toucher aux URLs.

### Pattern de refacto

**Indirection par frontmatter + Strangler Fig** :

1. On introduit deux nouveaux champs (`slug`, `translationKey`) optionnels.
2. Les helpers (`publicSlug`, `findTranslation`) lisent les nouveaux champs avec fallback sur l'ancienne logique. Aucun comportement observable ne change.
3. On migre la donnée : chaque entrée existante reçoit `slug:` (= valeur retournée aujourd'hui par `publicSlug`) et `translationKey:` (= slug FR de la paire).
4. On bascule les validations en strict (erreur build sur mismatch lang, collision, asymétrie).
5. On rend `slug` obligatoire et on retire `translationOf` du schéma, du code et des frontmatters.

### Alternatives écartées

| Alternative                                                          | Pourquoi écartée                                                                                                                                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supprimer `nestedByLang` et tout aplatir                             | Perte de lisibilité dans l'arbo, plus de risque d'erreur humaine sur `lang`. Conservé comme convention organisationnelle.                                                                           |
| Garder `translationOf` indéfiniment en parallèle de `translationKey` | Double chemin = drift garanti. Le snapshot-diff prouve qu'on peut couper proprement → on coupe.                                                                                                     |
| Identifiant `translationKey` abstrait (uuid ou slug neutre)          | Couche de nommage supplémentaire à maintenir, illisible dans les diffs git. Le slug FR est déjà lisible et stable éditorialement.                                                                   |
| Calculer le slug depuis le **titre** plutôt qu'un champ dédié        | Le titre est de la copie qui évolue ; le slug d'URL doit être stable. Pire d'un point de vue SEO.                                                                                                   |
| Stocker les redirections legacy pour pouvoir changer les slugs       | Hors scope : décision explicite que les URLs publiées ne bougent pas. Le refacto verrouille l'existant ; changer un slug à l'avenir restera un acte éditorial conscient et sortira de ce périmètre. |
| Refacto en une seule passe (introduire les champs + bascule stricte) | Casse la propriété "chaque étape commitable + déployable seule". Le découpage en 10 étapes garantit qu'on peut s'arrêter à n'importe quel commit sans dette intermédiaire.                          |

## Comportement externe à préserver

**Verrou principal** : le snapshot-diff byte-à-byte (cf. `scripts/snapshot-build.mjs` + `diff-snapshot.mjs`) doit retourner 0 différence entre avant et après le refacto, sur les deux builds (prod et `SHOW_DRAFTS=1`). Le seul masque autorisé est `<lastmod>` du sitemap, déjà géré.

Liste explicite de ce qui ne doit **pas** bouger :

- **URLs publiques** :
  - `/blog/<slug>/` et `/en/blog/<slug>/` pour chaque article publié et chaque draft (URL canonique + URL `_drafts/<hash>/<slug>/`)
  - `/projets/<slug>/` et `/en/projects/<slug>/` pour chaque projet
  - Toutes les pages statiques (`/`, `/parcours/`, `/en/background/`, `/blog/`, `/en/blog/`, archives, 404, etc.)
- **Sitemap XML** : URLs, hreflang, priorités, changefreq (lastmod masqué)
- **`robots.txt`** : inchangé
- **`rss.xml`** FR et EN : ordre des items, URLs, titres, descriptions, dates
- **`llms.txt`** et **`llms-full.txt`** FR et EN : structure et contenu identiques
- **HTML rendu** de chaque page : structure DOM, classes, JSON-LD, canonical, hreflang, meta
- **Signatures publiques** des helpers (`publicSlug`, `blogPath`, `projectPath`, `findTranslation`, `isPublished`) — les clients ne sont pas modifiés
- **Comportement des séries** (regroupement archive, navigation prev/next, validation cross-collection) — exhaustivement couvert par `tests/series.test.mjs` + snapshot

## Stratégie de caractérisation

### Tests existants utilisés comme filet

| Test                                               | Ce qu'il couvre                                                          | Niveau                          |
| -------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| `tests/chaptered-glob.test.mjs`                    | Uniquement `stripOrderPrefix` (3 cas). N'effleure pas le loader lui-même | unit                            |
| `tests/seo-sections.test.mjs`                      | Parsing `resume`/`faq`/`sources` — orthogonal au slug, sert de stabilité | unit                            |
| `tests/series.test.mjs`                            | Graphe séries (validation, contexte, tri archive) — sera étendu          | unit                            |
| `tests/draft-isolation.test.mjs`                   | URLs draft (hash, isolation) — sensible aux changements de slug          | unit                            |
| `scripts/snapshot-build.mjs` + `diff-snapshot.mjs` | **Filet principal** : diff byte-à-byte de `dist/` sur prod + with-drafts | intégration (build SSG complet) |

### Tests de caractérisation à écrire AVANT le refacto

| Test à créer                                                    | Comportement à verrouiller                                                                                             | Niveau      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| `tests/content-slug.test.mjs` — `publicSlug` fallback dossier   | Pour une entrée sans `data.slug`, `publicSlug(entry)` retourne la dernière section de `entry.id` (comportement actuel) | unit        |
| `tests/content-slug.test.mjs` — `publicSlug` lit `data.slug`    | Pour une entrée avec `data.slug`, `publicSlug(entry)` retourne `data.slug` même si différent du dossier                | unit        |
| `tests/content-translation.test.mjs` — `findTranslation` legacy | Avec uniquement `translationOf` (forme actuelle), `findTranslation` retrouve la paire (bidirectionnel)                 | unit        |
| `tests/content-translation.test.mjs` — `findTranslation` key    | Avec `translationKey` partagé, `findTranslation` matche par key prioritairement                                        | unit        |
| `tests/content-translation.test.mjs` — `findTranslation` mixed  | Si key et `translationOf` coexistent, key gagne (priorité)                                                             | unit        |
| **Snapshot de référence** `tmp/snapshot/before/`                | Build prod + with-drafts archivés byte-à-byte, référence absolue pour les 9 étapes suivantes                           | intégration |

**Règle absolue** : aucun code de production touché tant que :

1. Les tests unitaires ci-dessus existent et passent contre le code actuel (capturent le comportement, sans le juger).
2. Le snapshot `before` est généré, archivé hors git (sous `tmp/`), et reproductible.

## Stratégie d'exécution incrémentale

Chaque étape : commit autonome, `npm run check` + `npm run test` + `npm run build` verts, et **snapshot identique à `before`** (sauf étape 10 où l'on rebase la référence).

### Étape 1 — Snapshot AVANT + tests de caractérisation

- [ ] Écrire `tests/content-slug.test.mjs` et `tests/content-translation.test.mjs` (cf. tableau ci-dessus). Tous verts contre le code actuel.
- [ ] `node scripts/snapshot-build.mjs before` — archive `tmp/snapshot/before/{prod,with-drafts}/`.
- **Vérification** : tests verts ; snapshot reproductible (lancer deux fois consécutivement, diff manuel des deux snapshots = 0 différence).

### Étape 2 — Ajouter `slug` et `translationKey` optionnels aux schémas Zod

- Fichiers : `src/content.config.ts`
- Ajouter `slug: z.string().regex(/^[a-z0-9-]+$/).optional()` et `translationKey: z.string().regex(/^[a-z0-9-]+$/).optional()` aux trois schémas.
- **Vérification** : `npm run check` vert ; snapshot identique à `before`.

### Étape 3 — `publicSlug` lit `data.slug` avec fallback

- Fichiers : `src/utils/content.ts`
- `publicSlug(entry)` retourne `(entry.data as { slug?: string }).slug ?? <dernière section de entry.id>`.
- Mettre à jour aussi `entrySlug` dans `src/utils/series.ts` pour cohérence (même règle).
- **Vérification** : tests unitaires des deux branches passent ; snapshot identique.

### Étape 4 — `findTranslation` lit `translationKey` avec priorité

- Fichiers : `src/utils/content.ts`
- Si `entry.data.translationKey` défini, chercher d'abord un candidat avec le même `translationKey` (forward).
- Sinon (ou si pas de match), tomber sur la logique `translationOf` actuelle (slug ou id).
- **Vérification** : tests unitaires `findTranslation key` et `findTranslation mixed` passent ; snapshot identique.

### Étape 5 — `astro.config.mjs` lit `slug` et `translationKey`

- Fichiers : `astro.config.mjs`
- `readEntryMetadata` extrait `slug` et `translationKey` en plus de `translationOf` (regex frontmatter, même style qu'aujourd'hui).
- `buildTranslationIndex` : la clef d'entrée devient `${collection}/${lang}/${meta.slug ?? slugDossier}` ; le matching de paire essaye `translationKey` puis fallback `translationOf`.
- `buildLocalizedUrl` consomme `meta.slug ?? slugDossier`.
- **Vérification** : snapshot identique (notamment `hreflang` sitemap inchangés).

### Étape 6 — Migration data : `slug:` + `translationKey:` sur chaque entrée

Fichiers concernés (11 `index.{md,mdx}`) :

- `src/content/blog/fr/001-construire-ce-site-avec-claude-et-astro/index.mdx`
- `src/content/blog/fr/002-php-symfony-2026-perspective-cto/index.mdx`
- `src/content/blog/fr/003-symfony-avant-ux-inventaire/index.mdx`
- `src/content/blog/fr/004-twig-components-socle-statique/index.mdx`
- `src/content/blog/fr/005-live-components-cycle-roundtrip/index.mdx`
- `src/content/blog/fr/006-live-components-tester-profiler-securiser/index.mdx`
- `src/content/blog/fr/007-twig-stimulus-live-decider-en-review/index.mdx`
- `src/content/blog/en/001-building-this-site-with-claude-and-astro/index.mdx`
- `src/content/blog/en/002-php-symfony-2026-cto-perspective/index.mdx`
- `src/content/projects/fr/001-symfony-template/index.md`
- `src/content/projects/en/001-symfony-template/index.md`
- `src/content/series/fr/live-components-symfony.md`
- `src/content/series/en/live-components-symfony.md`

Pour chaque entrée :

- Ajouter `slug:` = valeur retournée aujourd'hui par `publicSlug` (= nom de dossier sans préfixe `NNN-`, ou nom de fichier sans extension pour la série).
- Ajouter `translationKey:` = slug FR de la paire (ex. `translationKey: 'construire-ce-site-avec-claude-et-astro'` des deux côtés FR et EN).

**Important** : à ce stade, `translationOf` est conservé. Snapshot identique à `before` — c'est ici qu'on prouve que les deux chemins (legacy + nouveau) produisent exactement le même output.

### Étape 7 — Validation cohérence lang ↔ dossier parent dans le loader

- Fichiers : `src/content-loaders/chaptered-glob.ts`
- Quand `nestedByLang` est actif, après avoir parsé le frontmatter de l'index : si `data.lang` ne matche pas le segment de dossier (`fr`/`en`) → throw avec message explicite (chemin du fichier + valeurs en conflit).
- **Vérification** : snapshot identique ; ajouter un test unitaire ciblé qui appelle le loader sur un fixture en mismatch (échec attendu).

### Étape 8 — Validation collision de `slug` final par `(collection, lang)`

- Fichiers : `src/content-loaders/chaptered-glob.ts`
- Étendre `seenIds` pour aussi tracker les `data.slug` finaux. Deux entrées du même couple `(collection, lang)` avec le même `slug` final → throw.
- **Vérification** : snapshot identique ; test unitaire ajouté.

### Étape 9 — Validation cardinalité `translationKey` (strict 0 ou 2)

- Fichiers : `astro.config.mjs` (puisque c'est là que la vue cross-fichiers est déjà construite) OU `src/content.config.ts` via un superRefine global si possible.
- Compter, par `collection`, le nombre d'entrées portant chaque `translationKey`. Tout count ≠ 0 et ≠ 2 → throw avec liste des fichiers fautifs.
- Cas particulier : count = 2 mais les deux entrées ont la même `lang` → throw (pas une paire FR/EN valide).
- **Vérification** : snapshot identique ; test unitaire ajouté sur fixture.

### Étape 10 — Bascule stricte : `slug` obligatoire, `translationOf` retiré

- Fichiers :
  - `src/content.config.ts` : `slug` devient requis ; `translationOf` retiré du schéma.
  - `src/utils/content.ts` : `publicSlug` lit `entry.data.slug` sans fallback ; `findTranslation` ne lit plus que `translationKey`.
  - `src/utils/series.ts` : `entrySlug` lit `data.slug` sans fallback.
  - `astro.config.mjs` : `readEntryMetadata` ne lit plus `translationOf` ; pair-matching uniquement par `translationKey`.
  - Frontmatters des 11 entrées : retirer la ligne `translationOf: ...`.
  - `tests/content-translation.test.mjs` : supprimer les tests legacy `translationOf` (ou les transformer en assertions d'absence du champ).
- **Vérification** : snapshot identique à `before`. C'est le verrou final : si quoi que ce soit bouge, on a une régression à diagnostiquer avant merge.

### Strangler Fig

Le pattern Strangler est explicite dans la séquence : entre l'étape 2 et l'étape 9, l'ancienne logique (slug = dossier, `translationOf`) reste pleinement opérationnelle et coexiste avec la nouvelle. La migration data (étape 6) fait basculer la donnée sans toucher au code de fallback. La suppression du fallback est concentrée dans l'unique étape 10, qui est elle-même réversible (revert d'un seul commit) tant que les frontmatters portent encore `translationOf` (= ne pas retirer la ligne dans le même commit que la suppression du code legacy, ou bien faire les deux dans deux sous-commits).

Pas de feature flag nécessaire : la rétro-compatibilité vit dans le code, pas dans la config.

## Critères de réussite

- [ ] Tous les tests de caractérisation (étape 1) passent avant ET après le refacto.
- [ ] La suite complète (`npm run test` + `npm run check` + `npm run lint` + `npm run build`) passe à chaque étape.
- [ ] `node scripts/diff-snapshot.mjs before after` retourne 0 différence (lastmod masqué).
- [ ] Chaque étape committée est déployable seule (pas de dette intermédiaire).
- [ ] Renommer un dossier d'entrée (ex. `001-symfony-template` → `archive/symfony-template`) après le refacto ne change aucune URL ni aucun hreflang — vérifié par snapshot ad-hoc en fin de refacto.
- [ ] `grep -rn translationOf src/` ne retourne plus aucun résultat (sauf commentaires explicatifs du changelog).
- [ ] CI (Lighthouse + pa11y) vert sur l'output final.

## Risques et mitigations

| Risque                                                                                                | Probabilité | Mitigation                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drift entre `astro.config.mjs` (parsing regex) et le loader (parsing MDX)                             | moyen       | Étape 5 aligne explicitement ; snapshot couvre exhaustivement les hreflang du sitemap, donc tout drift apparaît immédiatement                                                                                           |
| Collision silencieuse de `slug` entre deux entrées de la même `(collection, lang)`                    | faible      | Étape 8 ajoute la validation explicite                                                                                                                                                                                  |
| `translationKey` mal renseigné (asymétrie 1/3, ou 2 dans la même lang)                                | moyen       | Étape 9 strict 0/2 ; cardinalité même-lang explicitement rejetée                                                                                                                                                        |
| Snapshot pas reproductible (build non-déterministe — hash assets, ordre traversal)                    | faible      | Test de reproductibilité en étape 1 ; si non-déterministe, capturer la source du non-déterminisme avant de continuer                                                                                                    |
| Régression invisible sur llms.txt / llms-full.txt qui sortirait du diff (encodage, BOM, fin de ligne) | faible      | Snapshot byte-à-byte couvre déjà ces fichiers ; vérifier explicitement le diff sur ces deux fichiers en étape 9 (avant bascule étape 10)                                                                                |
| `findTranslation` matche un mauvais candidat lors de la phase de coexistence (key + legacy)           | moyen       | Tests `findTranslation mixed` en étape 1 verrouillent la priorité ; snapshot couvre le rendu final                                                                                                                      |
| Migration data oubliée sur une entrée (étape 6)                                                       | faible      | Étape 8 (collision) + étape 9 (cardinalité) cassent le build sur toute entrée orpheline ou dépareillée — détection automatique avant merge                                                                              |
| Édition manuelle des 11 frontmatters introduit une typo                                               | moyen       | Préférer un petit script de migration (`scripts/migrate-slugs.mjs` jetable) qui calcule slug + translationKey depuis l'état actuel et patche les frontmatters via `yaml` lib déjà en devDeps ; relu humain avant commit |

## Questions ouvertes

- Faut-il garder le préfixe `NNN-` du dossier comme un signal éditorial (tri visuel) ou aller au bout et nommer les dossiers librement (ex. `symfony-2026-cto-perspective` sans préfixe) ? **Proposition** : laisser le préfixe en place après le refacto, c'est purement décoratif et n'a plus aucun impact fonctionnel. Décision à acter au moment de l'exécution.
- Le script de migration data (étape 6) est-il jeté après usage ou conservé sous `scripts/` ? **Proposition** : jeté, c'est un one-shot ; trace dans la PR suffisante.
- Les fixtures pour les tests `findTranslation` doivent-elles vivre sous `tests/fixtures/` (nouveau dossier) ou être inline dans le test ? **Proposition** : inline (les fixtures sont des objets `BlogEntryLike` purs, pas des fichiers à parser).
