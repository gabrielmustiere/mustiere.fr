# Design — Sections SEO standardisées pour articles et side-projects

> Feature spec : `docs/story/005-f-sections-seo-articles/feature.md`
> Stack : Astro 6 SSG bilingue (FR/EN) · Content Collections · MDX · loader custom `chaptered-glob` · Tailwind CSS 4 · Cloudflare Pages

## Approche retenue

**Étendre le loader `chaptered-glob` pour reconnaître trois "noms de fichiers réservés" dans la forme dossier**, puis injecter leur contenu parsé dans `data` au moment de la `parseData()` Zod. Aucune nouvelle collection, aucune route dynamique, aucun hack du pipeline MDX.

```
src/content/blog/php-2026-cto-considerer/
├── index.mdx           ← frontmatter (sans tldr ni faq)
├── resume.mdx          ← OBLIGATOIRE — markdown léger
├── faq.mdx             ← OPTIONNEL — frontmatter YAML structuré
├── sources.mdx         ← OPTIONNEL — frontmatter YAML structuré
├── 01-historique.mdx   ← chapitres narratifs (inchangé)
├── 02-langage.mdx
└── ...
```

Pour chaque fichier réservé :

| Fichier | Parsing | Exposé dans `data` |
|---|---|---|
| `resume.mdx` | Body markdown brut + rendu HTML via `marked` au build | `data.resume = { markdown: string, html: string, plain: string }` |
| `faq.mdx` | Frontmatter YAML `questions: [{q, r}]`. Body ignoré. | `data.faq: [{question, answer}]` (mappé pour rester compat avec `<Faq>` existant) |
| `sources.mdx` | Frontmatter YAML `sources: [{titre, url, auteur?, date?}]`. Body ignoré. | `data.sources: [{title, url, author?, date?}]` |

**La grosse partie de la feature existe déjà** — le scope réel est : déplacer les champs frontmatter `tldr` / `faq` vers des fichiers MDX dédiés, ajouter `sources`, valider la parité i18n, migrer 3 articles + 2 projets.

### Alternatives écartées

- **Mini-collection séparée `seoSections`** pour matérialiser chaque section comme une entrée distincte. Écartée : double la complexité (lookups par slug, sync entre collections), zéro bénéfice vs parsing dans le loader.
- **Texte plat sans rendu markdown** pour `resume.mdx`. Écartée par le user : on veut pouvoir mettre des liens et de l'emphase dans le résumé.
- **MDX complet rendu** (composants Astro dans le résumé). Écartée : surdimensionné, exigerait un pipeline de rendu séparé pour un besoin qui ne s'est jamais présenté.
- **Validation parité i18n dans le loader** : écartée, le loader ne voit qu'une collection à la fois et n'a pas de vue d'ensemble. La validation vit dans `astro.config.mjs#buildTranslationIndex` qui parcourt déjà tous les frontmatters.
- **JSON-LD `Citation` pour les sources** : écarté pour cette feature (faible valeur SEO réelle vs surface de code à maintenir). Réintroductible plus tard si besoin.

## Entités et modèle de données

Pas d'entité au sens BDD (site SSG). Le « modèle » est le schéma Zod de `src/content.config.ts`.

### Schéma `blog` — diff

```ts
const blog = defineCollection({
  loader: chapteredGlob({ base: './src/content/blog', extensions: ['.mdx', '.md'] }),
  schema: z.object({
    title: z.string().max(120),
    excerpt: z.string().min(80).max(220),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: categoryEnum,
    tags: z.array(z.string()).default([]),
    readingTime: z.number().int().positive().optional(),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
    keywords: z.array(z.string()).default([]),
    // - tldr: z.string().min(60).max(320),         ← SUPPRIMÉ (vient de resume.mdx)
    // - faq: z.array(faqItem).default([]),         ← SUPPRIMÉ (vient de faq.mdx)
    // + resume: resumeSchema,                       ← INJECTÉ par le loader (obligatoire)
    // + faq: z.array(faqItem).default([]),         ← INJECTÉ par le loader (depuis faq.mdx)
    // + sources: z.array(sourceItem).default([]),  ← INJECTÉ par le loader (depuis sources.mdx)
    number: z.number().int().positive(),
    lang: langEnum.default('fr'),
    translationOf: z.string().optional(),
  }),
});
```

### Schéma `projects` — diff

Idem : suppression de `summary` et `faq`, ajout de `resume`/`faq`/`sources` injectés.

### Sous-schémas Zod (nouveaux)

```ts
const resumeSchema = z.object({
  markdown: z.string().min(80),       // contrainte de longueur (~80 mots min)
  html: z.string(),                    // rendu marked, pour <Resume />
  plain: z.string().min(80).max(800),  // texte plat, pour meta description + llms.txt
});

const faqItem = z.object({
  question: z.string().max(200),
  answer: z.string().min(1),
});

const sourceItem = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  author: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

Le loader construit `data.resume.{markdown,html,plain}` à partir du contenu de `resume.mdx`. La meta description tronque `data.resume.plain` à 160 chars (coupure mot + ellipse).

## Mécanismes framework mobilisés

- **Astro Content Loader API** (`Loader` interface) : extension du loader maison `chaptered-glob`. C'est le mécanisme officiel d'Astro pour fournir des entrées de collection avec des sources non-standard.
- **Zod** (`astro:content`) : validation post-injection au niveau du schéma de collection. Si `resume.mdx` est manquant ou que son `markdown` est trop court, `parseData()` lève une erreur build claire.
- **`render(entry)`** d'Astro : déjà utilisé dans `src/pages/blog/[...slug].astro` pour extraire `Content` + `headings`. Aucun changement nécessaire — le TOC continue de fonctionner sur le body agrégé (résumé/faq/sources étant exclus du body).
- **`marked`** : rendu markdown léger appelé une seule fois par article au build. Pas dans le bundle client.
- **`buildTranslationIndex` dans `astro.config.mjs`** : déjà l'endroit où les paires `translationOf` sont résolues. C'est le bon endroit pour la validation de parité.

## Fichiers à créer

| Fichier | Rôle |
|---|---|
| `src/components/ui/Resume.astro` | Affiche `data.resume.html` dans un Callout (remplace l'usage actuel du tldr). Conserve `data-speakable`. |
| `src/components/ui/Sources.astro` | Section « § sources » en bas d'article. Liste `<ol>` avec `title`, `url` (`<a target="_blank" rel="noopener">`), `author` et `date` optionnels en méta. |
| `src/content-loaders/seo-sections.ts` | Helpers pour le loader : `parseResume(filePath): {markdown,html,plain}`, `parseFaq(filePath): [{question,answer}]`, `parseSources(filePath): [{title,url,...}]`. Sortis du loader principal pour rester testables. |
| `tests/loader-seo-sections.test.mjs` | (Optionnel mais recommandé) Test unitaire des helpers : YAML invalide → erreur explicite, markdown vide → erreur, parité de mapping `q`/`r` → `question`/`answer`. |

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `src/content-loaders/chaptered-glob.ts` | Étendre `loadFolder` : whitelister `resume.mdx`, `faq.mdx`, `sources.mdx`. Les exclure de `chapterFiles` et de `chapterBodies`. Appeler les helpers `parseResume`/`parseFaq`/`parseSources` puis enrichir `data` avant `parseData()`. Le `digestSource` doit inclure le contenu de ces 3 fichiers (sinon hot-reload cassé). |
| `src/content.config.ts` | Diff schéma : retirer `tldr`/`faq`/`summary`, ajouter `resume` (obligatoire), `faq` (default []), `sources` (default []). Sous-schémas dans le même fichier ou un `src/content-loaders/seo-schemas.ts`. |
| `src/layouts/ArticleLayout.astro` | L:73 (passer à `blogPostingSchema`) : `tldr: data.resume.plain`. L:82 : la condition `data.faq.length > 0` reste valide. L:168-177 : remplacer le `<Callout>` qui rend `data.tldr` par `<Resume html={data.resume.html} />`. Après `<Faq>` : `{data.sources.length > 0 && <Sources items={data.sources} title={tr.article.sourcesTitle} accent="blog" />}`. |
| `src/layouts/ProjectLayout.astro` | Même traitement (Resume + Sources), accent `projects`. |
| `src/pages/llms-full.txt.ts` (FR) et `src/pages/en/llms-full.txt.ts` (EN) | L:63-64 : remplacer `post.data.tldr` par `post.data.resume.markdown`. (Markdown préservé pour les LLMs, plus riche que `plain`.) |
| `src/pages/llms.txt.ts` (FR) et `src/pages/en/llms.txt.ts` (EN) | Si lecture de `tldr` : pointer vers `resume.plain`. |
| `src/utils/schema.ts` | `BlogPostingInput.tldr` reste typé `string?`, mais l'appelant fournit désormais `data.resume.plain`. Pas de changement de signature interne. |
| `src/i18n/ui.ts` | Ajouter clés `article.summaryLabel` (« Résumé » / « Summary »), `article.sourcesTitle` (« Sources »), `project.sourcesTitle`. La clé existante `tldrLabel` peut être renommée en `summaryLabel` (rename trivial). |
| `astro.config.mjs#buildTranslationIndex` | Ajouter validation : pour chaque paire (`fr`,`en`) liée par `translationOf`, vérifier que `entry.data.faq.length > 0` ⇔ pendant `data.faq.length > 0` (idem `sources`). En cas d'asymétrie, lever une erreur build avec les deux chemins de fichiers. |
| `package.json` | Ajout dépendance : `marked` (devDependency, `^15` ou la dernière stable). |

## Impacts transverses

- **i18n / traduction** : 4 nouvelles clés `summaryLabel`, `sourcesTitle` (×2 collections) — ajoutées dans `src/i18n/ui.ts`. Validation parité stricte ajoutée dans `buildTranslationIndex`.
- **Migration de données** : 3 articles blog (php-2026-cto-considerer FR seulement, construire-ce-site-... FR + building-this-site-... EN) et 2 projets (symfony-template FR + EN). Pour chaque dossier : créer `resume.mdx` (extrait du `tldr` actuel, étoffé si trop court), créer `faq.mdx` si l'article a un champ `faq` non-vide dans son frontmatter actuel (cf. construire-ce-site qui n'en a pas, php-2026 à vérifier), créer `sources.mdx` si pertinent. Retirer `tldr` et `faq` des frontmatters.
- **SEO** : ajout JSON-LD `FAQPage` automatique sur articles avec FAQ — déjà implémenté, aucune nouvelle code path. Les meta descriptions HTML basculent de `excerpt` (si elles l'utilisent) à `data.resume.plain` tronqué — à vérifier dans `SiteLayout`/`BaseLayout`. **Note** : actuellement `ArticleLayout.astro:92` utilise `data.excerpt` pour `description` du `SiteLayout` — décision à prendre : garder `excerpt` (cohérent avec listing cards) OU passer à `resume.plain` tronqué (cohérent avec « le résumé est la source canonique »). Recommandation : **garder `excerpt`** — c'est sa raison d'être, on ne le supprime pas. Le `tldr` actuel ne sert PAS de meta description aujourd'hui (seul `excerpt` le fait), donc cet impact disparaît.
- **`llms.txt` / `llms-full.txt`** : source change `tldr` → `resume.markdown`.
- **Sitemap** : aucun impact (URLs publiques inchangées).
- **Snapshots de non-régression** : la diff `before/after` (cf. `scripts/snapshot-build.mjs`) sera large (3 articles + 2 projets gagnent un bloc Résumé re-stylé + bloc Sources). Documenter dans la description PR.

## Ordre d'implémentation

Implémentation incrémentale, chaque étape laisse le build vert.

1. [ ] **Étape 1 — Helpers de parsing** : créer `src/content-loaders/seo-sections.ts` avec `parseResume`/`parseFaq`/`parseSources`. Ajouter dépendance `marked`. Tests unitaires des helpers (cas valides + cas d'erreur YAML/longueur).
2. [ ] **Étape 2 — Extension du loader** : étendre `chaptered-glob.ts` pour reconnaître les 3 noms réservés, les exclure des chapitres, appeler les helpers, enrichir `data`. Inclure leur contenu dans `digestSource` (hot-reload). Le loader **ne fail pas encore** si `resume.mdx` manque (transition).
3. [ ] **Étape 3 — Composants** : créer `<Resume>` et `<Sources>`. Ajouter clés i18n `summaryLabel` et `sourcesTitle`.
4. [ ] **Étape 4 — Migration des contenus** : pour chaque article et projet, créer `resume.mdx` (depuis le `tldr` actuel), `faq.mdx` (depuis le `faq` frontmatter actuel s'il existe), éventuellement `sources.mdx`. Retirer `tldr` et `faq` des frontmatters au fur et à mesure.
5. [ ] **Étape 5 — Bascule des layouts** : `ArticleLayout` et `ProjectLayout` passent de `data.tldr`/`data.faq` (frontmatter) à `data.resume.html`/`data.faq` (loader). Adapter `blogPostingSchema(tldr: data.resume.plain)`. Adapter `llms-full.txt.ts` (FR + EN).
6. [ ] **Étape 6 — Mise en place des contraintes** : retirer `tldr`/`faq`/`summary` du schéma Zod. Loader fail si `resume.mdx` manque. Build doit passer.
7. [ ] **Étape 7 — Validation parité i18n** : ajouter check dans `buildTranslationIndex`. Tester en cassant volontairement la parité FAQ d'une paire FR/EN, vérifier le message d'erreur, restaurer.
8. [ ] **Étape 8 — Snapshots de non-régression** : générer snapshot before (sur `main`) puis after (sur la branche), valider que toutes les diffs sont attendues (Résumé re-stylé, Sources ajoutées, headers/JSON-LD conservés).
9. [ ] **Étape 9 — QA finale** : `npm run check`, `npm run lint`, `npm run build`, vérification visuelle locale (`npm run dev`) sur tous les articles + projets en FR et EN.

## Stratégie de test

| Code | Type de test | Ce qu'on vérifie |
|---|---|---|
| `src/content-loaders/seo-sections.ts` | Unit (Vitest ou Node `test`) | `parseFaq` : YAML invalide → erreur claire ; mapping `q`/`r` → `question`/`answer` ; tableau vide rejeté. `parseSources` : URL malformée → erreur ; date invalide → erreur. `parseResume` : markdown trop court → erreur ; markdown valide → `html` non vide ; `plain` ne contient ni HTML ni markdown. |
| `src/content-loaders/chaptered-glob.ts` (extension) | Functional (build sur fixture) | Dossier sans `resume.mdx` → erreur build avec chemin clair. Dossier avec fichier inconnu (ex `notes.mdx`) → erreur build (régression test). Dossier conforme → `data.resume`/`data.faq`/`data.sources` présents et bien typés. |
| `astro.config.mjs#buildTranslationIndex` | Functional (build) | Une paire FR/EN avec asymétrie FAQ → erreur build pointant les deux fichiers. Parité respectée → build vert. |
| `src/layouts/ArticleLayout.astro` & `ProjectLayout.astro` | E2E manuel | Sur tous les articles + projets en FR et EN, vérifier visuellement : Résumé rendu (HTML marked), TOC inchangé, FAQ rendu (si présent), Sources rendues (si présent), JSON-LD `FAQPage` valide via [Schema.org validator](https://validator.schema.org/). |
| `src/pages/llms-full.txt.ts` (FR + EN) | Snapshot diff | `node scripts/snapshot-build.mjs before` (avant migration), idem after, `node scripts/diff-snapshot.mjs before after` : la diff sur `/llms-full.txt` doit être lisible (markdown du résumé là où était l'ancien `tldr`). |

Pas de framework de tests installé pour l'instant — `npm test` n'existe pas dans `package.json`. Les tests unitaires des helpers peuvent être écrits avec le `node:test` natif (zero dep), exécutés via `node --test tests/`. À convenir au moment de l'étape 1.

## Risques et points d'attention

- **Snapshots before/after volumineux** — risque de masquer une vraie régression dans le bruit. Mitigation : faire la migration **article par article** pendant l'étape 4, snapshoter et diff après chaque migration pour catcher les surprises tôt.
- **Compatibilité hot-reload** — si le `digestSource` du loader oublie d'inclure le contenu de `resume.mdx` / `faq.mdx` / `sources.mdx`, modifier ces fichiers en dev ne déclenchera pas de re-render. Mitigation : test manuel explicite à l'étape 2.
- **Erreur build cryptique en cas de YAML invalide** — `js-yaml` ou parser natif Astro peuvent produire des messages opaques. Mitigation : wrapper try/catch dans les helpers avec message custom incluant le chemin du fichier et un extrait du YAML fautif.
- **Validation parité au mauvais endroit** — si `buildTranslationIndex` n'a pas accès à `data.faq` (selon le format des entries qu'il itère), il faudra peut-être un check séparé via un `astro:build:done` integration hook. À vérifier au moment de l'étape 7. Plan B : check côté `getStaticPaths` des routes blog/project (mais erreur tardive).
- **Régression sur `excerpt` vs `tldr`** — bien vérifier qu'aucun consommateur du `tldr` n'a été oublié (`grep -rn "data\.tldr\|\.tldr"` après migration doit être vide).
- **Rendu `marked` côté SSR** — `marked` doit être appelé au build, pas au runtime client. Si appelé dans un composant `.astro` à `<script>` client, ça casse. Le rendu doit se faire dans le loader (côté Node).

## Questions ouvertes

- **Renommer `tldrLabel` en `summaryLabel`** ou garder le nom de clé existant (et juste changer la valeur affichée) ? Renommer me semble plus propre vu que la sémantique change (un résumé long rendu en HTML ≠ un tldr court en plain text). À trancher en étape 5.
- **`faq.mdx` et `sources.mdx` peuvent-ils contenir une intro libre dans le body MDX** (à terme, pour mettre du contexte avant la liste) ? Pas pour cette feature — body ignoré pour rester simple — mais potentielle évolution. À documenter dans le commentaire du loader.
- **Convention de troncature de `resume.plain`** pour la meta description : 160 chars stricts, coupure au mot le plus proche + `…` ? Décision à prendre dans `parseResume` ou dans le consommateur (`SiteLayout`). Je recommande dans `parseResume` (`plain` est déjà le texte stripé, on peut produire un `meta` champ tronqué prêt à l'emploi). Cela dit, l'usage actuel de `excerpt` pour la meta description rend cette troncature non urgente.
- **Test framework** : on installe Vitest (cohérent avec l'écosystème Astro) ou on utilise `node:test` (zéro dep) pour les helpers ? À trancher en étape 1, recommandation : `node:test` pour rester minimaliste vu qu'il n'y a aucun autre test JS dans le projet aujourd'hui.
- **Préserver l'ordre `tldr` → `resume`** dans le frontmatter de migration : pour limiter le bruit dans les diffs git, supprimer `tldr` au moment où `resume.mdx` est créé, dans le même commit. Stratégie : un commit par article migré.
