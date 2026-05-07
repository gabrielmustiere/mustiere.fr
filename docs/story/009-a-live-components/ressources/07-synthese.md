# 🧩 7. Synthèse

## 🎯 Objectif du chapitre

Refermer la boucle ouverte au chapitre 1. Six slides qui répondent aux questions concrètes que se pose un lead dev face à Live Components :

1. Le **comparatif** (Twig / Live / React) sur 12 axes
2. L'**hybridation** : le vrai modèle d'app moderne
3. La **règle des deux questions** pour décider en code review
4. Les **limites honnêtes** de Live Components
5. **5 anti-patterns** à reconnaître
6. Les **take-aways** actionnables

---

## Slide d'intro — Synthèse

Refermer la boucle ouverte au chapitre 1.

1. Comparatif Twig / Live / React
2. La règle des deux questions
3. Limites honnêtes et anti-patterns
4. Take-aways actionnables pour lundi

---

## Slide 7.1 — Twig / Live / React — 12 axes

| Feature                | Twig Component        | Live Component                  | React / Vue             |
| ---------------------- | --------------------- | ------------------------------- | ----------------------- |
| **Rendu**              | Serveur uniquement    | Serveur + patch Ajax            | Client (SSR optionnel)  |
| **État**               | Aucun (figé)          | Serveur, sérialisé dans le DOM  | Client, en mémoire JS   |
| **JS requis**          | ❌ Aucun              | ⚠️ Stimulus inclus              | ✅ Oui, significatif    |
| **Build pipeline**     | ❌ AssetMapper suffit | ❌ AssetMapper suffit           | ✅ Vite / Webpack       |
| **Poids JS**           | ~0 Ko                 | ~25–30 Ko                       | 40–150 Ko+              |
| **SEO natif**          | ✅ HTML complet       | ✅ HTML complet                 | ⚠️ SSR ou prerender     |
| **Offline**            | ❌                    | ❌                              | ✅ PWA / service worker |
| **Latence**            | N/A                   | 50–300 ms (réseau)              | Locale (instantanée)    |
| **Duplication PHP/JS** | Aucune                | Aucune                          | Fréquente               |
| **Apprentissage**      | Faible (Twig enrichi) | Moyenne                         | Élevée                  |
| **Testabilité**        | PHPUnit + rendu       | PHPUnit + InteractsWithLive     | Jest + testing-library  |
| **Accessibilité**      | Natif (HTML pur)      | Natif (morphing préserve focus) | Dépend de l'équipe      |

---

## Slide 7.2 — L'hybridation — le vrai modèle

Le meilleur projet Symfony moderne n'est **pas 100 % Twig**, ni **100 % Live**, ni **100 % React**. C'est une app qui **place la bonne brique au bon endroit**.

### Exemple : un backoffice e-commerce

| Zone                            | Brique choisie      |
| ------------------------------- | ------------------- |
| Layout, header, sidebar, footer | **Twig Component**  |
| Design system (boutons, cards)  | **Twig Component**  |
| Liste produits filtrable        | **Live Component**  |
| Formulaire commande (wizard)    | **Live Component**  |
| Éditeur de fiche produit riche  | **Live Component**  |
| Charts dashboard                | **Twig + Chart.js** |

> 💬 **Une seule stack** (Symfony + Twig), **deux moteurs de réactivité** (Live et React-île), **un design system** unifié.
>
> Pas 100 % Twig. Pas 100 % Live. Pas 100 % React. **La bonne brique au bon endroit.**

---

## Slide 7.3 — La règle des deux questions

Avant de choisir la brique, **deux questions** suffisent dans 95 % des cas.

```
1. Y a-t-il une interaction utilisateur qui modifie l'UI ?
   └─ Non → Twig Component (rendu figé, props au chargement)
   └─ Oui → Question 2

2. Cette interaction dépend-elle d'un état ou de données côté serveur ?
   └─ Non → Stimulus (comportement purement client)
   └─ Oui → Live Component
```

### Application concrète

| Feature                   | Q1  | Q2  | Brique             |
| ------------------------- | --- | --- | ------------------ |
| Card produit (affichage)  | Non | —   | **Twig Component** |
| Toggle dark mode          | Oui | Non | **Stimulus**       |
| Recherche produit en live | Oui | Oui | **Live Component** |
| Filtre + pagination liste | Oui | Oui | **Live Component** |
| Champs conditionnels form | Oui | Oui | **Live Component** |
| Copy-to-clipboard         | Oui | Non | **Stimulus**       |

---

## Slide 7.4 — Limites de Live Components

### Latence réseau

| Environnement       | Latence    | Perception      |
| ------------------- | ---------- | --------------- |
| Dev local           | 30–80 ms   | Imperceptible   |
| Prod, même région   | 80–200 ms  | Acceptable      |
| Mobile 4G           | 200–500 ms | Visible mais OK |
| 3G / réseau dégradé | 500 ms–2 s | Frustrant       |

> 💡 Typing sans debounce = 2–5 req/s par utilisateur. Une app à 100 req/s classique → prévoir **300–500 req/s** avec Live actifs.

### Limites structurelles

- ❌ **État client riche** — undo/redo local, draft offline
- ❌ **Optimistic UI** — possible mais demande du JS custom
- ❌ **Offline** — impossible par nature
- ❌ **Animations complexes** — pas d'équivalent natif à Framer Motion, GSAP

> 💬 Ce ne sont pas des bugs. Ce sont des **choix d'architecture**. Connaître les limites, c'est savoir quand basculer vers React ou Stimulus.

---

## Slide 7.5 — 5 anti-patterns à reconnaître

| #   | Anti-pattern                                            | Fix                                                           |
| --- | ------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Entité Doctrine complète en `LiveProp`                  | Passer l'ID, recharger côté serveur                           |
| 2   | Plusieurs `LiveAction` enchaînées sur un clic           | Une seule action qui fait les étapes                          |
| 3   | Live Component sans `LiveProp writable` ni `LiveAction` | C'est un Twig Component — économiser l'hydratation            |
| 4   | Slider, WYSIWYG, canvas en Live                         | Stimulus pur ou lib client dédiée                             |
| 5   | Ignorer le profiling sur des composants imbriqués       | Une interaction peut déclencher plusieurs requêtes en cascade |

### Grille de décision rapide

| Question                            | Oui →     | Non →           |
| ----------------------------------- | --------- | --------------- |
| Interaction dépend d'état serveur ? | ✅ Live   | Twig / Stimulus |
| < 1 interaction/s suffit ?          | ✅ Live   | Stimulus only   |
| Latence ~200 ms tolérable ?         | ✅ Live   | SPA / client    |
| Offline requis ?                    | SPA / PWA | ✅ Live         |
| Animation 60 fps ?                  | Client JS | ✅ Live         |
| Indexé par Google ?                 | ✅ Live   | SPA + SSR       |

---

## Slide 7.6 — Take-aways & plan d'action

### Les 5 idées à emporter

1. **Twig Components** = classe + template = composant serveur avec props typées
2. **Live Components** = Twig Component + réactivité Ajax = server-driven UI
3. **Server-driven UI** couvre 95 % des besoins web business
4. **React reste pertinent** pour les cas extrêmes — pas comme choix par défaut
5. **Adoption progressive** — composant par composant, sans big bang

### Ce qu'on fait dès cette semaine

- Installer `symfony/ux-twig-component` et `symfony/ux-live-component` sur un projet pilote
- Extraire **un** composant répété (alert, card, badge) en Twig Component
- Écrire **un** Live Component trivial (compteur, toggle, like) pour sentir le cycle
- Ouvrir le profiler, inspecter un `POST /_components/*`, lire le payload

### Ce qu'on fait ce mois-ci

- Identifier **un widget JS/Stimulus bricolé** → le réécrire en Live Component
- Commencer une arborescence `src/Twig/Components/` + `templates/components/`
- Mettre les premiers tests `InteractsWithLiveComponents` sur les composants critiques

### Ce qu'on fait ce trimestre

- Documenter les règles d'équipe : quand Twig, quand Live, quand Stimulus, quand React
- Auditer les pages existantes : combien de `render(controller())`, combien de JS custom ?
- Construire un backlog de refacto ciblé

### Pour aller plus loin

- [ux.symfony.com](https://ux.symfony.com) — le hub Symfony UX
- [ux.symfony.com/live-component](https://ux.symfony.com/live-component)
- [ux.symfony.com/twig-component](https://ux.symfony.com/twig-component)
- **Cousins à connaître** : [Livewire](https://livewire.laravel.com/), [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/), [Hotwire](https://hotwired.dev/), [htmx](https://htmx.org/)

---

## Slide finale — Le meilleur framework front…

> **« Le meilleur framework front, c'est celui dont on n'a pas besoin. »**
>
> Symfony UX supprime le **besoin d'une stack séparée** pour gérer la réactivité.
> Une équipe, une stack, un design system.
> Et dans 95 % des cas réels, ça suffit très largement.

**Merci pour votre attention.**

[github.com/gabrielmustiere/live-components-demo](https://github.com/gabrielmustiere/live-components-demo)

---

## 🗣️ Narration finale

> "Ce qu'il faut retenir : un Twig Component, c'est une classe et un template. Un Live Component, c'est ce même couple auquel on ajoute `#[LiveProp]` et `#[LiveAction]`, plus un `data-model` côté Twig — et on obtient de la réactivité sans écrire de JS, sans écrire d'endpoint, sans format d'API à inventer.
>
> Pour 95 % des apps Symfony — CRUD, backoffice, e-commerce, SaaS B2B — c'est exactement ce dont on a besoin. Pour les 5 % restants — canvas, offline, 60 fps, éditeurs collaboratifs — React reste la bonne réponse, mais sur une zone isolée, pas sur toute l'app.
>
> Le travail de lundi matin : prendre un widget bricolé en Stimulus+Ajax chez vous, le réécrire en Live Component, supprimer le JS correspondant. En une demi-journée, vous avez votre premier retour d'expérience concret, et vous pouvez juger par vous-mêmes."

---

## 🎤 Questions ouvertes pour la discussion

- Sur vos projets, quelles zones UI mériteraient d'être converties en Live Components ?
- Où placez-vous aujourd'hui la frontière React / Live dans votre produit ?
- Quels sont les widgets JS custom qui traînent depuis le plus longtemps dans votre codebase ?
- Qu'est-ce qui freine l'adoption chez vous — tech, équipe, convictions ?
