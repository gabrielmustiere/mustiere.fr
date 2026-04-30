# Cover image obligatoire pour les articles de blog

> Chaque article de blog porte une image carrée obligatoire, déclinée dans les cartes, le header de la page article et les meta OG/Twitter — comme les side-projects ont leur visuel.

## Contexte

Aujourd'hui, les articles de blog (`src/content/blog/`) n'ont aucun visuel propre :

- Le `ArticleLayout` ne rend aucun bandeau hero ; le header est purement textuel.
- Les cartes des listes `/blog/` (FR + EN) sont également texte-only.
- Le seul champ image existant, `ogImage` (optionnel), n'est utilisé que pour les meta OG/Twitter et n'est pas exploité éditorialement.

Les **side-projects** ont eux un champ `cover` (chemin sous `/public/images/projects/`) affiché en `aspect-[21/9]` sur la home et utilisé comme image OG dans le `ProjectLayout`. Le déséquilibre visuel est marqué : les projets ont une identité graphique forte, les articles non.

L'objectif est de doter chaque article d'une cover obligatoire et de l'exploiter à tous les endroits où l'article apparaît, en garantissant la performance et l'accessibilité du site.

## Utilisateurs concernés

- **Lecteur (visiteur)** : voit la cover dans les cartes (liste blog, home, RelatedItems), dans le header de l'article, et lors d'un partage sur les réseaux sociaux (vignette OG).
- **Auteur (Gabriel)** : produit une image carrée par article (ou par paire FR/EN), la place dans le projet, déclare son chemin et son alt dans le frontmatter de l'entrée FR.
- Pas de rôle admin distinct, pas de permissions à gérer (site statique mono-tenant).

## User Stories

- En tant que **lecteur**, je veux voir un visuel pour chaque article dans la liste `/blog/` afin de scanner et choisir plus rapidement ce qui m'intéresse.
- En tant que **lecteur**, je veux qu'un article partagé sur LinkedIn ou X affiche une vignette propre afin de comprendre le sujet avant de cliquer.
- En tant que **lecteur**, je veux voir la cover dans le header de l'article afin d'avoir un repère visuel et un effet d'identité éditoriale.
- En tant qu'**auteur**, je veux que le build échoue si j'oublie la cover d'un nouvel article afin de ne jamais publier un article incomplet par accident.
- En tant qu'**auteur**, je veux que la version EN d'un article hérite automatiquement de la cover de la version FR afin de ne produire qu'une seule image par paire d'articles.
- En tant qu'**auteur** ou **lecteur**, je veux que l'ajout des covers ne dégrade pas les budgets perf/SEO afin que le site reste rapide et bien classé.

## Règles métier

1. **Champ obligatoire** : toute entrée de la collection `blog` (FR ou EN) doit avoir une cover. Le schéma Zod ne tolère pas l'absence — `npm run build` échoue sinon.
2. **Source unique** : un seul champ `cover` sert à la fois l'affichage éditorial (cartes + header) et les meta OG/Twitter. Le champ `ogImage` actuel est supprimé du schéma blog.
3. **Format source** : image en ratio 16:9 (≥ 1600×900 px). Format paysage, mêmes proportions partout (header, cartes, OG) — pas de crop ni de recadrage par emplacement.
4. **Texte alternatif** : un `coverAlt` est associé à chaque cover. Statut (champ obligatoire dédié vs dérivé du `title`) à trancher dans `/feature-design`.
5. **Bilingue automatique** : la version EN d'un article hérite de la cover de la version FR via `translationOf`. Si l'article EN ne déclare pas de cover, on lit celle de l'entrée FR pointée. Une seule image à produire par paire d'articles.
6. **Optimisation responsive** : l'affichage utilise `<picture>` avec sources multiples (formats modernes — WebP/AVIF — et tailles adaptées au breakpoint). En pratique, `<Image />` Astro, ce qui impose que le fichier vive sous `src/` et non sous `/public/`.
7. **Aucune régression perf** : LCP et CLS des pages article et `/blog/` doivent rester dans les budgets Lighthouse actuels. La cover doit charger sans bloquer le LCP textuel ni générer de layout shift.

## Critères d'acceptation

- [ ] Le schéma Zod de la collection `blog` (`src/content.config.ts`) déclare `cover` non-optionnel et un `coverAlt` (forme finale décidée en design).
- [ ] Le champ `ogImage` est retiré du schéma blog ; tous ses usages migrent vers `cover` (`ArticleLayout.astro`, `src/utils/schema.ts` JSON-LD `BlogPosting`).
- [ ] `npm run build` casse explicitement avec un message Zod clair si un article n'a pas de cover.
- [ ] La cover apparaît dans : la grille `/blog/` (FR + EN), le header de la page article (cover 16:9 full-width au-dessus du titre/meta/excerpt), la section "articles récents" de la home (FR + EN — sauf décision produit explicite contraire documentée ici), le bloc `RelatedItems` en bas d'article.
- [ ] Les meta `og:image` et `twitter:image` de chaque article pointent vers la cover (vérifié sur les validators LinkedIn et X cards pour au moins un article).
- [ ] La version EN d'un article rend la cover de son pendant FR sans nécessiter de duplication de fichier.
- [ ] Toute cover affichée porte un `alt` non vide ; `pa11y-ci` passe sans warning sur `/blog/`, une page d'article et la home.
- [ ] Lighthouse CI : aucune régression sur les scores Performance et SEO de `/`, `/blog/`, `/blog/<un-article>/` ; CLS reste à 0 sur ces pages.
- [ ] Backfill effectué : les articles `php-2026-cto-considerer` (FR + EN) et `building-this-site-with-claude-and-astro` / `construire-ce-site-avec-claude-et-astro` portent une cover. Soit ~2 images sources distinctes (une par paire bilingue).
- [ ] Le rendu responsive `<picture>` sert au moins WebP + un fallback, avec des `srcset` adaptés aux tailles d'affichage des cartes et du header.

## Hors scope

- **Génération automatique de cover** (IA, OG dynamique au build, templates SVG textuels). On reste sur des images produites manuellement par l'auteur.
- **Image OG distincte du cover éditorial**. Un seul fichier sert les deux usages — choix assumé pour rester simple.
- **Image différente FR vs EN**. L'héritage est imposé : pas de champ override par langue. Si un jour un article a besoin d'une image localisée, ça fera l'objet d'une feature distincte.
- **Multi-thème, multi-channel, multi-tenant, API, permissions admin, emails / notifications, voters** : non pertinents (site statique mono-tenant sans back-office, sans API exposée).
- **Refonte du `cover` des projets** : on ne touche pas au champ ni au pattern de stockage des side-projects (`/public/images/projects/`) dans le cadre de cette feature. Une éventuelle harmonisation viendrait dans une autre story.
- **Migration des données existantes au-delà des 3 articles publiés** : il n'y a pas d'archive plus large à backfiller.

## Impacts transverses

- **Multi-channel / multi-tenant** : non pertinent (site mono-tenant).
- **Multi-thème** : non pertinent (un seul thème).
- **i18n / traduction** : la cover est partagée FR/EN par paire via `translationOf`. Le `coverAlt` doit pouvoir être traduit indépendamment (forme exacte à trancher en design — par défaut une chaîne par entrée).
- **API** : aucune ressource API exposée, aucun impact.
- **Permissions** : non pertinent.
- **Emails / notifications** : non pertinent.
- **SEO / partage social** : `og:image`, `twitter:image`, JSON-LD `BlogPosting.image` doivent tous pointer sur la cover.
- **Perf** : optimisation `<picture>` obligatoire, surveillance Lighthouse CI / budgets sur LCP et CLS, lazy-loading approprié sur les cartes hors-vue.
- **Migration de données** : retrait du champ `ogImage` et nettoyage de ses usages dans le code ; backfill des covers pour les 3 articles publiés (≈ 2 images uniques compte tenu du partage FR/EN).

## Notes pour le design technique

Pistes brutes à creuser dans `/feature-design`, **sans concevoir ici** :

- **Emplacement du fichier source** : choix entre `src/content/blog/<slug>/cover.<ext>` (co-localisation avec l'article et ses chapitres — cohérent avec la forme dossier déjà en place) et `src/assets/blog/<slug>/cover.<ext>` (séparation contenu/assets). Le `chapteredGlob` doit ignorer ce fichier (extensions limitées à `.md`/`.mdx`, donc à vérifier).
- **Schéma Zod** : `cover: z.string()` ou un objet `{ src, alt }` ? Si `<Image />` Astro est utilisé, le type natif `ImageMetadata` (via `image()` helper du schéma Astro) est plus adapté.
- **`coverAlt`** : champ dédié obligatoire vs fallback automatique sur le `title` ? Trancher en pesant la rigueur a11y vs l'overhead éditorial.
- **Migration `ogImage`** : retirer du schéma `blog` (`src/content.config.ts:47`), retirer des usages (`src/layouts/ArticleLayout.astro:78,105`, `src/utils/schema.ts:291,343`). Vérifier que rien d'autre ne le lit. Le `SITE.ogImage` global (`src/consts.ts:21`) reste — c'est la valeur fallback site-wide, indépendante des articles.
- **Composants à toucher** : nouveau composant `<ArticleCover />` (ou similaire) à utiliser dans : la grille `/blog/` et `/en/blog/`, le `RelatedItems`, la section "articles récents" du `HomePage.astro`, et le `ArticleLayout` (header). À factoriser pour éviter 4 implémentations divergentes.
- **Header bandeau** : la cover carrée affichée en bandeau implique un crop visuel (probablement via `aspect-[21/9]` ou `aspect-[2/1]` + `object-fit: cover`). À cadrer pendant le design pour éviter de couper le sujet de l'image. Possiblement un `object-position` paramétrable au cas par cas via le frontmatter.
- **Cartes blog vs cartes projets** : aujourd'hui les projets utilisent `aspect-[21/9]`. Pour les cartes blog, le user a indiqué privilégier le 1:1 source pour faciliter le resize. Décider en design si on rend les cartes blog en 1:1 (cohérence du source) ou en 21/9 (cohérence avec les projets) ; ça impacte le grid CSS.
- **Optimisation `<Image />` Astro** : nécessite un fichier dans `src/`. Vérifier le format de retour (`ImageMetadata`), les `widths` à servir, et la configuration `image.service` dans `astro.config.mjs`.
- **Fallback héritage EN → FR** : la résolution se fait probablement au moment du `getEntry`/`getCollection` côté pages dynamiques EN, ou directement dans un helper du schéma. Voir où placer la logique pour qu'elle soit unique et testable.
- **Backfill** : produire 2 images carrées (php-2026-cto-considerer + building-this-site/construire-ce-site). Penser à une convention de nommage (`cover.webp` ?) et à la cohérence visuelle avec les couleurs d'accent par catégorie.

## Questions ouvertes

- **Format de stockage du `coverAlt`** : champ obligatoire dédié, ou dérivé automatiquement du `title` avec possibilité d'override ? Décider en design.
- **Recadrage du bandeau header** : faut-il un `object-position` ou un point focal paramétrable pour préserver le sujet d'une image carrée recadrée en paysage ? Ou on accepte le crop centré par défaut et on ajustera image par image en pratique ?
- **Ratio des cartes** : 1:1 (cohérent avec la source) ou 21/9 (cohérent avec les cartes projets actuelles) ? Décision visuelle à prendre en design en regardant le rendu des deux options sur la grille `/blog/`.
- **Format(s) servis** : WebP seul, AVIF + WebP, fallback PNG/JPEG ? À calibrer selon les capacités cibles et le poids résultant.
- **Lazy-loading** : `loading="lazy"` partout sauf header de l'article et carte au-dessus de la ligne de flottaison sur `/blog/` ?
- **Test OG** : qui valide les vignettes LinkedIn / X manuellement et à quelle fréquence (à chaque release ? à chaque nouvel article ?) ?
