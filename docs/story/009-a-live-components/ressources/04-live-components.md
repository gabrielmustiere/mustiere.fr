# ⚡ 4. Live Components — Le game changer

## 🎯 Objectif du chapitre

Comprendre **ce qui rend un composant "Live"**, pourquoi c'est un vrai changement de jeu côté Symfony, et **comment l'état circule** entre le client et le serveur sans une ligne de JS.

Ce chapitre absorbe le **cycle technique complet** d'un Live Component (ex-chapitre 5 du plan original) : en 11 slides, on couvre l'écosystème HTML-over-the-wire, les briques (`LiveProp`, `LiveAction`, `data-model`), le cycle en deux phases, l'anatomie réelle, et les features avancées du bundle.

> ⚠️ **À retenir** : Live Components est une **surcouche** de Twig Components, pas un remplacement. Tout ce qu'on a vu au chapitre 3 reste vrai — on ajoute une couche de **réactivité** quand on en a besoin. C'est de l'**opt-in**, composant par composant.

---

## Slide d'intro — Live Components

1. D'où ça vient : la famille **HTML-over-the-wire**
2. Les briques : `LiveProp`, `LiveAction`, data binding
3. Comment l'état circule sans écrire de JS

---

## Slide 4.1 — La famille HTML-over-the-wire

Live Components n'est pas un OVNI. Il s'inscrit dans une **famille d'approches** émergée entre 2018 et 2022.

> 💬 **« Server-driven UI »** : l'état de vérité vit côté serveur, le client n'est qu'une projection, on échange du **HTML** plutôt que du JSON.

| Solution               | Stack              | Année | Idée centrale                         |
| ---------------------- | ------------------ | ----- | ------------------------------------- |
| **Phoenix LiveView**   | Elixir             | 2018  | État serveur, diffs via WebSocket     |
| **Hotwire / Turbo**    | Rails (agnostique) | 2020  | Turbo Frames / Streams                |
| **Laravel Livewire**   | PHP / Laravel      | 2020  | Composant PHP réactif, requête HTTP   |
| **htmx**               | Agnostique         | 2020  | Attributs HTML → fragments            |
| **UX Live Components** | PHP / Symfony      | 2022  | Modèle Livewire-like, idiomes Symfony |

### Ce que cette famille refuse

- Double codebase PHP + JS
- Hydration coûteuse d'un SPA
- Écosystème JS séparé (build, types, tests)
- SEO compliqué des SPAs

### Ce qu'elle assume

- Un round-trip HTTP par interaction (OK pour 90 % des UIs métier)
- Dépendance au réseau (moins offline-friendly)
- Moins adapté au canvas, drag & drop, 60 fps

---

## Slide 4.2 — Trois briques, zéro JavaScript

Un **Live Component**, c'est un Twig Component augmenté de **trois briques**. Rien d'autre à écrire côté client.

### `LiveProp` — état

Une propriété PHP **synchronisée** entre le client et le serveur. Elle se sérialise dans le DOM, revient dans chaque payload, rejoue le rendu.

### `LiveAction` — verbe

Une méthode PHP **déclenchable depuis le DOM**. L'autowiring fonctionne, le routing est auto-exposé, le CSRF est géré.

### `data-model` — liaison

Un attribut Twig qui **lie un input à une `LiveProp`** et déclenche un re-render — équivalent du `v-model` de Vue.

> 💬 **Trois briques : un état, un verbe, une liaison.**

---

## Slide 4.3 — Sans Live · Avec Live

Concrètement, voilà ce qu'on **arrête d'écrire** dès qu'on passe en Live.

| Sans Live                                    | Avec Live                   |
| -------------------------------------------- | --------------------------- |
| Écrire un endpoint Ajax dédié                | **Aucun endpoint** à écrire |
| Définir un format de réponse (JSON ? HTML ?) | **Du HTML**, c'est tout     |
| Réimplémenter la logique en JS               | La logique reste **en PHP** |
| Mettre à jour le DOM à la main               | **DOM morphing** (morphdom) |
| Gérer CSRF, sécurité, sérialisation          | **Géré par le bundle**      |

> 💬 **On garde Symfony. On gagne l'interactivité. On laisse le JS custom.**

---

## Slide 4.4 — Le cycle en deux phases

C'est le **moteur** : ce qui se passe entre le clic utilisateur et le DOM patché.

### Phase 1 — rendu initial (une fois)

```
Navigateur           Serveur PHP
    │                     │
    │── GET /ma-page ────►│  instancie le composant
    │                     │  Twig render
    │                     │  sérialise l'état dans le DOM
    │◄── HTML complet ────│
    │
    │  Le composant n'existe plus côté serveur.
    │  Son état est encodé dans le HTML rendu.
```

### Phase 2 — cycle interaction (à chaque action)

```
Navigateur           Serveur PHP
    │                     │
    │  [clic ou input]    │
    │── POST /_components►│  reconstruit le composant
    │   état + action     │  Twig re-render
    │◄── HTML partiel ────│  sérialise le nouvel état
    │
    │  morphdom patche uniquement les nœuds modifiés.
```

### Stimulus lit le DOM et envoie

```json
{
  "props": {
    "query": "",
    "@attributes": {
      "id": "live-1630620926-0"
    },
    "@checksum": "rZqkfjCx6svzp7p1xYbt9lwLJ2IrEzLkUZC5n/EXj5Q="
  },
  "updated": {
    "query": "cl"
  }
}
```

> 💬 Entre deux requêtes, **le composant n'existe pas côté serveur**. Il est reconstruit à chaque cycle à partir de l'état sérialisé dans le DOM.

### ⚠️ Implications pour un lead dev

- **Aucun état implicite** entre deux requêtes → variables d'instance non `LiveProp` : perdues à chaque cycle
- **`LiveProp writable` = entrée utilisateur** → valider comme un champ de formulaire
- **Chaque action = un round-trip** → debounce obligatoire sur les inputs texte
- **Taille de l'état sérialisé** → pas d'entité complète dans une `LiveProp`, stocker un ID et recharger
- **Listes sans id stable** → morphdom crée des bugs visuels subtils. Toujours `id="item-{{ item.id }}"`
- **Idempotence** souhaitée → une action peut être rejouée si le client retry

---

## Slide 4.5 — Anatomie d'un Live Component

Concrètement, on peut voir ça comme **un gros controller ++**.

### src/Twig/Components/ProductSearch.php

```php
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
final class ProductSearch
{
    use DefaultActionTrait;

    #[LiveProp(writable: true)]
    public string $query = '';
}
```

### templates/components/ProductSearch.html.twig

```twig
<div {{ attributes }}>
    <input type="search" data-model="query" placeholder="Rechercher…">

    <ul>
        {% for product in this.results %}
            <li>{{ product.name }}</li>
        {% endfor %}
    </ul>
</div>
```

### Quatre détails cruciaux

- **`#[AsLiveComponent]`** remplace `#[AsTwigComponent]`
- **`DefaultActionTrait`** active le re-render sans action explicite
- **`{{ attributes }}`** injecte `data-controller="live"`, l'état sérialisé et le CSRF
- **`data-model`** lie l'input à la prop (équivalent `v-model`)

---

## Slide 4.6 — `LiveProp` · quatre niveaux de puissance

### 1 · Read-only (défaut)

```php
#[LiveProp]
public int $max = 1000;
```

La valeur **persiste entre re-renders**, mais le client ne peut pas la modifier.

### 2 · Writable (input user)

```php
#[LiveProp(writable: true)]
public string $query = '';
```

Modifiable via `data-model` → **déclenche le re-render**. C'est le mode « input de recherche, filtre, case à cocher ».

### 3 · Writable sélectif (objets)

```php
#[LiveProp(writable: ['name', 'email'])]
public ContactDto $contact;
```

Seuls les champs listés sont **exposés à l'écriture**. Pas d'accès implicite au reste de l'objet — whitelist explicite.

### 4 · URL binding (shareable)

```php
#[LiveProp(writable: true, url: true)]
public string $sort = 'name';
```

Reflétée en query string `?sort=…` : **URL partageable, back button, bookmarkable**.

> 💬 **Read-only par défaut. Puissance opt-in.** La sécurité est dans la convention, pas dans la vigilance.

### Hydration / déshydration custom

Pour les objets non-scalaires (entités, value objects, DTOs), on peut surcharger le comportement par défaut du Symfony Serializer :

```php
#[LiveProp(
    writable: true,
    hydrateWith: 'hydrateProduct',
    dehydrateWith: 'dehydrateProduct',
)]
public Product $product;

public function dehydrateProduct(Product $product): int
{
    return $product->getId();
}

public function hydrateProduct(int $id, ProductRepository $repo): Product
{
    return $repo->find($id) ?? throw new \RuntimeException('Product not found');
}
```

> ⚠️ Sans déshydration custom, une entité Doctrine entière serait sérialisée en JSON dans le DOM. **Stocker un ID** est plus léger, plus sûr, et évite les problèmes de cycles.

---

## Slide 4.7 — `LiveAction` · une méthode, un endpoint

Une méthode PHP annotée devient un **endpoint HTTP**. Pas de route à déclarer, pas de JSON à parser.

### 1 · Minimale (le verbe)

```php
#[LiveAction]
public function increment(): void
{
    $this->count++;
}
```

Une méthode → **un endpoint POST** auto-exposé, re-render du composant inclus.

### 2 · Arguments typés (`LiveArg`)

```php
#[LiveAction]
public function addToCart(
    #[LiveArg] int $productId,
): void
```

Passés depuis le DOM, **typés et validés** côté PHP.

### 3 · Autowiring (services)

```php
#[LiveAction]
public function save(
    EntityManagerInterface $em,
): void
```

Injection de services **comme dans un controller** : repositories, mailer, logger… rien à configurer.

> 💬 **Une méthode PHP = un endpoint.** CSRF, re-render, hydration — offerts. Pas de route, pas de JSON, pas d'Ajax à la main.

---

## Slide 4.8 — `data-model` : binding

`data-model` lie un input à une `LiveProp`. Le modificateur décide **quand** déclencher un re-render.

| Syntaxe                     | Quand l'utiliser                                          |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `data-model="query"`        | Re-render à chaque frappe — _à éviter sur un champ texte_ |
| `data-model="debounce(300)  | query"`                                                   | Recherche live — 1 requête après 300 ms d'inactivité |
| `data-model="on(change)     | email"`                                                   | Formulaires — re-render au blur / au changement      |
| `data-model="norender       | message"`                                                 | Maintenir l'état côté client sans re-render          |
| `data-model="contact.name"` | Sous-propriété d'un objet (nécessite `writable: [...]`)   |

> 💬 **Une boucle HTTP par frappe est un choix, pas une fatalité.**

---

## Slide 4.9 — La mise à jour du DOM

À chaque re-render, le bundle renvoie le **markup complet** du composant. Côté client, **morphdom** applique un diff ciblé — pas une reconstruction complète.

### Le focus

L'input en cours de saisie **reste actif**. L'utilisateur ne perd pas le fil pendant que le serveur répond.

### Le scroll

La position de scroll est **préservée**. Pas de retour en haut de page après chaque interaction.

### Les inputs non touchés

Un champ tapé pendant le re-render **n'est pas écrasé**. Classes CSS et events des nœuds inchangés sont conservés.

> 💬 **C'est le bénéfice invisible : « juste ça marche ».**

### Contrôler le morphing

```html
{# Exclure un élément du morphing (animation JS, éditeur riche) #}
<div data-live-ignore>Ce contenu n'est jamais touché par morphdom.</div>

{# Sur les listes : id stable obligatoire pour éviter les bugs visuels #} {% for
item in items %}
<li id="item-{{ item.id }}">{{ item.name }}</li>
{% endfor %}
```

---

## Slide 4.10 — Ce que le bundle offre en plus

### Loading states

```twig
<button data-action="live#action" data-live-action-param="save">
    <span data-loading="hide">Enregistrer</span>
    <span data-loading="show">Enregistrement…</span>
</button>
```

### Polling

```twig
<div {{ attributes }} data-poll="delay(5000)|$render">
    Notifications : {{ count }}
</div>
```

### Emit / Listen — composants imbriqués

```php
// enfant
$this->emit('product:added', ['id' => $id]);

// parent
#[LiveListener('product:added')]
public function onAdded(#[LiveArg] int $id): void
{
    // ...
}
```

### Hooks de cycle de vie

```php
#[PreReRender]
public function beforeRender(): void
{
    $this->lastRenderedAt = new \DateTimeImmutable();
}

// Hooks disponibles : PostMount · PostHydrate · PreReRender · PreDehydrate
```

| Hook              | Render initial | Re-render Ajax | Moment                           |
| ----------------- | :------------: | :------------: | -------------------------------- |
| `#[PostMount]`    |       ✅       |       ❌       | Après instanciation + mount()    |
| `#[PostHydrate]`  |       ❌       |       ✅       | Après hydratation des LiveProp   |
| `#[PreReRender]`  |       ❌       |       ✅       | Juste avant le re-render Twig    |
| `#[PreDehydrate]` |       ✅       |       ✅       | Avant la sérialisation des props |

> 💬 **Loading, polling, events, hooks : tout est déjà dans le bundle.**

---

## Slide 4.11 — Ce qu'on retient

Un Live Component tient en **trois briques** : **`LiveProp`** pour l'état, **`LiveAction`** pour les actions, **le morphing** pour préserver l'UI entre deux renders.

La vérité reste côté serveur — **pas de Virtual DOM, pas de store, pas d'hydratation**. Une annotation `#[AsLiveComponent]`, et un composant Twig devient réactif.

On garde Symfony. On gagne l'interactivité. On laisse la complexité SPA de côté.

> **Place à la démo : tout ça en live dans un navigateur.**

---

## 🗣️ Narration (script oral)

> "Ce qui change tout avec Live Components, c'est qu'on **ne sort plus de l'écosystème Symfony** pour faire de l'interactivité. L'état du composant vit côté serveur, il est synchronisé automatiquement, et les actions sont de simples méthodes PHP. Pour un dev Symfony, c'est une continuité totale : mêmes outils, mêmes patterns, même debug avec le profiler.
>
> Concrètement, tu prends un Twig Component, tu changes l'attribut `#[AsTwigComponent]` en `#[AsLiveComponent]`, tu ajoutes le `DefaultActionTrait`, et tu marques les propriétés que tu veux synchroniser avec `#[LiveProp]`. Côté template, tu poses un `data-model` sur un input, et c'est tout. Tu n'écris **pas** de JavaScript. Tu n'écris **pas** d'endpoint. Tu n'écris **pas** de format JSON.
>
> Le mental model à garder : un Live Component est **stateless côté serveur**. Il n'y a pas d'objet qui attend entre deux requêtes. À chaque cycle Ajax, la classe est re-instanciée, les props sont re-hydratées depuis ce que le client a renvoyé, l'action s'exécute, Twig re-rend, et l'état repart dans le HTML.
>
> Ça a deux conséquences directes : tout ce qui doit persister doit être une `LiveProp`, et tout ce qui vient du client est une entrée utilisateur — pas de confiance implicite."

---

## 🧭 Transition vers le chapitre 5

On a vu **ce qu'est** un Live Component, **comment il s'écrit**, **comment l'état circule** et **ce qu'il propose** comme features. Place à la démo : deux pas de quatre minutes pour ancrer le vocabulaire dans du code qui s'exécute, et voir tous ces concepts en action dans un navigateur.
