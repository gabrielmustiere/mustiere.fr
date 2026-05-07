# 🧑‍💻 5. Démo live

## 🎯 Objectif du chapitre

On vient de voir **le modèle** (ch. 3–4). Avant d'attaquer tests & perf, on **ancre** tout ça dans deux séries de démos courtes pour rendre le concept tangible.

> 💡 **Pourquoi placer la démo ici ?** Parce que l'audience a maintenant le vocabulaire (`LiveProp`, `LiveAction`, cycle, morphdom) pour **lire** le code en direct. Après la démo, les sujets opérationnels (tests, perf) s'analysent sur du tangible.

---

## Slide d'intro — Démo live

Deux démos courtes pour ancrer le concept.

1. **Twig Component** — `Alert`, puis `ProductCard` avec service injecté
2. **Live Component** — un compteur, puis une recherche avec `debounce`

---

## Slide 5.1 — Démo 1 · Twig Component `Alert`

### src/Twig/Components/Alert.php

```php
#[AsTwigComponent]
final class Alert
{
    public string $message;
    public string $type = 'info';
    public bool $dismissible = false;
}
```

### templates/components/Alert.html.twig

```twig
<div class="alert alert-{{ type }}">
    <p>{{ message }}</p>
    {% if dismissible %}<button>×</button>{% endif %}
</div>
```

### Utilisation

```twig
<twig:Alert message="Bienvenue !" type="success" />
<twig:Alert message="Session bientôt expirée" type="warning" :dismissible="true" />
```

> 🔗 **Démo en live** : `app_demo` → slug `alert`

---

## Slide 5.2 — Démo 1 · `ProductCard` avec service

### src/Twig/Components/ProductCard.php

```php
#[AsTwigComponent]
final class ProductCard
{
    public function __construct(
        private PriceFormatter $formatter,
    ) {}

    public Product $product;
    public bool $showBadge = true;

    public function formattedPrice(): string
    {
        return $this->formatter->format(
            $this->product->price,
        );
    }
}
```

### templates/components/ProductCard.html.twig

```twig
<article class="product-card">
    <h3>{{ product.name }}</h3>
    <p class="price">{{ this.formattedPrice }}</p>
    {% if showBadge and product.new %}
        <span class="badge">Nouveau</span>
    {% endif %}
</article>
```

> 💬 **« Une classe + un template. Aucune nouveauté conceptuelle, mais une organisation radicalement meilleure. »**

> 🔗 **Démo en live** : `app_demo` → slug `product-card`

---

## Slide 5.3 — Démo 2 · Live `Counter`

### src/Twig/Components/Counter.php

```php
#[AsLiveComponent]
final class Counter
{
    use DefaultActionTrait;

    #[LiveProp(writable: true)]
    public int $count = 0;

    #[LiveAction]
    public function increment(): void
    {
        ++$this->count;
    }
}
```

### templates/components/Counter.html.twig

```twig
<div{{ attributes }}>
    <h2>Compteur : {{ count }}</h2>
    <button
        data-action="live#action"
        data-live-action-param="increment"
    >+1</button>
</div>
```

### Ce qu'on montre

- Clic sur `+1` → le chiffre change **sans rechargement**
- Onglet Network : l'Ajax part, la réponse HTML arrive, le DOM est **patché** (focus et scroll préservés)
- **Zéro ligne de JS** écrite à la main

> 🔗 **Démo en live** : `app_demo` → slug `counter`

---

## Slide 5.4 — Démo 2 · Recherche live

### src/Twig/Components/ProductSearch.php

```php
#[AsLiveComponent]
final class ProductSearch
{
    use DefaultActionTrait;

    #[LiveProp(writable: true)]
    public string $query = '';

    public function __construct(
        private ProductRepository $products,
    ) {}

    public function getResults(): array
    {
        return \strlen($this->query) >= 2
            ? $this->products->search($this->query)
            : [];
    }
}
```

### templates/components/ProductSearch.html.twig

```twig
<div{{ attributes }}>
    <input
        type="search"
        data-model="debounce(300)|query"
        placeholder="Rechercher…"
    >
    <ul>
        {% for product in this.results %}
            <li>{{ product.name }}</li>
        {% endfor %}
    </ul>
</div>
```

### Ce qu'on montre

- On tape → liste mise à jour en **direct**, `debounce(300)` évite de spammer le serveur
- **Aucune ligne de JS custom**, la recherche utilise directement le repository
- On peut poser un **breakpoint PHP** dans `getResults()` et débugger normalement

> 🔗 **Démo en live** : `app_demo` → slug `product-search`

---

## Slide 5.5 — Ce qui se passe en coulisses

| Outil | Ce qu'on y voit | Ce que ça confirme |
|-------|-----------------|--------------------|
| Onglet **Network** | Requête Ajax → réponse HTML partiel | Le serveur re-render, pas le client |
| **DOM inspector** | Les nœuds inchangés restent en place | morphdom patche, ne remplace pas |
| **Profiler Symfony** | Les Live actions apparaissent comme des requêtes classiques | Debug, logs, injection : normal |
| **Breakpoint Xdebug** | Arrêt dans `getResults()` ou `#[LiveAction]` | C'est du PHP, vraiment du PHP |

> 💬 **Aucun outil nouveau à apprendre.** Les outils de debug Symfony fonctionnent *tels quels* sur un Live Component.

---

## Slide 5.6 — Ce qu'on veut que vous reteniez

Trois idées à emporter après ces quatre démos, une pour chaque temps de la démarche.

### Twig Component (statique)

Une **classe** + un **template**. Aucune nouveauté conceptuelle, aucun outillage JS. On gagne déjà en lisibilité et en réutilisabilité.

### Live Component (réactif)

Les mêmes composants, plus `#[LiveProp]` et `#[LiveAction]`. La réactivité devient **gratuite** — pas de nouveau framework à apprendre.

### Adoption (incrémentale)

Une page, un formulaire, un widget à la fois. On **greffe** sur l'existant, on ne réécrit rien.

> 💬 **Le vocabulaire n'est plus abstrait.** `LiveProp`, `LiveAction`, `data-model`, morphdom : vous les avez vus s'exécuter.

---

## 🗣️ Narration (script oral)

> "Je vais volontairement choisir des démos **très simples**. Pas pour sous-estimer votre niveau, mais parce que la vraie surprise, c'est de réaliser à quel point c'est court. Une recherche live, c'est **une classe PHP de 15 lignes et un template de 10 lignes**. Quand vous la voyez fonctionner en direct, sans JS, vous comprenez pourquoi on qualifie Live Components de *game changer* pour l'écosystème Symfony.
>
> Et le plus important : aucun outil nouveau à apprendre. Le profiler Symfony voit les Live actions comme des requêtes classiques. Vous pouvez poser un breakpoint Xdebug dans une `LiveAction` et débugger comme dans un controller. C'est du PHP, vraiment du PHP."

---

## 💡 Conseils pour la démo en vrai

- **Démarrer le serveur dev avant la conf** (Symfony CLI)
- Avoir les **devtools ouverts sur Network** pour montrer les requêtes
- Préparer un **fallback** (screencast) en cas de coup dur réseau
- Montrer le **profiler Symfony** : les Live actions y apparaissent comme des requêtes classiques

---

## 🧭 Transition vers le chapitre 6

Le concept est ancré, les attributs `data-*` ne sont plus abstraits. Avant de livrer : **comment on teste, comment on profile** un Live Component ? Deux sujets qu'on retrouve systématiquement en code review et en prod.
