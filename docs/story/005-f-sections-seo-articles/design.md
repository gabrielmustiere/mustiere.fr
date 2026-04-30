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

| Fichier       | Parsing                                                                  | Exposé dans `data`                                                                |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `resume.mdx`  | Body markdown brut + rendu HTML via `marked` au build                    | `data.resume = { markdown: string, html: string, plain: string }`                 |
| `faq.mdx`     | Frontmatter YAML `questions: [{q, r}]`. Body ignoré.                     | `data.faq: [{question, answer}]` (mappé pour rester compat avec `<Faq>` existant) |
| `sources.mdx` | Frontmatter YAML `sources: [{titre, url, auteur?, date?}]`. Body ignoré. | `data.sources: [{title, url, author?, date?}]`                                    |

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
  loader: chapteredGlob({
    base: './src/content/blog',
    extensions: ['.mdx', '.md'],
  }),
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
  markdown: z.string().min(80), // contrainte de longueur (~80 mots min)
  html: z.string(), // rendu marked, pour <Resume />
  plain: z.string().min(80).max(800), // texte plat, pour meta description + llms.txt
});

const faqItem = z.object({
  question: z.string().max(200),
  answer: z.string().min(1),
});

const sourceItem = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  author: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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

| Fichier                               | Rôle                                                                                                                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/Resume.astro`      | Affiche `data.resume.html` dans un Callout-like (remplace l'usage de `<Callout>` pour le tldr). Conserve `data-speakable`.                                                                                                         |
| `src/components/ui/Sources.astro`     | Section « § sources » en bas d'article. Liste `<ol>` avec `title`, `url` (`<a target="_blank" rel="noopener noreferrer">`), `author` et `date` optionnels en méta + hostname.                                                      |
| `src/content-loaders/seo-sections.ts` | Helpers pour le loader : `parseResume(filePath)`, `parseFaq(filePath)`, `parseSources(filePath)`, `discoverSectionFiles(dirPath)` (helper utilitaire), `RESERVED_SECTION_FILES`. Sortis du loader principal pour rester testables. |
| `src/utils/meta.ts`                   | `truncateForMeta(text, maxLen=160)` pour la meta description HTML, coupure au mot le plus proche + ellipse.                                                                                                                        |
| `tests/seo-sections.test.mjs`         | 15 tests `node:test` couvrant les helpers : YAML invalide → erreur claire, markdown vide → erreur, longueurs, mapping `q`/`r` → `question`/`answer`, URL/date validées, etc.                                                       |

## Fichiers à modifier

| Fichier                                                                   | Modification                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content-loaders/chaptered-glob.ts`                                   | Étendre `loadFolder` : whitelister `resume.mdx`, `faq.mdx`, `sources.mdx`. Les exclure de `chapterFiles` et de `chapterBodies`. Appeler les helpers `parseResume`/`parseFaq`/`parseSources` puis enrichir `data` avant `parseData()`. Erreur explicite (avant Zod) si `resume.mdx` absent dans la forme dossier. Le `digestSource` inclut le contenu des 3 fichiers (sinon hot-reload cassé). |
| `src/content.config.ts`                                                   | Diff schéma : retirer `tldr`/`faq`/`summary`, ajouter `resume` (obligatoire), `faq` (default []), `sources` (default []). Sous-schémas inline dans le même fichier. Migration `z.string().url()` → `z.url()` (deprecation).                                                                                                                                                                   |
| `src/layouts/ArticleLayout.astro`                                         | `blogPostingSchema(tldr: data.resume.plain)`. Remplacer le `<Callout>` qui rend `data.tldr` par `<Resume html={data.resume.html} />`. Après `<Faq>` : bloc `<Sources>` conditionnel. **Meta description** alimentée par `truncateForMeta(data.resume.plain)` (passé via `description={metaDescription}` à `SiteLayout`).                                                                      |
| `src/layouts/ProjectLayout.astro`                                         | Même traitement (Resume + Sources + meta description), accent `projects`. `softwareSourceCodeSchema(abstract: data.resume.plain)`.                                                                                                                                                                                                                                                            |
| `src/pages/llms-full.txt.ts` (FR) et `src/pages/en/llms-full.txt.ts` (EN) | Remplacer `post.data.tldr` par `post.data.resume.markdown`. Préfixe d'affichage : `**Résumé.**` / `**Summary.**`.                                                                                                                                                                                                                                                                             |
| `src/pages/llms.txt.ts` (FR) et `src/pages/en/llms.txt.ts` (EN)           | Aucun changement nécessaire — ces fichiers utilisaient déjà `excerpt`, pas `tldr`.                                                                                                                                                                                                                                                                                                            |
| `src/utils/schema.ts`                                                     | `BlogPostingInput.tldr` reste typé `string?`, l'appelant fournit désormais `data.resume.plain`. Pas de changement de signature interne.                                                                                                                                                                                                                                                       |
| `src/i18n/ui.ts`                                                          | Ajouter clés `article.summaryLabel`, `article.summaryAria`, `article.sourcesTitle`, `project.summaryLabel`, `project.summaryAria`, `project.sourcesTitle` (FR + EN). Suppression de `tldrLabel` (devenu mort).                                                                                                                                                                                |
| `astro.config.mjs#buildTranslationIndex`                                  | Pour chaque entrée en forme dossier, détecter `faq.mdx` / `sources.mdx`. Pour chaque paire `translationOf`, vérifier la parité — asymétrie = build fail avec les deux chemins de fichiers cités.                                                                                                                                                                                              |
| `package.json`                                                            | Ajout deps `marked` (devDep) et `yaml` (devDep). Ajout script `npm test` (`node --experimental-strip-types --test 'tests/**/*.test.mjs'`, requiert Node ≥ 22).                                                                                                                                                                                                                                |
| `src/components/ui/Callout.astro`                                         | **Supprimé** : devenu code mort après bascule des layouts (plus aucun import).                                                                                                                                                                                                                                                                                                                |

## Impacts transverses

- **i18n / traduction** : 6 nouvelles clés (`summaryLabel`, `summaryAria`, `sourcesTitle` × blog + projects) ajoutées dans `src/i18n/ui.ts`. Validation parité stricte ajoutée dans `buildTranslationIndex`.
- **Migration de données** : 3 articles blog (php-2026-cto-considerer FR seul, construire-ce-site-... FR + building-this-site-... EN) et 2 projets (symfony-template FR + EN). Pour chaque dossier : `resume.mdx` créé (depuis `tldr` ou `summary` actuel), `faq.mdx` créé si l'entrée avait un `faq` frontmatter (php-2026 + symfony-template FR + EN). Frontmatters nettoyés (`tldr`/`faq`/`summary` retirés).
- **SEO** : JSON-LD `FAQPage` automatique sur articles avec FAQ — déjà implémenté, aucune nouvelle code path. Meta descriptions HTML basculées sur `truncateForMeta(data.resume.plain)` (160 chars, coupure mot + ellipse) ; `excerpt` reste réservé aux cards de listing blog (séparation des rôles : `excerpt` = listing, `resume.plain` = meta + JSON-LD `abstract`).
- **`llms.txt` / `llms-full.txt`** : seul `llms-full.txt` consommait `tldr` → bascule sur `resume.markdown`. `llms.txt` court utilisait déjà `excerpt` → comportement inchangé.
- **Sitemap** : aucun impact (URLs publiques inchangées).
- **Snapshots de non-régression** : non utilisés — `scripts/snapshot-build.mjs` est un outil hérité du refacto 004-r (qui exigeait byte-à-byte invariant). Pour une migration de contenu où les pages **doivent** changer (sections ajoutées, JSON-LD), le diff `before/after` n'apporte pas d'information actionnable. `astro check` + `npm run build` + inspection ciblée de `dist/*.html` suffisent.

## Ordre d'implémentation

Implémentation incrémentale, chaque étape laisse le build vert.

1. [x] **Étape 1 — Helpers de parsing** : `src/content-loaders/seo-sections.ts` avec `parseResume`/`parseFaq`/`parseSources` + `discoverSectionFiles`. Deps `marked` + `yaml`. 15 tests `node:test` (valides + erreurs YAML/URL/date/longueur).
2. [x] **Étape 2 — Extension du loader** : `chaptered-glob.ts` reconnaît les 3 noms réservés, les exclut des chapitres, appelle les helpers, enrichit `data`. Contenu dans `digestSource` (hot-reload).
3. [x] **Étape 3 — Composants** : `<Resume>` et `<Sources>` créés. Clés i18n `summaryLabel`, `summaryAria`, `sourcesTitle` (FR + EN, blog + projects). `truncateForMeta` ajouté dans `src/utils/meta.ts`.
4. [x] **Étape 4 — Migration des contenus** : 3 articles + 2 projets convertis. Frontmatters `tldr`/`faq`/`summary` retirés.
5. [x] **Étape 5 + 6 — Bascule layouts + resserrement Zod** (fusionnées) : `ArticleLayout`/`ProjectLayout` passent à `data.resume.html`/`data.faq`/`data.sources`. `blogPostingSchema(tldr: data.resume.plain)`, `softwareSourceCodeSchema(abstract: data.resume.plain)`. `llms-full.txt` FR + EN. Schéma Zod : `tldr`/`faq`/`summary` retirés ; `resume` (obligatoire), `faq` / `sources` (default []) ajoutés. Loader fail explicite si `resume.mdx` manque (avant Zod). **Étapes fusionnées car aucun chemin de transition viable** : Zod ne tolère pas un schéma "ancien tolérant nouveau" et le build casse pendant la transition. `<Callout>` supprimé (devenu mort). Suppression de `tldrLabel` (i18n).
6. [x] **Étape 7 — Validation parité i18n** : check ajouté dans `buildTranslationIndex`. Testé en cassant volontairement la parité FAQ.
7. [x] **Étape 8 — QA finale** : `npm run check` 0/0/0, `npm run lint` 0, `npm run build` 12 pages OK, `npm test` 15/15.

## Stratégie de test

| Code                                                      | Type de test                   | Ce qu'on vérifie                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content-loaders/seo-sections.ts`                     | Unit (Vitest ou Node `test`)   | `parseFaq` : YAML invalide → erreur claire ; mapping `q`/`r` → `question`/`answer` ; tableau vide rejeté. `parseSources` : URL malformée → erreur ; date invalide → erreur. `parseResume` : markdown trop court → erreur ; markdown valide → `html` non vide ; `plain` ne contient ni HTML ni markdown. |
| `src/content-loaders/chaptered-glob.ts` (extension)       | Functional (build sur fixture) | Dossier sans `resume.mdx` → erreur build avec chemin clair. Dossier avec fichier inconnu (ex `notes.mdx`) → erreur build (régression test). Dossier conforme → `data.resume`/`data.faq`/`data.sources` présents et bien typés.                                                                          |
| `astro.config.mjs#buildTranslationIndex`                  | Functional (build)             | Une paire FR/EN avec asymétrie FAQ → erreur build pointant les deux fichiers. Parité respectée → build vert.                                                                                                                                                                                            |
| `src/layouts/ArticleLayout.astro` & `ProjectLayout.astro` | E2E manuel                     | Sur tous les articles + projets en FR et EN, vérifier visuellement : Résumé rendu (HTML marked), TOC inchangé, FAQ rendu (si présent), Sources rendues (si présent), JSON-LD `FAQPage` valide via [Schema.org validator](https://validator.schema.org/).                                                |
| `src/pages/llms-full.txt.ts` (FR + EN)                    | Inspection ciblée              | Vérifier dans `dist/llms-full.txt` que le préfixe `**Résumé.**` (FR) ou `**Summary.**` (EN) précède bien le contenu de `resume.mdx`. Snapshot diff non utilisé (cf. impacts transverses).                                                                                                               |

Pas de framework de tests installé pour l'instant — `npm test` n'existe pas dans `package.json`. Les tests unitaires des helpers peuvent être écrits avec le `node:test` natif (zero dep), exécutés via `node --test tests/`. À convenir au moment de l'étape 1.

## Risques et points d'attention

Tous mitigés ou levés pendant l'implémentation :

- **Compatibilité hot-reload** — résolu : le `digestSource` du loader inclut le contenu brut des 3 fichiers réservés. Modifier un `resume.mdx` en dev déclenche bien le re-render.
- **Erreur build cryptique en cas de YAML invalide** — résolu : helpers `parseFrontmatter` enveloppent l'appel `yaml.parse` dans un try/catch et lèvent un message qui inclut le chemin du fichier + le message d'origine en `cause`.
- **Validation parité au mauvais endroit** — résolu : check fait dans `buildTranslationIndex` directement (qui voit déjà tous les frontmatters), pas besoin d'integration hook. Lecture de la présence physique de `faq.mdx` / `sources.mdx` via `existsSync` sur le dossier de chaque entrée.
- **Régression sur `excerpt` vs `tldr`** — vérifié : `grep -rn "data\.tldr\|\.tldr"` après migration → seul `src/utils/schema.ts:300` reste (`abstract: p.tldr` côté générateur JSON-LD, où le paramètre interne s'appelle toujours `tldr` mais reçoit désormais `data.resume.plain`).
- **Rendu `marked` côté SSR** — respecté : `marked.parse` est appelé uniquement dans `seo-sections.ts` (côté Node, au build). Aucun appel runtime côté client.

## Questions ouvertes

Toutes tranchées pendant l'implémentation :

- **Renommer `tldrLabel` ?** → Supprimé complètement (devenu mort post-bascule). Nouvelles clés `summaryLabel`/`summaryAria`/`sourcesTitle` créées.
- **Body MDX libre dans `faq.mdx` / `sources.mdx`** → Ignoré par le loader (frontmatter seul). Restera simple tant qu'aucun cas d'usage ne le demande. Documenté en commentaire dans `seo-sections.ts`.
- **Convention de troncature meta description** → Implémentée dans `src/utils/meta.ts` (`truncateForMeta(text, maxLen=160)`) : coupure au dernier espace dans la moitié supérieure du budget, ellipse `…`, nettoyage des ponctuations finales. Appelée côté layout (`metaDescription = truncateForMeta(data.resume.plain)`).
- **Test framework** → `node:test` natif Node 25 (`--experimental-strip-types`). Zéro dep ajoutée pour les tests.
- **Stratégie de commits de migration** → Big-bang dans un commit unique `fb6b1df`. Git diff parle pour la migration ; les articles n'étaient pas encore publiés / nombreux.

---

## Changelog

| Date       | Type                     | Description                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-29 | Sync post-implémentation | Étapes ST5 + ST6 fusionnées (transition Zod impossible incrémentale). ST8 (snapshots) supprimée (inadapté à une migration big-bang). Ajout `discoverSectionFiles`, `src/utils/meta.ts`, suppression de `<Callout>`. Précisions sur le rôle de `excerpt` vs `resume.plain` (meta description désormais alimentée par `truncateForMeta(resume.plain)`). Toutes les questions ouvertes tranchées. Risques mitigés ou levés. |
