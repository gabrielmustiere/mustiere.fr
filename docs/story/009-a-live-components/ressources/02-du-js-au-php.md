# 🔀 2. Du JS au PHP — ce qu'on emprunte, ce qu'on laisse

## 🎯 Objectif du chapitre

Chapitre **court et volontairement dense**. On ne refait pas l'histoire des SPA. On identifie **les concepts précis** du modèle composant JS qu'on veut porter en PHP, puis on regarde **comment Symfony UX les traduit** en idiomes PHP/Symfony.

Cinq slides, chacune une idée :

1. Les **trois piliers** universels du modèle composant
2. L'**idée** (qu'on garde) vs **l'implémentation** (qu'on laisse)
3. Les **deux briques** de Symfony UX, l'une empilée sur l'autre
4. L'**architecture en un schéma**
5. Ce qu'on retient

---

## Slide d'intro — Du JS au PHP

Ce qu'on **emprunte** au modèle composant JS, ce qu'on **laisse**.

1. Quels concepts on garde de React/Vue ?
2. Comment Symfony UX les assemble côté serveur ?

---

## Slide 2.1 — Le modèle composant : trois piliers

Peu importe le framework ou le langage, tout modèle composant repose sur **trois idées**.

### 1. Encapsulation

Un composant = un **bout d'UI autonome** qui réunit template, état et logique. On le raisonne **localement**, sans regarder le reste de la page.

### 2. Réactivité

L'état change → la vue se met à jour. Pas de `querySelector`, pas de synchronisation manuelle du DOM.

### 3. Composition

Les composants s'imbriquent en arbre. Les **props descendent**, les **événements remontent**.

> 💬 **Trois idées indépendantes de React, Vue ou de JavaScript.**

---

## Slide 2.2 — L'idée vs l'implémentation

Ces trois piliers sont une **idée**. Le Virtual DOM, le bundle JS, l'hydratation, le store global — c'est **une implémentation** parmi d'autres.

### Ce qu'on garde

- Encapsulation (un composant = un tout)
- Réactivité (état → vue)
- Composition (arbre, props, events)

### Ce qu'on peut laisser

- Virtual DOM / reconciliation
- Bundle JS de plusieurs MB
- Hydratation côté client
- Store global (Redux, Pinia…)

> 💬 **Symfony UX garde l'idée, laisse l'implémentation.**

---

## Slide 2.3 — Deux briques, une empilée sur l'autre

Symfony UX n'invente rien de magique. Le modèle composant tient sur **deux bundles**, le second construit sur le premier.

### Twig Components — `stateless`

- Une **classe PHP** (attribut `#[AsTwigComponent]`) — ses propriétés publiques sont les **props**
- Un **template Twig** associé par convention
- Rendu **côté serveur**, puis plus rien : un objet, une sortie HTML

### Live Components — `stateful`

- Un **Twig Component** enrichi par `#[AsLiveComponent]`
- Un **endpoint HTTP** auto-exposé qui rejoue le rendu quand l'état change
- **Stimulus** capte l'interaction → **Idiomorph** patche les nœuds modifiés du DOM

---

## Slide 2.4 — Une architecture, une commande

Tout cet assemblage arrive par un seul `composer require symfony/ux-live-component` — **AssetMapper** et le **bridge Stimulus** sont câblés par la recette Flex.

### Schéma d'ensemble

```
┌──────────────────────────────────────────┐
│            PHP / Twig                    │
│   ┌────────────────┐                     │
│   │ Live Components│                     │
│   └───────┬────────┘                     │
│           │                              │
│   ┌───────▼────────┐                     │
│   │ Twig Components│                     │
│   └────────────────┘                     │
└──────────────┬───────────────────────────┘
               │
        ┌──────▼──────────┐
        │ Stimulus bridge │
        └──────┬──────────┘
               │
┌──────────────▼───────────────────────────┐
│            JavaScript                    │
│           (Stimulus)                     │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│         Build / Assets                   │
│         (AssetMapper)                    │
└──────────────────────────────────────────┘
```

### Le Stimulus bridge en 30 secondes

C'est le **mécanisme central** qui rend Symfony UX agréable : un bundle PHP **livre** des contrôleurs Stimulus, qui s'enregistrent **automatiquement** côté client.

```
1. composer require symfony/ux-live-component
        │
        ▼
2. Le bundle expose un controller JS (live_controller.js)
        │
        ▼
3. Symfony Flex écrit dans assets/controllers.json
        │
        ▼
4. AssetMapper lit le fichier
        │
        ▼
5. data-controller="live" est dispo partout, zéro npm
```

> 💬 **Zéro `npm install`, zéro config JS : une commande et c'est en place.**

---

## Slide 2.5 — Ce qu'on retient

Le modèle composant tient en **trois idées** : **encapsulation**, **réactivité**, **composition**.

Symfony UX les apporte en PHP — **sans Virtual DOM, sans bundle, sans hydratation**. Une commande `composer`, le bridge Stimulus, et c'est prêt.

On garde Symfony. On gagne le composant. On laisse la complexité SPA de côté.

> **Regardons en détails les Twig Components et les Live Components.**

---

## 🗣️ Narration (script oral)

> "Le modèle composant, c'est trois idées : encapsulation, réactivité, composition. Indépendantes du langage. React et Vue les implémentent en JS — mais rien, conceptuellement, n'empêche de les porter en PHP.
>
> Symfony UX fait exactement ça. Twig Components apporte la classe PHP + le template + les props typées : un composant statique, sans état. Live Components reprend cette base et y ajoute une couche d'état synchronisé entre client et serveur, plus un endpoint HTTP auto-exposé. Stimulus reste là pour les cas purement client. Et tout ça communique par un pont unique — le Stimulus bridge — qui permet à un `composer require` de livrer du JS sans que tu touches à npm."

---

## 🧭 Transition vers le chapitre 3

La vision est posée. Attaquons la **première brique** : **Twig Components**, le socle qui apporte classe PHP + template + props typées.
