# Review — Sections SEO standardisées pour articles et side-projects

> Date : 2026-04-29
> Stack : Astro 6 SSG · MDX · loader `chaptered-glob`
> Périmètre : working tree (18 fichiers M, 11 fichiers nouveaux, ~580 ajouts / ~165 suppressions)
> Référence d'intention : `docs/story/005-f-sections-seo-articles/design.md` + `feature.md`

## Bloquants

Aucun. Build vert, 15/15 tests, lint clean, conforme au design.

## Importants

- [x] **BUG** `src/components/ui/Sources.astro:57-61` — Bug d'affichage : quand une source a un `author` mais pas de `date`, on rend `"Jane Doe ·  · domain.com"` (deux séparateurs `·` qui se suivent avec un espace creux). **Corrigé** : séparateur attaché à chaque segment optionnel (`{item.author && <>{item.author} · </>}` + `{item.date && <><time>...</time> · </>}`), suivi du hostname inconditionnel.

## Mineurs

- [x] **CONV** `src/components/ui/Callout.astro` — Code mort, **supprimé**.
- [x] **I18N** `src/i18n/ui.ts:86` et `:223` — Clés `tldrLabel` mortes, **supprimées** (FR + EN).
- [ ] **CONV** `src/content-loaders/chaptered-glob.ts:301-303` — `data.faq = faqData` (idem pour `resume`/`sources`) écrase silencieusement un éventuel champ `faq` présent dans le frontmatter `index.mdx`. Avec le schéma Zod actuel (sans `tldr`/`faq`/`summary`), le frontmatter ignore les champs inconnus par défaut — donc un dev qui remettrait `faq:` par mégarde dans son index.mdx ne serait pas averti. Optionnel : avertir explicitement (logger) si `data` contient déjà un champ qui sera écrasé par le loader.
- [ ] **DESIGN** `src/content-loaders/chaptered-glob.ts` — Si `resume.mdx` est absent dans une forme dossier, l'erreur vient de Zod (`resume: Required`) avec un message générique pointant l'`index.mdx`. L'attendu (cf. design : "Le build échoue avec un message clair si resume.mdx est absent") serait plutôt une erreur du loader pointant le dossier. Pas critique vu que tout le contenu est migré, mais le message d'erreur ne pointera pas l'auteur dans la bonne direction si l'erreur survient à l'avenir.
- [ ] **SECU** `src/components/ui/Resume.astro:25` — `set:html={html}` injecte le HTML produit par `marked.parse()`. Le contenu vient du repo (mono-auteur, build statique), donc pas d'exposition XSS. Acceptable dans ce contexte. À ré-évaluer si le projet accepte des contributions externes ou des contenus tiers — auquel cas il faudrait passer le HTML par `DOMPurify` ou activer `marked` en mode sanitize.
- [ ] **DOC** `docs/story/005-f-sections-seo-articles/design.md` — Le design promet une convention "FAQ obligatoire pour blog, optionnelle projects" comme one des options du pitch, mais la convention finale retenue est "FAQ optionnelle, sources optionnelles" partout. Bien aligné avec l'implémentation, juste à confirmer que c'est l'intention.

## Points positifs

- **Réutilisation maximale** : aucun composant SEO réécrit (`<Faq>`, `<TableOfContents>`, JSON-LD `FAQPage` recyclés). Scope tenu au plus serré.
- **Helpers testables** : `seo-sections.ts` est purement synchrone, indépendant du contexte Astro, couvert par 15 tests `node:test` qui balaient les cas valides ET les erreurs (YAML invalide, URL malformée, date au mauvais format, etc.).
- **Validation parité i18n** : ajoutée au bon endroit (`buildTranslationIndex`), testée en cassant volontairement la parité d'une paire FR/EN, message d'erreur cite les deux chemins fautifs.
- **Hot-reload préservé** : le contenu des 3 fichiers réservés entre dans le `digestSource` du loader — modifier un `resume.mdx` en dev déclenchera bien le re-render.

## Verdict

- Bloquants restants : 0 / 0
- Importants restants : 0 / 1 (bug Sources corrigé)
- Mineurs restants : 4 / 6 (Callout + tldrLabel corrigés ; chaptered-glob écrasement silencieux, message d'erreur Zod, `set:html`, écart doc design — notés pour plus tard)
- Statut : **READY TO COMMIT**
