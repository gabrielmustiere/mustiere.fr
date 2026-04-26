# Handoff — Portfolio Gabriel Mustiere

## Overview

Portfolio mono-page pour Gabriel Mustiere, CTO freelance basé à Nantes.
Le site comprend :

- **Page d'accueil** (`v3-quiet-nav.html`) — identité, parcours, extraits d'articles de blog, projets, contact, CV, avec une sidebar sticky contenant un index §01–§05 et un scroll-spy coloré.
- **Liste des articles de blog** (`blog.html`) — 12 articles avec filtres par catégorie (IA / Tech / Lead / Business), article mis en avant en tête.
- **Page d'article** (`article.html`) — lecture longue éditoriale avec barre de progression, drop cap, citations, blocs de code stylés, « à lire ensuite ».

Ton éditorial, minimaliste, typographie mixte (serif + sans + mono), palette beige + accents colorés sobres.

## About the Design Files

Les fichiers dans `designs/` sont des **références design réalisées en HTML pur + Tailwind CDN**. Ce ne sont **pas** du code de production à copier-coller. L'objectif est de **recréer fidèlement ces maquettes dans un projet Astro neuf** en utilisant les patterns idiomatiques Astro (composants `.astro`, content collections pour le blog, assets optimisés).

Le style Tailwind utilisé dans les maquettes est Tailwind v4 via CDN (`@tailwindcss/browser@4`) avec un bloc `@theme` custom. Dans Astro, il faudra installer l'intégration Tailwind officielle et déplacer les tokens dans `tailwind.config` ou un `global.css`.

## Fidelity

**High-fidelity.** Les maquettes sont pixel-perfect : couleurs, typographies, espacements, interactions sont finaux. À respecter strictement. Les seules libertés : optimisations techniques (chargement fonts, code-splitting, images responsives).

---

## Stack cible recommandée

- **Astro 4+** (SSG pur — pas d'islands React nécessaires ici)
- **Tailwind CSS v4** via `@astrojs/tailwind`
- **Content Collections** pour les articles de blog (markdown / MDX)
- **@fontsource** pour self-host les webfonts (meilleures perfs que Google Fonts CDN)
- **astro:assets** pour les images (quand le client fournira les visuels)

Structure de projet proposée :

```
src/
├── components/
│   ├── Sidebar.astro          # sidebar sticky de la page d'accueil
│   ├── TopNav.astro           # menu haut pour blog.html et article.html
│   ├── SectionHead.astro      # en-tête "§ 0X · Titre" coloré
│   ├── BlogListItem.astro
│   └── AccentLink.astro
├── layouts/
│   ├── BaseLayout.astro       # html/head/body + fonts + global.css
│   ├── HomeLayout.astro       # BaseLayout + Sidebar + scroll-spy
│   └── BlogLayout.astro       # BaseLayout + TopNav
├── content/
│   ├── config.ts              # collection schema
│   └── blog/
│       ├── evaluations-llm.md
│       └── ...
├── pages/
│   ├── index.astro            # recrée v3-quiet-nav.html
│   ├── blog/
│   │   ├── index.astro        # recrée blog.html
│   │   └── [slug].astro       # recrée article.html, rend un post
│   └── cv.pdf                 # fichier statique
├── styles/
│   └── global.css             # tokens @theme + accents oklch
└── public/
    └── fonts/                 # si fonts auto-hébergées
```

---

## Design Tokens

### Couleurs de base (beige + encre)

| Token                 | Hex       | Usage                               |
| --------------------- | --------- | ----------------------------------- |
| `--color-bg`          | `#fafaf7` | Fond principal                      |
| `--color-bg-2`        | `#f3f1ec` | Fond secondaire (code blocks)       |
| `--color-ink`         | `#181613` | Texte titres, principal             |
| `--color-ink-2`       | `#2a2622` | Texte corps                         |
| `--color-muted`       | `#6b655d` | Texte secondaire                    |
| _(inline)_            | `#8d8578` | Labels uppercase / metadata         |
| `--color-rule`        | `#e4dfd6` | Filets fins                         |
| `--color-rule-strong` | `#bdb6a8` | Filets forts (séparateurs sections) |

### Palette d'accents (un par section)

Définie en **oklch** pour une chromaticité et une luminosité uniformes. Ne pas convertir en hex — garder oklch.

| Token          | Valeur                 | Section               | Description |
| -------------- | ---------------------- | --------------------- | ----------- |
| `--a-about`    | `oklch(0.62 0.13 40)`  | § 01 Parcours         | Terre cuite |
| `--a-blog`     | `oklch(0.55 0.13 250)` | § 02 Articles de blog | Encre bleue |
| `--a-projects` | `oklch(0.55 0.10 145)` | § 03 Projets          | Vert sauge  |
| `--a-contact`  | `oklch(0.52 0.13 330)` | § 04 Contact          | Prune       |
| `--a-cv`       | `oklch(0.58 0.13 75)`  | § 05 CV               | Ocre        |

Classes utilitaires associées : `.acc-about`, `.acc-blog`, `.acc-projects`, `.acc-contact`, `.acc-cv` — chacune applique `color: var(--a-X)`.

Le pastille (dot) à gauche des titres de section : `.acc-dot` — 7px × 7px, rond, `background: currentColor`.

### Typographie

- **Serif (titres, emphases)** : `'Instrument Serif', Georgia, serif` — via Google Fonts `Instrument Serif:ital@0;1`
- **Body (texte courant)** : `'Inter', system-ui, sans-serif` — via Google Fonts `Inter:wght@300;400;500;600`
- **Mono (métadonnées, code, chiffres)** : `'JetBrains Mono', ui-monospace, monospace` — via Google Fonts `JetBrains Mono:wght@400;500`

Echelle de titres (page d'accueil, desktop) :

- H1 hero : `80px / 1.02 / -0.015em` (serif)
- H2 section : `36–56px / 1.05 / -0.01em` (serif)
- H3 item : `22px / 1.25 / -0.005em` (serif)
- Body : `15–17px / 1.55–1.75` (Inter)
- Labels uppercase : `10–11px / tracking .12em .14em` (Inter)
- Metadata tnum : utiliser `font-variant-numeric: tabular-nums`

Italique serif = `em` (pas `i`) — stylé via la variante italique d'Instrument Serif.

### Spacing & layout

- Largeur colonne principale : `max-width: 640px` (texte)
- Sidebar desktop : `width: 260px, border-right: 1px solid #bdb6a8`
- Grid page d'accueil : `grid-template-columns: 260px 1fr` à partir de `1024px`
- Padding colonne principale desktop : `pt-20 pb-28 px-10`
- Padding sidebar : `176px 32px 40px` (le `176px` top aligne la sidebar avec le H1 hero)
- Espacement entre sections : `mt-14 sm:mt-24`
- Filets : systématiquement `border-t border-[#e4dfd6]` (fins) ou `border-t border-[#bdb6a8]` (forts)

### Border radius

- Pilules (boutons, chips) : `border-radius: 999px`
- Code blocks : `6–8px`
- Pas d'autres arrondis.

### Souligné custom (`.link-u`)

Souligné animé avec `background-image: linear-gradient(currentColor, currentColor)` + `background-size: 100% 1px`. Au hover : `background-size: 0% 1px` + `background-position: 100% 100%` (le souligné se rétracte de droite à gauche).

### Highlight colorié (`.hl`)

Souligné 2px de la couleur courante (utilisé pour surligner des mots-clés dans le texte intro). Même technique que `.link-u` mais fixe.

---

## Screens / Views

### 1. Page d'accueil — `src/pages/index.astro` (d'après `v3-quiet-nav.html`)

**Layout desktop (≥1024px)** :

- Grid 2 colonnes : sidebar 260px + main fluide
- Sidebar : sticky, 100vh, padding-top 176px (pour aligner le bloc identité avec le H1 du main)

**Sidebar (desktop uniquement — cachée en mobile)** :

1. Petit label uppercase "Gabriel Mustiere"
2. Lien H-like en serif : `CTO / freelance` (freelance en italique terre cuite)
3. Paragraphe meta : "Tech · Business · IA. Nantes — remote."
4. Nav "Index" avec 5 liens :
   - `§01 Parcours` → `#about`
   - `§02 Articles de blog` → `#blog`
   - `§03 Projets` → `#projects`
   - `§04 Contact` → `#contact`
   - `§05 CV` → `#cv`
     Numéro en JetBrains Mono 10px, label en Inter 13px.
5. Bas de sidebar : `mt-auto`
   - Liens GitHub + LinkedIn (externes, `target="_blank"`)
   - Indicateur dispo (point vert + "Disponible Q3 2026")
   - Version "v. 2026.04 — Nantes"

**Main column (identique mobile/desktop)** :

- **Meta row** (mobile only, `.lg:hidden`) : `Gabriel Mustiere` / `2026 · Nantes`
- **Hero** :
  - H1 : `CTO & lead / <em class="acc-about">en freelance.</em>` — 48px mobile / 80px desktop
  - Paragraphe intro avec `.hl` colorés sur "architecture" (acc-about), "lead technique" (acc-blog), "IA" (acc-projects)
  - Row liens : `Me contacter · CV (PDF) · GitHub · LinkedIn` — tous en `.link-u`
- **Filet** `hr`
- **Sections §01 à §05** (voir ci-dessous) séparées par `border-t border-[#e4dfd6]` et `mt-14 sm:mt-24 pt-8`

Sections (toutes ont un en-tête `SectionHead` : `§ 0X · Titre` + sous-titre droit, couleur accent de la section) :

**§01 Parcours** — bio détaillée, liste stats "Expérience / Rôles / Basé à / Disponibilité" en `<ul>` avec filets.

**§02 Articles de blog** — 5 articles récents :

- Chaque item : date à gauche (acc-blog, font-mono, 11px, tracking .1em, width 80px), titre serif, temps de lecture
- Lien entier `<a href="/blog/[slug]">` avec `group-hover:text-[color:var(--a-blog)]`
- Sous la liste : lien "Voir tous les articles de blog →" (acc-blog)

**§03 Projets** — 3 items mission, même grille que les articles de blog.

**§04 Contact** — paragraphe + liste key-value (Email, LinkedIn, GitHub) en grid 2 colonnes.

**§05 CV** — titre + bouton télécharger pilule avec bordure `var(--a-cv)`.

**Footer** : `© 2026 Gabriel Mustiere` · `Fait main · Nantes`

### Scroll-spy (critique)

La sidebar `.idx-link` doit recevoir la classe `.is-active` quand la section correspondante est dans le viewport. Quand active :

- Le label gagne un dot à gauche (via `::before content: ""` avec `background: currentColor`)
- La couleur passe à la teinte d'accent de la section

Implémentation recommandée en Astro :

```astro
<!-- src/components/Sidebar.astro : script inline en bas -->
<script>
  const links = document.querySelectorAll('.idx-link[data-key]');
  const sections = ['about', 'blog', 'projects', 'contact', 'cv']
    .map((k) => document.getElementById(k))
    .filter(Boolean);

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const key = visible[0].target.id;
      links.forEach((a) =>
        a.classList.toggle('is-active', a.dataset.key === key)
      );
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] }
  );

  sections.forEach((s) => io.observe(s));
</script>
```

### 2. Liste des articles de blog — `src/pages/blog/index.astro` (d'après `blog.html`)

- **Top nav** commune (TopNav.astro) : brand à gauche, liens `À propos · Articles de blog · Projets · Contact · GitHub · LinkedIn` à droite
- **En-tête** : `§ 02 · Articles de blog`, H1 `Articles de blog / <em class="acc-blog">au long cours.</em>` (72px desktop)
- **Filtres** (chips) : `Tout / IA / Tech / Lead / Business` — actif = fond couleur + texte `#fafaf7`
- **À la une** : premier article en grand (42px serif)
- **Archive** : liste `<li>` avec grid `[110px_1fr_80px_60px]` (date / titre / catégorie / temps)
- Filtrage client side : JS simple qui toggle `.hidden` selon `data-tags` sur `<li>`

Content Collection schema (`src/content/config.ts`) :

```ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.date(),
    readTime: z.number(), // minutes
    category: z.enum(['IA', 'Tech', 'Lead', 'Business']),
    featured: z.boolean().optional().default(false),
    number: z.number(), // pour le § № 07
  }),
});

export const collections = { blog };
```

### 3. Page d'article — `src/pages/blog/[slug].astro` (d'après `article.html`)

Layout centré sur 680px.

- **Barre de progression** fixed top, `height: 2px`, fond `var(--a-blog)`, `width` calculé sur le scroll
- **Top nav** (même que blog)
- **Breadcrumb** : `← Articles de blog / CATÉGORIE`
- **En-tête article** : N° + date + temps | H1 serif 60px (avec em coloré acc-blog) | excerpt serif 19px
- **Byline** : avatar circulaire (teinte acc-blog opacity .15), nom, handle, bouton "Partager"
- **Corps (classe `.prose`)** :
  - Drop cap sur première lettre (serif 24px, float left, couleur acc-blog)
  - H2 serif 34px, H3 serif 24px
  - Blockquote : border-left 2px acc-blog, padding gauche 1.2em, serif 22px italique
  - Listes custom : bullets = petite barre 6px × 1px acc-blog
  - Liens corps : `color: var(--a-blog)`, souligné 1px offset 3px
  - Code inline : fond `#f3f1ec`, border rule, padding 1px 5px
- **Code blocks** : fond `#f3f1ec`, border rule, radius 8px, JetBrains Mono 13px / 1.7, coloration manuelle (`.c-com` gris italique, `.c-key` brun, `.c-str` vert, `.c-typ` violet)
- **Fin d'article** : filet + `§ fin` acc-blog à gauche + date à droite
- **À lire ensuite** : grid 2 colonnes, 2 articles

### Responsive

- Breakpoint principal : `1024px` (Tailwind `lg`)
- En dessous : sidebar cachée, top nav seule visible, grilles passent en 1 colonne
- Le top strip `.mob-top` a été **retiré** — se baser sur le `lg:hidden` Meta row de V1 pour l'affichage mobile du brand

---

## Interactions & Behavior

### Page d'accueil

- Smooth scroll sur tous les liens d'ancre internes (`html { scroll-behavior: smooth }`)
- Scroll-margin-top sur les sections : `24px`
- Scroll-spy : IntersectionObserver avec rootMargin `-20% 0px -60% 0px`

### Blog list

- Click sur chip filtre → toggle `.chip-active` sur le bouton, toggle `.hidden` sur `<li[data-tags]>` selon match
- Chip "Tout" = reset
- Message "Rien dans cette catégorie pour l'instant." si 0 matches

### Article

- Barre de progression : `scrollTop / (scrollHeight - clientHeight) * 100 → width %`
- Listener `scroll` passif + `resize`

### Liens externes

- Tous les GitHub / LinkedIn : `target="_blank"` + `rel="noopener"`

### Hover states

- Titres de posts (list + card) : couleur passe à `var(--a-blog)` avec `transition-colors`
- Liens `.link-u` : le souligné se rétracte (effet wipe)
- Boutons pilule : `hover:bg-white`

---

## State Management

Aucun état serveur. Astro est SSG.

State client minimal :

- Scroll-spy (active link) — géré par IntersectionObserver
- Filtres blog — DOM class toggling
- Barre de progression article — listener scroll

---

## Assets

Aucun asset bitmap à ce stade — toutes les illustrations sont typographiques. Prévoir :

- `public/favicon.svg` — à créer (proposer un monogramme GM)
- `public/og-image.png` — pour social sharing (1200×630) — à créer
- `public/cv-gabriel-mustiere.pdf` — fourni par le client
- `public/avatar.jpg` — à fournir par le client (utilisé dans la byline article)

---

## Copy / contenu

Tout le texte est en **français**. Les articles blog sont des stubs de démo à remplacer par le vrai contenu client. Les titres/handles sont placeholder :

- `hello@gabrielmustiere.fr` — email
- `github.com/gmustiere` — à valider avec Gabriel
- `linkedin.com/in/gabrielmustiere` — à valider avec Gabriel

---

## Files

Dans `designs/` :

- `v3-quiet-nav.html` — page d'accueil avec sidebar navigation
- `blog.html` — liste des articles de blog
- `article.html` — page d'article

Pour voir une maquette en contexte : ouvre-la dans un navigateur (elle est autonome, Tailwind CDN + Google Fonts).

---

## Guide Astro pas-à-pas (pour démarrer, si tu ne connais pas)

```bash
# 1. Créer le projet
npm create astro@latest portfolio-gm -- --template minimal --typescript strict
cd portfolio-gm

# 2. Ajouter Tailwind
npx astro add tailwind

# 3. Ajouter @fontsource pour les fonts
npm i @fontsource/instrument-serif @fontsource/inter @fontsource/jetbrains-mono

# 4. Créer la structure décrite plus haut
# 5. Dev
npm run dev
```

Dans `src/layouts/BaseLayout.astro`, importer les fonts :

```astro
---
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '../styles/global.css';
---
```

Dans `src/styles/global.css`, placer les tokens `@theme` + palette oklch + classes `.acc-*`, `.link-u`, `.hl`, `.idx-link`, `.prose`, etc. (copier-coller depuis la balise `<style>` des maquettes, nettoyer ce qui est lié au mode Tweaks qui n'est pas nécessaire en prod).

Dans `astro.config.mjs`, pas de config spéciale — Astro sert les pages statiques.

Pour le blog, utiliser `getCollection('blog')` dans `src/pages/blog/index.astro` et `getStaticPaths` + `entry.render()` dans `[slug].astro`.

---

## Ce qui est volontairement exclu des maquettes

- Le panneau "Tweaks" visible dans les maquettes (coin bas-droite) est un **outil de preview interne** uniquement. **Ne pas le porter en production**. Le script `TWEAK_DEFAULTS` et le module `EDITMODE-BEGIN/END` peuvent être ignorés.
- La variante de réordonnancement des sections n'a pas besoin d'être gardée — l'ordre §01 → §05 est final.
- Les choix de polices alternatives (Fraunces, Newsreader) sont exploratoires ; rester sur **Instrument Serif + Inter + JetBrains Mono**.

---

## Points à valider avec le client avant implémentation

1. Handle GitHub (`gmustiere` ?) et URL LinkedIn exacts
2. Domaine cible (`gabrielmustiere.fr` ?)
3. Contenu réel du CV (PDF à fournir)
4. Photo / avatar pour la byline article
5. Contenu réel des 12 articles blog (titres, catégories, corps)
6. Les 3 projets de la section §03 (nom, résumé, stack, résultat)
7. Année de début de carrière pour l'âge dynamique "15+ ans"
