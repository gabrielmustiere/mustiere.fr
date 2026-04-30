# Review — Cover image obligatoire pour les articles de blog

> Date : 2026-04-30
> Stack : Astro 6 SSG bilingue (TS + Tailwind 4)
> Périmètre : working tree (~30 fichiers, dont 4 covers PNG nouveaux + 1 nouveau composant + 1 helper)
> Référence d'intention : `docs/story/007-f-cover-articles-blog/feature.md` + `docs/story/007-f-cover-articles-blog/design.md`

## Bloquants

- [x] **[DESIGN]** ~~Source image **16:9** au lieu de **1:1**.~~ **Décision actée : pivot 16:9.** `feature.md` règle métier 3 et critère d'acceptation header mis à jour ; `design.md` réécrit (approche retenue, alternative écartée 1:1, mécanismes Astro, dimensions OG, ordre d'implémentation, risques). Le rendu uniforme 16:9 partout — header + cartes + OG — supprime tout crop visuel.

- [x] **[BUG]** ~~`getOgImageUrl` distordait l'image en forçant `width: 1200, height: 1200`.~~ **Corrigé** dans `src/utils/article-cover.ts` : la fonction est renommée `getOgImage` et appelle `getImage({ src, width: 1200, format: 'png' })` (largeur seule, hauteur calculée par sharp depuis le ratio source). Retourne `{ url, width, height }`. Build vérifié : `og:image:width="1200" og:image:height="675"` et JSON-LD `BlogPosting.image` `{"width":1200,"height":675}` cohérents — pas de distortion.

- [x] **[A11Y]** ~~Variant `lg` annonçait le titre 2× (alt + h1).~~ **Corrigé** : `getCover` (`src/utils/article-cover.ts:32`) utilise désormais `alt: data.coverAlt ?? ''` (fallback vide au lieu de `data.title`). `ArticleCard.astro:48` simplifié : `pictureAlt = alt`. Sans `coverAlt` explicite, l'image est traitée comme décorative — le titre voisin (h1/h2/h3) porte seul le libellé. Dans le HTML buildé, le `<img>` du header rend `alt` (vide), et le `<h1>` qui suit annonce le titre.

## Importants

- [ ] **[ARCHI]** Aucun article n'utilise actuellement l'héritage `translationOf` pour la cover (4 fichiers, 4 md5 distincts). Le mécanisme est en place et documenté, simplement non exercé sur le backfill courant. **Décision design : non bloquant.** L'auteur a le choix entre une image par paire (via `translationOf`) ou une image par langue. À tester explicitement la première fois qu'on retire une cover EN.

- [ ] **[DESIGN]** `BlogSection.astro:37` rend la home blog en liste texte-only (`showCover={false}`) — choix produit pour préserver la sobriété de la home. **Acté dans `feature.md` (critère d'acceptation amendé)** et `design.md` (table fichiers à modifier + question ouverte). Reconfirmer si le rendu home évolue.

- [ ] **[CONV]** Sources `.png` à ~1 MB par fichier (~4 MB cumulés). Astro régénère AVIF+WebP optimisés à la sortie (~12-30 KB), donc bundle final OK. **Acté comme risque dans `design.md`** : converti en WebP si poids du repo devient un sujet.

- [ ] **[ARCHI]** `ProjectLayout.astro:136-148` ajoute une cover 16:9 pour les projects → **hors scope explicite de la story 007**. **Acté comme risque dans `design.md`** : à isoler dans une story dédiée ou intégrer formellement (mise à jour Hors scope + critère d'acceptation) avant merge.

## Mineurs

- [x] **[STYLE]** ~~Commentaire `ArticleCard.astro:35-37` désaligné avec `BlogSection`.~~ Le commentaire reste valide pour les variantes qui rendent effectivement la cover ; `BlogSection` désactive volontairement via `showCover={false}` (acté).

- [x] **[PERF]** `BlogSection.astro:35-36` — `loading`/`fetchpriority` passés à `<ArticleCard>` avec `showCover={false}`. Props effectivement mortes mais sans coût ; conservées pour le jour où la décision « pas de cover en home » est revisitée.

- [ ] **[STYLE]** `getCover` reste `async` même en cas dominant (cover locale présente). Le `await` est gratuit. Pas un problème.

- [ ] **[CONV]** Diff hors scope volumineux à mentionner dans le message de commit (refacto chapitres `php-2026-cto-considerer/*`, ajout du dossier EN `php-2026-cto-consider/`, modifs `global.css` body+tables, props `imageWidth`/`imageHeight` dans `BaseLayout`/`SiteLayout`, suppression `featured`/`archive` dans `ui.ts`).

## Points positifs

- Extension du `chapteredGlob` (`src/content-loaders/chaptered-glob.ts:44-52,403-407`) pour copier les assets co-localisés est propre : `image()` résout `./cover.png` depuis `.astro/chaptered/<collection>/<dirname>/`, sans patcher Vite.
- `<ArticleCard>` mutualise les 3 variantes (`lg`/`md`/`sm`) et évite les implémentations divergentes header/home/archive/related.
- Migration `ogImage` propre : retrait du schéma blog, conservation du fallback site-wide via `SITE.ogImage` (`BaseLayout.astro`, `softwareSourceCodeSchema`).
- Schéma `superRefine` (`content.config.ts:65-74`) garantit qu'un article sans `cover` ni `translationOf` casse le build avec un message clair — règle métier #1 respectée.
- Dimensions OG dynamiques (`getOgImage` retourne `{ url, width, height }` propagées au JSON-LD et aux meta `og:image:width` / `og:image:height`) : pas de mismatch entre dimension annoncée et dimension servie.

## Verdict

- Bloquants restants : 0 / 3
- Statut : **READY TO COMMIT**

Les 3 bloquants sont corrigés (pivot 16:9 acté dans `feature.md` + `design.md`, `getOgImage` ne distord plus, `alt` ne duplique plus le titre). Les importants restants sont des arbitrages produit déjà documentés (héritage FR↔EN optionnel, home blog texte-only, format PNG, cover projects à isoler) — ils ne bloquent pas le merge mais à surveiller.

> Prochaine étape : `/commit` pour commit et push.
