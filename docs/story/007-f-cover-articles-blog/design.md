# Design — Cover image obligatoire pour les articles de blog

> Feature spec : `docs/story/007-f-cover-articles-blog/feature.md`
> Stack : Astro 6 SSG bilingue (TS + Tailwind 4)

## Approche retenue

Champ `cover` rendu **optionnel** dans le schéma de la collection `blog` (typé en `ImageMetadata` via le helper `image()` d'Astro), assorti d'un `superRefine` qui exige soit une `cover` locale, soit un `translationOf` pointant vers une entrée qui en porte une. Forme `schema: ({ image }) => z.object(...)` requise par le helper `image()`. Source co-localisée avec l'entrée sous `src/content/blog/<slug>/cover.<ext>` — cohérent avec la forme dossier déjà adoptée (chapitres + sections SEO `resume.mdx` / `faq.mdx` / `sources.mdx`). Le `chapteredGlob` filtre par extension `.md/.mdx` pour l'agrégation MDX, et copie séparément les assets co-localisés (`.png` / `.webp` / etc.) à côté du fichier matérialisé pour que `image()` résolve `./cover.<ext>` correctement.

**Ratio source : 16:9** (≥ 1600×900 px). Cohérent avec le ratio des covers projects, économise un design par emplacement et évite tout crop/`object-position`. Format `.png` ou `.webp` au choix de l'auteur ; Astro régénère AVIF+WebP optimisés à la sortie quel que soit le source.

Le rendu éditorial passe par un **composant unique** `<ArticleCard>` à trois variantes (`lg`, `md`, `sm`) consommé par les emplacements (header de l'article + cartes archive / related + home blog si activé). Layout commun : **cover 16:9 full-width au-dessus du titre/meta/excerpt**. Mutualise le `<Picture>` AVIF+WebP, le calcul de `alt`, le mode `loading`/`fetchpriority`, et garantit la cohérence visuelle. Une prop `showCover?: boolean` (défaut `true`) permet de désactiver le rendu de la `<Picture>` ponctuellement, par exemple pour conserver une liste texte-only en home blog.

L'OG image est dérivée au build via `getImage({ src: cover, width: 1200, format: 'png' })` — **largeur seule imposée**, hauteur calculée par sharp depuis le ratio source. Pour une source 16:9, on obtient 1200×675, qui alimente les meta `og:image` / `twitter:image` (avec `og:image:width` / `og:image:height` exposés via `BaseLayout`) et le JSON-LD `BlogPosting.image`. Le ratio source est préservé partout (header, cartes, OG) — aucune distortion possible.

L'héritage FR↔EN est centralisé dans un helper `getCover(entry)` qui résout via `translationOf` quand l'entrée n'a pas de cover propre. Côté schéma, `cover` reste obligatoire sur les deux langues, mais en pratique l'entrée EN référence la même image source que sa contrepartie FR (la cover EN d'un article = chemin vers `src/content/blog/<slug-fr>/cover.<ext>`). Une seule image à produire par paire bilingue.

**Alternatives écartées** :

- `cover: z.string()` (chemin sous `/public/`) comme pour les projects : exclu pour bénéficier de l'optimisation `<Image>` / `<Picture>` (impossible depuis `/public/`) et du typage `ImageMetadata`.
- Stockage sous `src/assets/blog/<slug>/` (séparation contenu/binaire) : exclu au profit de la co-localisation déjà en place pour le reste des assets éditoriaux du dossier article.
- **Cover 1:1 carrée** initialement prévue dans `feature.md` règle 3 + design : remplacée par 16:9 paysage. Raisons : (1) cohérence avec le ratio des covers projects et avec la majorité des sources d'images éditoriales (illustrations LLM, screenshots), (2) un seul rendu partout (header + cartes + OG) sans avoir à gérer un crop visuel par emplacement, (3) ratio plus naturel pour les vignettes OG paysage attendues par LinkedIn/X.
- **Layout header « row vignette + texte »** initialement prévu : remplacé par cover 16/9 full-width au-dessus du titre. Évite le crop visuel d'une image source en vignette carrée.
- `cover` strictement obligatoire (zod `image()` non-optionnel) : remplacé par `image().optional()` + `superRefine` (cover OR translationOf). Permet à une entrée EN d'hériter de la cover FR sans fichier dupliqué. Si les deux entrées d'une paire FR/EN portent leur propre `cover`, c'est valide aussi (deux fichiers, deux images).
- `coverAlt` obligatoire : remplacé par optionnel ; fallback `''` (image décorative) plutôt que `data.title` pour éviter que les lecteurs d'écran annoncent le titre deux fois (image puis h1/h2/h3 voisin). L'auteur peut déclarer un `coverAlt` descriptif si l'image porte une information non redondante avec le titre.
- WebP seul : remplacé par AVIF+WebP via `<Picture>` (gain perf perceptible sur les vignettes répétées en grille).
- `getImage({ width: 1200, height: 1200 })` (carré forcé) : exclu — sharp distord les sources non-carrées. Remplacé par `getImage({ width: 1200 })` qui préserve le ratio source.

## Entités et modèle de données

Schéma `blog` (`src/content.config.ts`) — passage à la forme fonction pour accéder au helper `image()`. Champs ajoutés / retirés :

| Champ | Type | Statut |
|---|---|---|
| `cover` | `image().optional()` (Astro → `ImageMetadata`) | **ajouté**, optionnel + `superRefine` (cover OR translationOf) |
| `coverAlt` | `z.string().min(3).optional()` | **ajouté, optionnel** (fallback `''` au rendu — image décorative) |
| `ogImage` | `z.string().optional()` | **retiré** |

Schéma `projects` inchangé (le champ `cover: z.string().optional()` du côté projects reste hors scope, cf. `feature.md` — Hors scope).

Forme finale du schéma blog :

```ts
const blog = defineCollection({
  loader: chapteredGlob({ base: './src/content/blog', extensions: ['.mdx', '.md'] }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      excerpt: z.string().min(80).max(220),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      category: categoryEnum,
      tags: z.array(z.string()).default([]),
      readingTime: z.number().int().positive().optional(),
      cover: image().optional(),
      coverAlt: z.string().min(3).optional(),
      draft: z.boolean().default(false),
      keywords: z.array(z.string()).default([]),
      resume: resumeSchema,
      faq: z.array(faqItem).default([]),
      sources: z.array(sourceItem).default([]),
      number: z.number().int().positive(),
      lang: langEnum.default('fr'),
      translationOf: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.cover && !data.translationOf) {
        ctx.addIssue({
          code: 'custom',
          path: ['cover'],
          message:
            'cover required (or translationOf to inherit cover from another entry)',
        });
      }
    }),
});
```

Les frontmatters référencent leur cover via un chemin **relatif à l'index** (ex. `cover: ./cover.png`) — convention requise par `image()` Astro. Une entrée EN qui n'a pas de fichier cover propre laisse le champ vide et déclare `translationOf: '<slug-fr>'` ; le helper `getCover` résout au rendu.

## Mécanismes Astro mobilisés

- **`image()` helper du schéma de collection** — typage natif `ImageMetadata`, validation au build de l'existence du fichier, accès aux dimensions pour `<Image>` / `<Picture>`.
- **`<Picture>` (`astro:assets`)** — rend un `<picture>` avec `<source>` AVIF + WebP, `srcset` aux `widths` configurées, `width`/`height` posés pour CLS = 0.
- **`getImage()` (`astro:assets`)** — dérive au build une variante PNG `width: 1200` (hauteur calculée depuis le ratio source — typiquement 675 pour du 16:9), dont le `src` (URL absolue après `new URL(..., SITE.url)`) alimente les meta OG et le JSON-LD. **Pas de `height` forcé** : éviter toute distortion sharp sur sources non-1:1.
- **Schéma fonctionnel** (`schema: ({ image }) => z.object(...)`) — seul moyen d'accéder à `image()` dans une collection. Le reste du schéma (resume, faq, sources, etc.) reste structurellement identique.
- **Loader `chapteredGlob` patché** (`src/content-loaders/chaptered-glob.ts:44-52,403-407`) — copie les assets co-localisés (`.png` / `.webp` / `.avif` / `.jpg` / `.jpeg` / `.gif` / `.svg`) à côté du fichier matérialisé sous `.astro/chaptered/<collection>/<dirname>/`, pour que `image()` résolve `./cover.<ext>` correctement.

## Fichiers à créer

| Fichier | Rôle |
|---|---|
| `src/components/ui/ArticleCard.astro` | Composant unique cover 16:9 full-width au-dessus du bloc texte, props `(entry, variant: 'lg' \| 'md' \| 'sm', lang, loading?: 'eager' \| 'lazy', fetchpriority?: 'high' \| 'auto', showCover?: boolean = true)`. Résout cover/alt via `getCover(entry)`. Rendu `<Picture>` AVIF+WebP. |
| `src/utils/article-cover.ts` | `getCover(entry)` (résout l'héritage `translationOf` et expose `{ cover: ImageMetadata, alt: string }`, fallback `alt = ''` quand pas de `coverAlt`) ; `getOgImage(entry)` (appelle `getImage({ width: 1200 })`, retourne `{ url, width, height }` avec dimensions effectives propagées au JSON-LD et aux meta `og:image:width` / `og:image:height`). |
| `src/content/blog/<slug>/cover.<png\|webp>` | Backfill cover par article ou par paire bilingue. Le partage FR/EN n'est plus imposé : si l'auteur préfère deux images distinctes, il les déclare ; sinon il déclare seulement la cover FR et laisse l'EN hériter via `translationOf`. |

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `src/content.config.ts` | Schéma blog en forme `({ image }) => z.object(...)`. Ajout `cover: image().optional()`, `coverAlt: z.string().min(3).optional()`, `superRefine` (cover OR translationOf). Retrait de `ogImage`. |
| `src/layouts/ArticleLayout.astro` | Remplacer la prop `image: data.ogImage` par les valeurs produites par `getOgImage(post)` → `image={ogImage.url}`, `imageWidth={ogImage.width}`, `imageHeight={ogImage.height}`. Mêmes valeurs propagées à `blogPostingSchema`. Header : insérer `<ArticleCard variant="lg" entry={post} lang={lang} loading="eager" />` qui rend le H1, l'eyebrow et la cover. |
| `src/utils/schema.ts` | `BlogPostingInput` accepte `imageWidth?` / `imageHeight?` (défauts 1200 / 630). Supprimer le fallback `SITE.ogImage` côté `blogPostingSchema` (chaque article aura sa cover ou héritera). Le JSON-LD reflète la dimension réelle servie. |
| `src/layouts/BaseLayout.astro` | Props `imageWidth?` / `imageHeight?` (défauts 1200 / 630) propagées aux meta `og:image:width` / `og:image:height`. |
| `src/components/pages/BlogArchive.astro` | Items archive rendus via `<ArticleCard variant="sm" entry={post} lang={lang} />`. Le premier item porte `loading="eager" fetchpriority="high"` pour LCP. |
| `src/components/home/BlogSection.astro` | Items rendus via `<ArticleCard variant="sm" entry={post} lang={lang} showCover={false} />`. La home blog reste **liste texte-only volontairement** pour préserver la sobriété de la home (la cover ressort dès que l'utilisateur clique vers `/blog/`). Conserver le `<SectionHead>` et la `<figure>` code-block en bas. |
| `src/components/ui/RelatedItems.astro` | Branche `kind === 'blog'` rend `<ArticleCard variant="sm" entry={item} lang={lang} />`. Branche `kind === 'project'` inchangée. |
| `src/content/blog/<slug>/index.mdx` | Frontmatter : ajouter `cover: ./cover.<ext>` (relatif) ou laisser vide si on s'appuie sur `translationOf`. Ajouter `coverAlt: '...'` optionnel uniquement si l'image porte une info non redondante avec le titre. Retirer `ogImage` si présent. |
| `DEVELOPMENT.md` | Section "Ajouter un article" : documenter la règle (source 16:9 ≥ 1600×900 px, PNG ou WebP, chemin relatif `./cover.<ext>`, exemple de frontmatter, mécanisme `translationOf` pour partager une cover EN↔FR). |

## Impacts transverses

- **i18n / traduction** — la cover peut être partagée entre la paire FR/EN via `translationOf` (entrée EN sans cover propre → résolution sur la cover FR). Le helper `getCover(entry)` opère ce fallback. Le `coverAlt` est déclaré indépendamment par langue dans chaque frontmatter (traduction libre).
- **SEO / partage social** — `og:image` et `twitter:image` (`BaseLayout.astro`) pointent vers la variante PNG `width: 1200` dérivée par `getImage()` (hauteur calculée selon le ratio source — 675 pour du 16:9). JSON-LD `BlogPosting.image` reflète les mêmes dimensions effectives via `imageWidth` / `imageHeight` propagés depuis `getOgImage`.
- **Perf** — LCP : sur la page article, la cover en variant `lg` peut devenir le LCP (chargée en `loading="eager"`). Sur `/blog/`, le premier item de la liste est marqué `loading="eager"` + `fetchpriority="high"`. CLS : `<Picture>` Astro pose `width`/`height`, donc 0 layout shift attendu.
- **A11y** — `alt = data.coverAlt ?? ''`. Sans `coverAlt` explicite, l'image est traitée comme **décorative** (alt vide) puisque le titre est rendu en h1/h2/h3 immédiatement à côté du `<Picture>`. Évite le doublon TalkBack/VoiceOver. À tester via `pa11y-ci` sur `/blog/`, une page article et la home.
- **Migration de données** — retrait global de `ogImage` (schéma + 3 consommateurs + frontmatters existants) ; backfill de covers par article publié. Les paires FR/EN peuvent partager une seule image via `translationOf` ou en porter deux distinctes selon le choix éditorial.
- **Build** — `superRefine` valide qu'une cover est résolvable (locale ou héritée) ; un article sans `cover` et sans `translationOf` casse `npm run build` avec un message Zod clair.
- Multi-channel / multi-tenant / multi-thème / API / permissions / emails : non pertinents (cf. `feature.md`).

## Ordre d'implémentation

1. [x] **Backfill assets** — produire les images 16:9 (≥ 1600×900 px) sous `src/content/blog/<slug>/cover.<png|webp>`. Le partage FR/EN n'est pas imposé : l'auteur peut soit déclarer une cover par langue, soit n'en mettre qu'une côté FR et laisser l'EN hériter via `translationOf`.
2. [x] **Schéma + helpers** — passer `src/content.config.ts` en forme fonctionnelle, ajouter `cover: image().optional()` + `coverAlt` + `superRefine` (cover OR translationOf), retirer `ogImage`. Créer `src/utils/article-cover.ts` (`getCover` avec fallback `alt = ''`, `getOgImage` retournant `{ url, width, height }`). Mettre à jour les frontmatters concernés.
3. [x] **Loader assets co-localisés** — étendre `chapteredGlob` pour copier les fichiers image (`.png`/`.webp`/...) à côté du fichier matérialisé sous `.astro/chaptered/<collection>/<slug>/`, afin que `image()` Astro résolve `./cover.<ext>`.
4. [x] **Composant `<ArticleCard>`** — créer le composant avec ses 3 variantes (`lg`/`md`/`sm`), cover 16:9 full-width au-dessus du texte, `<Picture>` AVIF+WebP, lien `<a>` interne pour `md`/`sm`, prop `showCover` pour désactiver ponctuellement.
5. [x] **Migration cartes blog** — `BlogArchive` (variant `sm`, premier item `eager` + `fetchpriority="high"`), `RelatedItems` (branche blog → variant `sm`), `BlogSection` home (variant `sm` + `showCover={false}` pour préserver la liste texte-only).
6. [x] **Header de l'article** — remplacer le bloc `<header>` de `ArticleLayout.astro` par `<ArticleCard variant="lg" entry={post} lang={lang} loading="eager" />`. Le composant rend lui-même le `<h1>`, l'eyebrow et la cover.
7. [x] **Migration OG / JSON-LD** — `ArticleLayout.astro` calcule `const ogImage = await getOgImage(post)` et propage `{ url, width, height }` à `SiteLayout` et `blogPostingSchema`. `BaseLayout` accepte `imageWidth` / `imageHeight` pour les meta `og:image:width` / `og:image:height`. `schema.ts` reflète les dimensions effectives.
8. [x] **Retrait définitif de `ogImage`** — vérifié sur `grep -rn ogImage src/` (seul `SITE.ogImage` site-wide subsiste comme fallback non-article).
9. [ ] **QA** — `npm run build`, `astro check`, `pa11y-ci`, `lhci autorun`, snapshot diff via `scripts/snapshot-build.mjs` (avant/après) pour vérifier qu'aucune page non-blog n'a bougé. Validation manuelle des vignettes OG sur LinkedIn / X cards pour au moins un article.
10. [ ] **Doc** — mettre à jour `DEVELOPMENT.md` avec la règle cover (16:9, chemin relatif, exemple frontmatter).

## Stratégie de test

| Code | Type de test | Ce qu'on vérifie |
|---|---|---|
| `src/content.config.ts` (schéma) | Build (`npm run build`) | Article sans `cover` ni `translationOf` → build casse avec le message `superRefine` clair. Cover avec chemin invalide → build casse à la résolution `image()`. |
| `src/utils/article-cover.ts` | Manuel via build complet | Entrée EN sans cover propre hérite de la FR via `translationOf` (à vérifier sur la paire `building-this-site-with-claude-and-astro` ↔ `construire-ce-site-avec-claude-et-astro` lorsqu'on retire la cover EN). |
| `src/components/ui/ArticleCard.astro` | Visuel + `pa11y-ci` | Les 3 variantes rendent bien ; `<img>` final porte `alt=""` quand pas de `coverAlt` (image décorative — le titre suit en h1/h2/h3) ; pas de warning `pa11y`. |
| `src/utils/schema.ts` (`blogPostingSchema`) | Inspection HTML du build | JSON-LD `image.url` pointe vers le PNG `width: 1200` dérivé ; `width`/`height` reflètent le ratio source effectif (ex. 1200×675 pour 16:9). |
| Pages article + `/blog/` + `/` | `lhci autorun` | Performance ≥ 0.95, A11y = 1.0, SEO = 1.0, CLS = 0 — pas de régression vs baseline. |
| Build complet | `scripts/snapshot-build.mjs before/after` + `diff-snapshot.mjs` | Aucun changement non-intentionnel hors fichiers blog (sitemap `lastmod` masqué). |
| Meta OG | Manuel via LinkedIn Post Inspector + X Cards Validator | Au moins un article FR et un article EN affichent une vignette 1200×675 propre, ratio préservé. |

Pas de test unitaire formel introduit (le projet n'a pas de runner) — la couverture repose sur le build, `astro check`, `pa11y-ci`, `lhci`, et le snapshot diff.

## Risques et points d'attention

- **Temps de build** — la génération AVIF par `sharp` est plus lente que WebP seul. Si le build dépasse les budgets CI Cloudflare Pages, fallback WebP seul (modifier `<Picture>` → `<Image>`).
- **URL OG stable côté Cloudflare Pages** — `getImage()` produit un fichier dans `dist/_astro/...` avec un hash de contenu. L'URL change à chaque édition de la cover (cache busting OG côté LinkedIn ≈ 7 jours). Pas un blocker.
- **Cache loader sur édition d'asset** — le `chapteredGlob` ne ré-hashe pas les assets co-localisés dans son `digestSource` ; remplacer un `cover.png` sans toucher à `index.mdx` peut laisser une copie matérialisée stale dans `.astro/chaptered/`. Workaround : `rm -rf .astro && npm run build` après remplacement d'asset, ou inclure les hashes des assets co-localisés dans le digest si le cas se reproduit.
- **LCP du premier item `/blog/`** — devient candidate au LCP. `loading="eager"` + `fetchpriority="high"` uniquement sur le premier ; tout le reste en `loading="lazy"`. À vérifier dans le rapport `lhci`.
- **CLS sur mobile** — `<Picture>` Astro pose `width`/`height`, donc 0 layout shift attendu. Tester sur viewport étroit.
- **Source PNG ~1 MB** — taille des fichiers checked-in non négligeable (~4 MB cumulés sur 4 covers). Astro régénère AVIF/WebP optimisés à la sortie (~12-30 KB). Si le poids du repo devient un sujet, convertir les sources en WebP avant commit.
- **Cover ProjectLayout** — l'ajout de la cover 16/9 dans `ProjectLayout.astro` est hors scope explicite de cette story (`feature.md` / Hors scope). Soit on retire la modif et on ouvre une story distincte « cover dans le header projects », soit on l'intègre formellement à la présente story (mise à jour Hors scope + critère d'acceptation).

## Questions ouvertes

- **Cover home blog** — la décision actuelle est de **garder la liste texte-only** sur la home (`showCover={false}` dans `BlogSection`) pour préserver la sobriété de la home. Critère d'acceptation `feature.md` ajusté en conséquence (« sauf décision produit explicite contraire documentée »). À reconfirmer si le rendu home évolue.
- **`coverAlt` rétroactif** — choix éditorial : déclarer un `coverAlt` descriptif quand l'image porte une info supplémentaire (capture d'écran annotée, schéma) ; sinon laisser vide (image décorative, le titre voisin tient le rôle).
- **Loader assets co-localisés et digest** — si on observe en pratique des covers stale après remplacement d'asset, étendre le `digestSource` du loader pour inclure les hash des assets co-localisés (cf. risque ci-dessus).
