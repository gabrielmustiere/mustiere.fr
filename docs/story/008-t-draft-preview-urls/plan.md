---
name: Évolution tech — URLs de prévisualisation des drafts en prod
description: Rendre les articles draft accessibles en prod via une URL non-devinable basée sur un hash simple — pour partager à quelques relecteurs.
type: tech-plan
---

# Évolution tech — URLs de prévisualisation des drafts en prod

> Date : 2026-05-04
> Stack : Astro 6 SSG / GitHub Pages / Tailwind 4

## Problème adressé

Aujourd'hui, un article `draft: true` est exclu du build prod (`isPublished()` dans `src/utils/content.ts:14` — résultat du plan `t-003-drafts-dev-only/`). Pour partager un brouillon à un relecteur, il faut soit installer l'environnement de dev, soit publier. Pas de voie médiane.

**Pourquoi maintenant** : besoin opérationnel récurrent de faire relire des articles avant publication par des personnes sans environnement Node. La friction pousse à publier sans relecture.

**Cadrage explicite** : ce n'est **pas** un système de sécurité. C'est juste une URL non-publique pour partager à quelques relecteurs de confiance. Pas d'auth, pas de chiffrement, pas de rotation. Si l'URL fuite, l'article est lisible — c'est accepté. Le but est uniquement d'éviter que l'URL soit devinable depuis le slug et qu'elle apparaisse dans les listings/sitemap/RSS.

## Brique retenue

- **Pattern** : URL préfixée par un hash court dérivé du slug + d'une phrase **hardcodée dans le code**.
- **Lib** : `node:crypto` (`createHash('sha256')`), aucune dépendance ajoutée.
- **Format** : `/blog/_drafts/<hash>/<slug>/` — `<hash>` = `sha256(slug + DRAFT_HASH_SEED).slice(0, 10)`. Idem pour `/en/blog/_drafts/`, `/projects/_drafts/`, `/en/projects/_drafts/`.
- **`DRAFT_HASH_SEED`** : constante `export const` dans `src/utils/content.ts`. Pas un secret de sécurité — si le repo est public, n'importe qui peut recalculer les URLs. Choix assumé : on cherche des URLs non-triviales depuis le slug seul, pas une protection contre lecture non autorisée.

## Point d'intégration

- **`src/utils/content.ts`** — exporte `DRAFT_HASH_SEED` + helpers `getDraftHash`, `getDraftSlugParam`, `getDraftPreviewEntries`. En dev (`import.meta.env.DEV`), les helpers renvoient null/[] pour que les drafts restent à leur path canonique via `isPublished()`. `isPublished()` reste inchangé.
- **`src/pages/blog/[...slug].astro`**, **`src/pages/en/blog/[...slug].astro`**, **`src/pages/projects/[...slug].astro`**, **`src/pages/en/projects/[...slug].astro`** — `getStaticPaths()` génère les pages draft sous le path opaque quand `DRAFT_SECRET` est défini.
- **`astro.config.mjs`** — `sitemap.filter` exclut `/_drafts/` ; `robots.txt` ajoute `Disallow: /blog/_drafts/` (et variantes).
- **`src/layouts/BaseLayout.astro`** — prop `noindex?: boolean` qui émet `<meta name="robots" content="noindex,nofollow">` (deux lignes, autant éviter Google).
- **`scripts/draft-url.mjs`** (nouveau) — CLI qui prend un slug et imprime l'URL prod. Lit `DRAFT_HASH_SEED` via regex sur `src/utils/content.ts` (ancrée sur `export const`) pour rester source unique avec le build.
- **`package.json`** — script `"draft:url": "node scripts/draft-url.mjs"`.
- **`.github/workflows/deploy.yml`** — pas de modification nécessaire (la seed est dans le code, pas en env).

**Impact sur les clients existants** : aucun. Les listings, sitemap, RSS, llms.txt utilisent déjà `isPublished()` qui n'est pas touché.

## Critères de succès mesurables

| Métrique | Baseline | Cible | Méthode |
|----------|----------|-------|---------|
| Pages draft générées sous path opaque | 0 | 100 % des `draft: true` | `existsSync(dist/blog/_drafts/<hash>/<slug>/index.html)` |
| Slugs draft dans sitemap / RSS / llms.txt / listings HTML | 0 | 0 (préservé) | grep slug dans les fichiers de `dist/` |
| Path canonique d'un draft | 404 | 404 (préservé) | `!existsSync(dist/blog/<slug>/index.html)` |
| Build en mode dev (`astro dev`) | drafts servis à leur path canonique | aucun `_drafts/` généré (les helpers renvoient null en dev) | inspection visuelle, comportement géré par `import.meta.env.DEV` |

Test automatisé : `tests/draft-isolation.test.mjs` (`node --test`) build avec un secret connu et vérifie tout le tableau.

## Rollback

- **Invalidation des URLs partagées** : modifier `DRAFT_HASH_SEED` dans `src/utils/content.ts` puis redéployer. Au prochain deploy, les anciennes URLs deviennent 404 et le CLI imprime de nouvelles URLs.
- **Désactivation totale** : retirer le `draft: true` du frontmatter (publication) ou inversement supprimer la branche `draftRoutes` dans les `getStaticPaths`. Pas un kill switch d'urgence — c'est un changement de code qui passe par un deploy.

## Plan d'exécution

1. [ ] **Étape 1 — Test d'isolation rouge** : `tests/draft-isolation.test.mjs` qui build avec `DRAFT_SECRET=test-phrase-quelconque` et capture les assertions du tableau.
2. [ ] **Étape 2 — `getDraftPath()` + extension `getStaticPaths()`** dans les 4 fichiers `[...slug].astro`.
3. [ ] **Étape 3 — `noindex` dans `BaseLayout` + propagation depuis `ArticleLayout`/`ProjectLayout` quand `entry.data.draft === true`**.
4. [ ] **Étape 4 — `sitemap.filter` + `robots.txt` dans `astro.config.mjs`**.
5. [ ] **Étape 5 — CLI `scripts/draft-url.mjs` + script npm `draft:url`**.
6. [ ] **Étape 6 — `deploy.yml`** (aucune modif requise au final : la seed est dans le code).
7. [ ] **Étape 7 — Note dans `DEVELOPMENT.md`** (1 paragraphe : "comment partager un draft").

## Critères de sortie

- [ ] `tests/draft-isolation.test.mjs` au vert.
- [ ] Test manuel : URL générée par CLI → 200 ; URL canonique du draft → 404.
- [ ] `astro dev` : drafts servis à leur path canonique, aucun `_drafts/` généré.
- [ ] `npm run check`, `npm run test`, `npm run lint` au vert.

## Questions ouvertes

- Aucune. Volontairement minimal.
