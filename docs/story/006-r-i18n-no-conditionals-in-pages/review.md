# Review — Refacto i18n : éradiquer `lang === '…'` des pages, layouts et composants

> Date : 2026-04-30
> Stack : Astro 6 SSG bilingue (FR/EN)
> Périmètre : working tree (~50 fichiers, +1 121 / -1 066 sur src/)
> Référence d'intention : `docs/story/006-r-i18n-no-conditionals-in-pages/plan.md`

## Bloquants

_Aucun._

La règle d'or du plan est tenue :

- `grep -RE "lang === '" src/components src/layouts src/pages` → **0 ligne**
- `grep -RE "lang === '" src/i18n` → 1 ligne (`otherLang()` dans `i18n/utils.ts`, explicitement autorisé par le plan)
- `npm run check` → 0 errors / 0 warnings / 0 hints (84 fichiers)
- `npm run lint` → No issues found
- `npm run format -- --check` → propre (le seul warning est sur `docs/.../php-story.md`, hors scope refacto)
- `node scripts/snapshot-build.mjs after-review` puis `node scripts/diff-snapshot.mjs before after-review` → **OK — aucun diff**
  (sur les deux variantes prod et with-drafts, 120 + 122 fichiers comparés)

## Importants

- [ ] **[CONV]** `scripts/diff-snapshot.mjs:30-72` — Le filet snapshot a été élargi (5 nouveaux masques : `data-astro-cid-*`,
      whitespaces ASCII collapsés, whitespaces inter-balises, leading/trailing dans les balises de bloc, normalisation d'entités HTML
      `&#39;`/`&apos;`/`&quot;`/`&#34;`). C'est techniquement justifié — déplacer du JSX d'un `.astro` vers un autre change le
      `data-astro-cid-<hash>` et l'indentation source — mais ça **redéfinit ce que "byte-identique" veut dire** par rapport au plan
      ("HTML rendu, structure DOM, attributs, classes Tailwind, ordre des éléments, contenu textuel y compris ponctuation, espaces
      non-sécables et caractères spéciaux"). À documenter explicitement dans le commit ou le report final : le snapshot vérifie
      désormais l'équivalence DOM/visuelle, pas l'égalité octet-à-octet brute. Le sanity check `before` ↔ `before-bis` a été
      validé avec les nouveaux masques (cf. contexte session) ; pas de faux négatifs introduits.

- [ ] **[BUG]** `scripts/diff-snapshot.mjs:36` — `HTML_ASCII_WS_RE = /[\t\n ]+/g` s'applique sans exclusion à tout le contenu
      `.html`, y compris l'intérieur des balises `<pre><code>`. Le seul `<pre>` du site est dans `BlogSection.astro:72-78`
      (le snippet `// tiny scoring loop`) — son indentation est aujourd'hui figée, donc pas de bug actif. Mais à terme, une
      régression qui supprimerait une indentation dans un bloc de code ne serait plus détectée par le snapshot. Suggéré :
      isoler les régions `<pre>…</pre>` avant la normalisation whitespace ou les remplacer par un placeholder. À fixer en
      story séparée (le filet est suffisant pour ce refacto).

- [ ] **[CONV]** `astro.config.mjs:59-62` et `src/utils/content.ts:13-15` — Reformatage Prettier (3 lignes ↔ 1 ligne) hors scope
      du refacto i18n. Aucun lien avec la story 006. À sortir du commit pour garder l'historique propre, ou les regrouper dans un
      commit `style: …` séparé.

## Mineurs

- [ ] **[ARCHI]** `src/utils/schema.ts:179` — `PARCOURS_FAQ` est passé de `const` à `export const` alors qu'il n'est utilisé
      qu'en interne (`parcoursFaqSchema`, même fichier). Visibilité élargie sans consommateur. Repasser en `const` privé.

- [ ] **[STYLE]** `src/components/pages/ParcoursPage.astro:157-186` — La 1ʳᵉ expérience (Anytime) est rendue via une IIFE
      `(() => { ... })()` pour pouvoir aliaser `xp`, alors que les 3 expériences suivantes (Passion Barbecue, Progicar, XL Soft)
      utilisent un accès direct `content.experiences[N]`. Lecture moins homogène. Deux options pour aligner le style :
      a) `{(xp => (...))(content.experiences[0])}` (IIFE compacte), ou b) supprimer l'IIFE et écrire `content.experiences[0].period`
      partout comme les autres. Pas un blocant, juste une asymétrie.

- [ ] **[ARCHI]** `src/components/pages/ParcoursPage.astro:402-461` — Le plan prévoit que le bloc localisation "devient une boucle
      sur un array de tuples typés". L'actuel répète manuellement `content.location[0..3]` puis garde Email/LinkedIn inline.
      L'objectif "boucle" n'est que partiel. Acceptable (Email/LinkedIn ont du markup spécifique : `mailto:`, `target="_blank"`),
      mais à noter pour cohérence avec le plan.

- [ ] **[STYLE]** Working tree pollué : `README.md`, `docs/story/005-*`, `docs/story/a-002-*` sont modifiés mais sans rapport avec
      le refacto i18n. Vérifier que le `git add` ciblera bien uniquement les fichiers de la story 006.

## Points positifs

- **Découpage par familles propre** : F1/F3 (helpers `otherLang` + `LANG_META[lang].bcp47`), F2 (registre `routes.ts`), F4 (head
  metadata via `LANG_META[lang].ogLocale` et `routePath('rssFeed', lang)`), F5 (ui.ts étendu), F6 (un fichier `.astro` par langue
  par bloc), F7 (`parcoursContent: Record<Lang, ParcoursContent>`). Chaque famille est traitée par le mécanisme adapté, pas un
  fourre-tout.
- **Typage strict tenu** : `ROUTES` typé `Record<RouteName, Record<Lang, string>>`, `parcoursContent` typé `Record<Lang, ParcoursContent>`,
  dispatch maps F6 typés `Record<Lang, AstroComponentFactory>`. Une langue manquante se voit à la compile.
- **Snapshot baseline préservé** : aucune divergence sémantique HTML/DOM entre `before` et `after-review` après les masques
  techniques. Aucune URL nouvelle, retirée ou redirigée. Conforme à la promesse "comportement externe préservé" du plan.
- **Co-localisation des fragments i18n** sous `src/components/i18n/<page>/<bloc>/{fr,en}.astro` : 18 fichiers nouveaux mais
  organisés, faciles à étendre quand une langue arrive.

## Verdict

- Bloquants restants : 0 / 0
- Statut : **READY TO COMMIT**

Avant `/commit`, deux nettoyages utiles (mineurs) :

1. Sortir du commit les reformat Prettier hors scope (`astro.config.mjs`, `src/utils/content.ts`) ou les expliciter en footer.
2. Repasser `PARCOURS_FAQ` en `const` privé (`src/utils/schema.ts:179`).

Le reste (homogénéité IIFE Anytime, boucle localisation partielle, durcissement du masque whitespace pour `<pre>`) peut partir
en stories de suivi sans bloquer le merge.
