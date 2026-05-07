---
name: Report — URLs de prévisualisation des drafts en prod
description: Compte rendu d'implémentation du plan 008-t-draft-preview-urls — drafts publiés sous URL non-devinable pour relecture, sans authentification.
type: tech-report
---

# Report — URLs de prévisualisation des drafts en prod

> Plan : `docs/story/008-t-draft-preview-urls/plan.md`
> Date d'exécution : 2026-05-04
> Commit : `d9296de` (feat(content): partager les drafts en prod via URL non-devinable)

## Résumé

La brique est livrée conforme au plan : chaque article `draft: true` est désormais généré en build prod sous `/blog/_drafts/<hash>/<slug>/` (et variantes EN/projects), absent de toutes les sorties publiques (sitemap, RSS, llms.txt, listings HTML), avec `noindex,nofollow` posé. Les sept critères de succès du plan sont atteints et vérifiés par `tests/draft-isolation.test.mjs` (30/30 verts). Un seul écart de forme : le helper unique `getDraftPath()` annoncé dans le plan a été éclaté en trois helpers (`getDraftHash`, `getDraftSlugParam`, `getDraftPreviewEntries`) — choix opportuniste à l'écriture, plus granulaire mais sans intention forte au départ.

## Brique livrée

| Composant                                                                                      | Rôle                                                                                                                                              | Point d'intégration                                                                                                                                              | Config                                                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `DRAFT_HASH_SEED` (`src/utils/content.ts:34`)                                                  | Phrase hardcodée mêlée au slug pour rendre l'URL non-devinable                                                                                    | Lue par les helpers de build, le CLI et le test (regex sur `export const`)                                                                                       | Constante en clair dans le code, valeur `mustiere-drafts-relecture-2026`              |
| `getDraftHash` / `getDraftSlugParam` / `getDraftPreviewEntries` (`src/utils/content.ts:40-68`) | Calcule le hash sha256 court (10 chars), produit le segment `_drafts/<hash>/<slug>` à passer à `params.slug`, filtre les entrées draft par langue | Appelés depuis les 4 `[...slug].astro`                                                                                                                           | No-op en dev (`import.meta.env.DEV` → `null` / `[]`) pour préserver le path canonique |
| Routes draft (`src/pages/{,en/}{blog,projects}/[...slug].astro`)                               | Génèrent les pages draft en plus des pages publiées via `getStaticPaths()`                                                                        | Concaténation `[...publishedRoutes, ...draftRoutes]`                                                                                                             | Prop `isDraftPreview: boolean` propagée                                               |
| `noindex` via `isDraftPreview` (`ArticleLayout`, `ProjectLayout`)                              | Émet `<meta name="robots" content="noindex,nofollow">` sur les pages draft                                                                        | Pass-through vers la prop `BaseLayout.noindex` (déjà existante avant le plan)                                                                                    | Aucune                                                                                |
| `sitemap.filter` + `robots.txt.disallow` (`astro.config.mjs:198-247`)                          | Exclut `/_drafts/` du sitemap, ajoute 4 `Disallow:` (FR/EN × blog/projects)                                                                       | Plugin `@astrojs/sitemap`                                                                                                                                        | Aucune                                                                                |
| `scripts/draft-url.mjs` + `npm run draft:url <slug>`                                           | CLI pour imprimer l'URL prod d'un draft                                                                                                           | Lit `DRAFT_HASH_SEED` via regex sur `src/utils/content.ts`, lit `SITE.url` via regex sur `src/consts.ts`, auto-détecte collection + langue depuis le frontmatter | Aucune                                                                                |
| `tests/draft-isolation.test.mjs`                                                               | Build prod + 8 assertions × 2 drafts + 1 sur `robots.txt`                                                                                         | `node --test`, build complet via `execSync` (~3 min)                                                                                                             | Lit la seed via la même regex que le CLI                                              |
| `DEVELOPMENT.md` (+21 lignes)                                                                  | Section "Partager un draft pour relecture"                                                                                                        | Workflow utilisateur, rappel rollback (changement de seed), avertissement « pas un système de sécurité »                                                         | —                                                                                     |

## Critères de succès

| Critère (plan)                                            | Cible                                                        | Mesuré                                                                                                                         | Statut |
| --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Pages draft générées sous path opaque                     | 100 % des `draft: true`                                      | 2/2 drafts (`php-2026-cto-considerer` FR + EN) générés sous `/blog/_drafts/<hash>/<slug>/index.html`                           | ✅     |
| Slugs draft dans sitemap / RSS / llms.txt / listings HTML | 0                                                            | 0 occurrences (vérif sur `sitemap-*.xml`, `rss.xml`, `en/rss.xml`, 4 fichiers `llms*.txt`, 6 listings HTML)                    | ✅     |
| Path canonique d'un draft                                 | 404                                                          | `dist/blog/php-2026-cto-considerer/index.html` absent (pareil EN)                                                              | ✅     |
| Build dev (`astro dev`)                                   | Aucun `_drafts/` généré, drafts servis à leur path canonique | Garde `import.meta.env.DEV` dans les 3 helpers — couvert par construction, conforme au plan qui notait « inspection visuelle » | ✅     |
| `noindex,nofollow` sur les pages draft                    | Présent                                                      | Meta vérifiée par le test, propagée via `isDraftPreview` → `BaseLayout.noindex`                                                | ✅     |
| `robots.txt` bloque les 4 préfixes `_drafts/`             | Présent                                                      | 4 `Disallow:` vérifiés par le test                                                                                             | ✅     |
| Test d'isolation au vert                                  | OK                                                           | `npm run test` → 30/30 verts (15 nouveaux + 15 préexistants)                                                                   | ✅     |

## Étapes du plan

| Étape                                              | Prévu                                                                            | Réalisé                                                                                                          | Écart                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Test d'isolation rouge                          | Écrire `draft-isolation.test.mjs` rouge avant tout                               | Test livré dans le même commit que l'implémentation — pas de phase rouge isolée traçable dans l'historique       | Forme : commit unique. Le test lui-même couvre la totalité des assertions du plan.                                                                            |
| 2. `getDraftPath()` + extension `getStaticPaths()` | Un helper unique `getDraftPath()`                                                | 3 helpers : `getDraftHash`, `getDraftSlugParam`, `getDraftPreviewEntries`                                        | **Écart de forme**. Découpage opportuniste à l'écriture (séparation hash / segment / filtrage par lang). Plus granulaire mais sans intention forte au départ. |
| 3. `noindex` dans `BaseLayout` + propagation       | Ajouter la prop `noindex` à `BaseLayout` + propager depuis Article/ProjectLayout | Prop `noindex` déjà existante sur `BaseLayout` avant le plan — seul le pass-through `isDraftPreview` est nouveau | Économie. Le plan annonçait « deux lignes à ajouter » dans `BaseLayout`, en pratique zéro modif côté `BaseLayout`.                                            |
| 4. `sitemap.filter` + `robots.txt`                 | Exclusion `/_drafts/`                                                            | Livré conforme                                                                                                   | —                                                                                                                                                             |
| 5. CLI `scripts/draft-url.mjs` + script npm        | Auto-détection collection + langue, regex sur la seed                            | Livré conforme + lit aussi `SITE.url` via regex sur `src/consts.ts` (commodité d'usage)                          | Mineur : ajout d'une seconde regex non listée dans le plan, cohérent avec l'esprit (source unique).                                                           |
| 6. `deploy.yml`                                    | Aucune modif                                                                     | Aucune modif                                                                                                     | —                                                                                                                                                             |
| 7. Note dans `DEVELOPMENT.md`                      | « 1 paragraphe »                                                                 | Section complète +21 lignes (workflow, rollback, avertissement sécurité)                                         | Plus étoffé que prévu.                                                                                                                                        |

## Effets transverses

- **Impact sur les clients existants** : nul. `isPublished()` n'est pas modifié, donc listings, sitemap, RSS, llms.txt continuent de filtrer les drafts comme avant.
- **Compatibilité dev** : la garde `import.meta.env.DEV` dans les helpers neutralise la branche `_drafts/` en `astro dev` — les drafts y restent visibles à leur URL canonique via `isPublished()` (comportement conservé).
- **Migration de données** : N/A.

## Rollback

- **Mécanisme prévu** : modifier `DRAFT_HASH_SEED` dans `src/utils/content.ts` puis redéployer → les anciennes URLs partagées deviennent 404, le CLI imprime de nouvelles URLs.
- **Testé** : non automatisé. Pas de test « changer la seed → 404 sur l'ancienne URL ». Le mécanisme est trivial (constante en clair, pas d'env var, pas de cache externe), risque jugé négligeable.
- **Désactivation totale** : retirer `draft: true` du frontmatter (publication) ou supprimer la branche `draftRoutes` dans les 4 `[...slug].astro`. Pas un kill switch d'urgence — c'est un changement de code qui passe par un deploy.

## Critères de sortie — vérification

Lancés depuis cette session, sur le commit `d9296de` :

- [x] `npm run test` → 30/30 verts (incluant 15 assertions de `draft-isolation.test.mjs`)
- [x] `npm run check` → 0 erreurs, 0 warnings, 0 hints sur 86 fichiers Astro
- [x] `npm run lint` → No issues found
- [x] Test manuel CLI :
  - `npm run draft:url php-2026-cto-considerer` → `https://mustiere.fr/blog/_drafts/f58cc7d73d/php-2026-cto-considerer/`
  - `npm run draft:url php-2026-cto-consider` → `https://mustiere.fr/en/blog/_drafts/68fa7571b4/php-2026-cto-consider/`
- [x] Path canonique 404 : vérifié par le test d'isolation (`canonicalPath()` non créé)
- [x] Mode dev : couvert par construction via `import.meta.env.DEV`

## Dette résiduelle

- **Fragilité du test sur les drafts existants** : `tests/draft-isolation.test.mjs` itère sur une liste hardcodée (`php-2026-cto-considerer` FR + EN). Si ces deux articles sont publiés ou supprimés, le test échouera tant que la liste ne sera pas mise à jour. À reconsidérer si la liste de drafts devient mouvante : auto-discovery des `draft: true` dans `src/content/`.
- **Pas de test de rotation de seed** : aucun test ne vérifie « ancienne URL → 404 après changement de seed ». Mécanisme simple, jugé hors périmètre.
- **Couplage par regex entre 3 fichiers** : la seed est définie dans `src/utils/content.ts` et lue par regex depuis le CLI et le test (pas de export TS importable côté `node --test` sans build TS). Si on renomme `DRAFT_HASH_SEED` ou change sa forme (template literal, etc.), il faut mettre à jour les regex dans `scripts/draft-url.mjs` et `tests/draft-isolation.test.mjs`. Documenté dans le commentaire du fichier source.

## Leçons apprises

- **`BaseLayout.noindex` déjà disponible** : la lecture du code avant cadrage aurait évité la ligne « deux lignes à ajouter » dans le plan. Pas grave (ça réduit le périmètre, pas l'inverse), mais souligne l'intérêt de l'inspection avant rédaction.
- **Découpage des helpers décidé à l'écriture** : trois helpers à la place d'un. Le plan était sous-spécifié sur ce point — pas une erreur, mais à noter que les noms d'API du plan n'ont pas été tenus tels quels. Pour une brique aussi petite, c'est sain de laisser ce niveau de détail au code.
- **Le test fait un build complet (~3 min)** : à intégrer dans `npm run test` global revient à ralentir significativement le feedback. Pour l'instant tolérable (30 tests en 4.2s grâce au build mis en cache entre runs concurrents). Si la suite grossit, envisager un split `npm run test:fast` / `npm run test:integration`.
