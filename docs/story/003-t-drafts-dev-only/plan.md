# Évolution tech — Drafts visibles en dev, masqués en prod

> Date : 2026-04-26 Stack : Astro 6 (site statique)

## Problème adressé

Aujourd'hui :

- La collection `blog` a un champ `draft: boolean`, mais le filtre `!data.draft` est appliqué **aussi en dev** (`src/pages/blog/[...slug].astro:9`,
  `src/components/home/BlogSection.astro:18`, `src/components/pages/BlogArchive.astro:27`, `src/pages/rss.xml.ts:13`, `src/pages/llms.txt.ts:14`,
  `src/pages/llms-full.txt.ts:12`, et leurs équivalents `en/`). Conséquence : impossible de prévisualiser un brouillon localement.
- La collection `projects` n'a **aucun** champ `draft` (cf. `src/content.config.ts:35-60`). Conséquence : aucun moyen de tenir un side-project en cours
  d'écriture sans qu'il soit publié.

**Pourquoi maintenant** : besoin de rédiger des articles et de documenter des side-projects sur plusieurs sessions, en pouvant relire le rendu en local, sans
publier prématurément en prod.

## Brique retenue

- **Pattern** : helper de filtrage centralisé `isPublished(entry, lang)` mutualisant le critère
  `(import.meta.env.DEV || !entry.data.draft) && (entry.data.lang ?? 'fr') === lang`. Le signal dev/prod est porté par `import.meta.env.DEV` (Astro), aligné sur
  `make serve` (= `astro dev`, `DEV=true`) vs `make build` (= `astro build`, `DEV=false`).
- **Lib / composant** : aucune dépendance ajoutée. Pure fonction utilitaire dans `src/utils/content.ts`. Astro expose nativement `import.meta.env.DEV`.
- **Schéma** : ajout de `draft: z.boolean().default(false)` à la collection `projects` (parité avec `blog`).
- **Alternatives écartées** :

| Alternative                             | Pourquoi écartée                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convention de dossier `_drafts/`        | Le glob loader d'Astro ignore les fichiers `_*` côté collection → invisible en dev aussi, donc inverse de l'objectif.                                         |
| Variable d'env explicite `SHOW_DRAFTS`  | Sur-ingénierie : aucun besoin identifié de build prod-mode avec drafts visibles (PR preview, etc.). À ajouter plus tard si le besoin émerge.                  |
| Filtre inline dupliqué dans chaque page | Déjà 10+ emplacements aujourd'hui, tendance à diverger (constat : la collection `projects` n'a jamais reçu de filtre draft). Un helper unique évite ce drift. |

## Point d'intégration

Mécanisme d'extension Astro : pure utilité TypeScript importée par les pages et composants — aucun patch framework, aucune modification vendor.

**Création** :

- `src/utils/content.ts` — exporte `isPublished(entry, lang: 'fr' | 'en')`.

**Modification du schéma** :

- `src/content.config.ts` — ajouter `draft: z.boolean().default(false)` à la collection `projects`.

**Modifications des consommateurs** (filtre actuel → helper unifié) :

Blog (10 fichiers, filtre `!data.draft && (data.lang ...)` à remplacer) :

- `src/pages/blog/[...slug].astro:9`
- `src/pages/en/blog/[...slug].astro:9`
- `src/components/home/BlogSection.astro:18`
- `src/components/pages/BlogArchive.astro:27`
- `src/pages/rss.xml.ts:13`
- `src/pages/en/rss.xml.ts:9`
- `src/pages/llms.txt.ts:14`
- `src/pages/llms-full.txt.ts:12`
- `src/pages/en/llms.txt.ts:8`
- `src/pages/en/llms-full.txt.ts:8`

Projects (4 emplacements, filtre absent à ajouter) :

- `src/components/home/ProjectsSection.astro:15`
- `src/pages/projects/[...slug].astro:6`
- `src/pages/llms.txt.ts:19`
- `src/pages/en/llms.txt.ts:12`

**Impact sur les clients existants** :

- Visiteur prod : aucun changement (les drafts blog étaient déjà cachés ; les drafts projects n'existaient pas — donc aucun retrait de contenu existant).
- Auteur en local (`make serve`) : nouveau comportement, drafts visibles.
- `make preview` (post-build) : drafts cachés, comme la prod (logique attendue).
- Signatures publiques inchangées, formats RSS / sitemap / llms.txt inchangés.

## Critères de succès mesurables

Approche : créer une fixture (un article + un side-project marqués `draft: true`), puis vérifier les deux modes.

| Métrique                                                       | Baseline actuelle              | Cible        | Méthode de mesure                                                                                             |
| -------------------------------------------------------------- | ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------- |
| Article `draft: true` accessible en `make serve`               | 0 % (blog filtre aussi en dev) | 200 OK       | `curl -o /dev/null -w '%{http_code}' http://mustiere.wip:4321/blog/<draft-slug>`                              |
| Project `draft: true` accessible en `make serve`               | N/A (champ absent)             | 200 OK       | `curl -o /dev/null -w '%{http_code}' http://mustiere.wip:4321/projects/<draft-slug>`                          |
| Article draft visible dans `BlogSection`, `BlogArchive` en dev | non visible                    | visible      | inspection HTML : `curl http://mustiere.wip:4321/ \| grep <draft-slug>`                                       |
| Project draft visible dans `ProjectsSection` en dev            | non visible                    | visible      | inspection HTML idem sur `/`                                                                                  |
| Pages HTML draft générées dans `dist/` après `make build`      | N/A                            | 0 fichier    | `find dist -path '*<draft-slug>*' -name '*.html'` → aucune sortie                                             |
| Slug draft dans le sitemap                                     | N/A (projects) / 0 (blog)      | 0 occurrence | `grep -r '<draft-slug>' dist/sitemap-*.xml` → aucune sortie                                                   |
| Slug draft dans les feeds RSS                                  | 0 (blog)                       | 0 occurrence | `grep '<draft-slug>' dist/rss.xml dist/en/rss.xml` → aucune sortie                                            |
| Slug draft dans `llms.txt` / `llms-full.txt`                   | 0 (blog) / N/A (projects)      | 0 occurrence | `grep '<draft-slug>' dist/llms.txt dist/llms-full.txt dist/en/llms.txt dist/en/llms-full.txt` → aucune sortie |

## Rollback et compatibilité

- **Kill switch** : implicite via le marquage du fichier — il suffit de retirer `draft: true` du frontmatter (ou de mettre `false`) pour rebasculer en publié.
  Pas de feature flag global ni de variable d'env à actionner. Le "switch" dev/prod est porté par le mode Astro, indissociable de la commande lancée
  (`make serve` vs `make build`).
- **Comportement si dépendance tombe** : aucune dépendance externe ajoutée (pas de Redis, pas de service tiers, pas de broker). Le risque est nul de ce côté.
- **Cohabitation** : pas nécessaire — le changement est cohérent dès le premier déploiement et n'altère aucune sortie publique existante (blog drafts déjà
  cachés en prod, projects ne contient aucun draft à date).

## Impacts transverses

- **Modules clients impactés** : pages blog, pages projects, composants home, feeds RSS, sitemap (via `@astrojs/sitemap`, alimenté par les routes effectivement
  buildées), pages `llms.txt` / `llms-full.txt` FR + EN.
- **Migration de données** : non. Le champ `draft` côté projects a un default `false` → tous les fichiers existants restent publiés sans modification.
- **Impacts prod** : aucune nouvelle dépendance d'infra. Aucun coût additionnel. Build identique en empreinte.
- **Sécurité** : pas de nouveau vecteur. Les pages draft ne sont pas générées en prod (donc non accessibles par URL devinée), ne sont pas dans le sitemap, ni
  dans les feeds. Aucune fuite si le contenu n'est pas committé/déployé.

## Plan d'exécution incrémental

1. [ ] **Étape 1 — Helper centralisé**
   - Créer `src/utils/content.ts` avec `isPublished(entry, lang)`.
   - Vérification : `make check` passe.
2. [ ] **Étape 2 — Schéma `projects`**
   - Ajouter `draft: z.boolean().default(false)` dans `src/content.config.ts`.
   - Vérification : `make check` passe ; `make build` reste vert (default false → aucun fichier ne devient draft).
3. [ ] **Étape 3 — Migration blog**
   - Remplacer les 10 occurrences `!data.draft && (data.lang ...)` par `isPublished(entry, lang)`.
   - Vérification : `make build` puis grep d'un slug d'article publié existant → présent partout (sitemap, rss, llms.txt, page détail).
4. [ ] **Étape 4 — Extension projects**
   - Appliquer `isPublished()` aux 4 emplacements consommateurs de `projects`.
   - Vérification : `make build` puis grep d'un slug de project existant → présent partout.
5. [ ] **Étape 5 — Validation par fixtures**
   - Marquer un article et un project en `draft: true`.
   - `make serve` → vérifier visibilité (curl + listings + page détail).
   - `make build` → vérifier absence (find + grep sur tous les artefacts listés dans la table de métriques).
   - Retirer ou conserver les fixtures selon préférence.
6. [ ] **Étape 6 — Documentation**
   - Mettre à jour `DEVELOPMENT.md` : usage de `draft: true`, comportement `make serve` vs `make build` vs `make preview`.

## Critères de sortie

- [ ] `isPublished()` est l'unique point de filtre draft+lang du codebase (`grep -rn '!data.draft\|data.draft' src/` ne renvoie que la définition du helper et
      le schéma).
- [ ] Toutes les métriques de la table « Critères de succès mesurables » atteignent leur cible avec une fixture draft.
- [ ] `make build` reste vert sans warning ni erreur d'import.
- [ ] Aucune régression sur les contenus actuellement publiés (slug d'un article et d'un project publiés inspectés dans `dist/sitemap-*.xml`, `dist/rss.xml`,
      `dist/llms.txt`).
- [ ] `DEVELOPMENT.md` documente le workflow draft.

## Risques et mitigations

| Risque                                                                                                       | Probabilité                                | Mitigation                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oubli d'un consommateur futur de la collection (et donc fuite d'un draft)                                    | moyenne                                    | Helper centralisé `isPublished()` + commentaire au-dessus du schéma rappelant de l'utiliser. Critère de sortie qui interdit `data.draft` hors helper et schéma. |
| `astro preview` (post-build) montre des drafts ?                                                             | nulle                                      | `astro preview` sert le `dist/` déjà buildé en mode prod, donc drafts absents par construction. Documenté dans `DEVELOPMENT.md`.                                |
| Lien dur depuis un contenu publié vers un slug draft → 404 en prod                                           | moyenne                                    | Convention auteur : ne pas lier un contenu publié vers un draft. Pas d'automatisation prévue à ce stade.                                                        |
| Build de PR preview (Netlify/Vercel/CI) considère le mode prod → drafts cachés alors qu'on voudrait les voir | faible (pas de pipeline preview à ce jour) | Si le besoin émerge, ajouter un override `SHOW_DRAFTS` (variable d'env) dans le helper. Hors scope de ce plan.                                                  |

## Questions ouvertes

- Faut-il garder une fixture draft committée en permanence comme test de régression vivant (ex: `src/content/blog/_fixture-draft.mdx`) ? Décider à l'étape 5.
- Convention de nommage des slugs draft : aucune contrainte technique, mais on peut adopter un préfixe `wip-` pour repérage visuel rapide. Optionnel.
