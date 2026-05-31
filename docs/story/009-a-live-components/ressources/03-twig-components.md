# 🧱 3. Twig Components — Le socle

## 🎯 Objectif du chapitre

Comprendre **ce qu'est un Twig Component**, comment il s'écrit, et ce qu'il apporte concrètement. C'est la **brique statique** qui répond aux deux premières douleurs du chapitre 1 : le **contrat de typage** (props typées) et l'**unité d'organisation** (classe + template).

> ⚠️ **À retenir** : un Twig Component est **statique**. Il rend une fois, côté serveur, et c'est terminé. La réactivité (état, interactions) arrive au chapitre 4 avec Live Components.

---

## Slide d'intro — Twig Components

Le socle : un composant = une classe PHP + un template Twig.

1. Structure, props, slots
2. Services injectés et méthodes calculées
3. Cycle de vie (`PreMount` / `PostMount` / template dynamique)

---

## Slide 3.1 — Une classe PHP + un template Twig

### Analogie React

| React                           | Twig Component                      |
| ------------------------------- | ----------------------------------- |
| `class Alert extends Component` | `#[AsTwigComponent] class Alert`    |
| `props`                         | propriétés publiques PHP typées     |
| `render()`                      | template `Alert.html.twig`          |
| `<Alert ... />`                 | `<twig:Alert ... />`                |
| `children`                      | `{% block content %}{% endblock %}` |

### La syntaxe d'appel

```twig
{# Syntaxe HTML-like (recommandée) #}
<twig:Alert message="Commande validée" type="success"></twig:Alert>

{# Avec slot #}
<twig:Alert type="warning">
    Ton abonnement expire dans <strong>3 jours</strong>.
</twig:Alert>
```

---

## Slide 3.2 — Anatomie d'un composant

Les deux fichiers : `src/Twig/Components/Alert.php` + `templates/components/Alert.html.twig`. La convention : le nom de la classe détermine le nom du template.

### Alert.php

```php
#[AsTwigComponent]
final class Alert
{
    public string $message = '';
    public string $type    = 'info';
    public bool   $dismissible = false;
}
```

### Alert.html.twig

```twig
<div {{ attributes.defaults({
    class: 'alert alert-' ~ type
}) }}>
    {% if dismissible %}
        <button class="alert-close">×</button>
    {% endif %}
    {{ message }}
</div>
```

> 💡 `{{ attributes }}` capture **tous les attributs HTML extra** passés depuis l'appelant (`id`, `data-*`…) et les fusionne sur l'élément racine. Sans cette ligne, ces attributs sont silencieusement ignorés.

---

## Slide 3.3 — Props : le contrat d'entrée

### Propriétés publiques = props typées

```php
#[AsTwigComponent]
final class ProductCard
{
    public string  $name     = '';
    public int     $price    = 0;
    public bool    $inStock  = true;
    public ?string $imageUrl = null;
}
```

### `#[ExposeInTemplate]` — exposer une propriété non-publique

Quand une propriété est calculée ou injectée en interne, on peut l'exposer dans le template sans la rendre publique :

```php
#[AsTwigComponent]
final class UserAvatar
{
    public User $user;

    #[ExposeInTemplate]
    private string $initials = '';

    #[PostMount]
    public function postMount(): void
    {
        $this->initials = strtoupper(
            substr($this->user->getName(), 0, 2)
        );
    }
}
```

---

## Slide 3.4 — Slots : du contenu dans un composant

C'est le mécanisme pour faire l'équivalent des `children` React ou des `slots` Vue — passer un **bloc de contenu HTML** à l'intérieur d'un composant.

### Slot principal (`block content`)

```twig
{# Card.html.twig #}
<div {{ attributes.defaults({class: 'card'}) }}>
    <div class="card-body">
        {% block content %}{% endblock %}
    </div>
</div>

{# Utilisation #}
<twig:Card class="card-featured">
    <h3>Mon produit</h3>
    <p>Description <strong>HTML</strong></p>
</twig:Card>
```

### Slots nommés (`twig:block`)

```twig
{# Modal.html.twig #}
<div class="modal">
    <div class="modal-header">
        {% block header %}{% endblock %}
    </div>
    <div class="modal-body">
        {% block content %}{% endblock %}
    </div>
    <div class="modal-footer">
        {% block footer %}
            <button>Fermer</button>
        {% endblock %}
    </div>
</div>

{# Utilisation #}
<twig:Modal>
    <twig:block name="header">
        <h2>Confirmer</h2>
    </twig:block>
    Voulez-vous supprimer ?
</twig:Modal>
```

> 💡 Le contenu sans `twig:block` atterrit dans `block content`. Chaque slot nommé peut avoir un **contenu par défaut**.

---

## Slide 3.5 — Services, méthodes calculées, `mount()`

### Services injectables + méthodes calculées

```php
#[AsTwigComponent]
final class RecentOrders
{
    public User $user;
    public int  $limit = 5;

    public function __construct(
        private readonly OrderRepository $orders
    ) {}

    public function results(): array
    {
        return $this->orders->findRecentFor($this->user, $this->limit);
    }
}
```

### `computed.` vs `this.` — un piège qui coûte en SQL

```twig
{# ❌ this. — appelé à chaque accès #}
{% for order in this.results %}
    {# 2e accès → 2e requête SQL #}
{% endfor %}

{# ✅ computed. — mis en cache pour la durée du rendu #}
{% for order in computed.results %}
    {# 2e accès → retourne le cache #}
{% endfor %}
```

### `mount()` — initialisation complexe

```php
public function mount(string|\DateTimeImmutable $start): void
{
    $this->start = is_string($start)
        ? new \DateTimeImmutable($start)
        : $start;
}
```

---

## Slide 3.6 — Cycle de vie : `PreMount`, `PostMount`, template dynamique

### `#[PreMount]` — valider avant assignation

Reçoit le tableau de données brutes, retourne le tableau modifié. Utile pour normaliser / valider via `OptionsResolver` :

```php
#[PreMount]
public function preMount(array $data): array
{
    $resolver = new OptionsResolver();
    $resolver->setDefaults(['type' => 'info']);
    $resolver->setAllowedValues(
        'type', ['info', 'success', 'warning', 'danger']
    );
    $resolver->setRequired('message');

    return $resolver->resolve($data) + $data;
}
```

### `#[PostMount]` — après assignation

```php
#[PostMount]
public function postMount(array $data): array
{
    if ($this->loading) {
        $data['disabled'] = true;
    }
    return $data;
}
```

### Template dynamique

Pour choisir le template à l'exécution — utile pour des composants polymorphes :

```php
#[AsTwigComponent(
    template: new FromMethod('getTemplateName')
)]
final class Button
{
    public string $tag = 'button';

    public function getTemplateName(): string
    {
        return match ($this->tag) {
            'a'      => 'components/Button/link.html.twig',
            'submit' => 'components/Button/submit.html.twig',
            default  => 'components/Button/button.html.twig',
        };
    }
}
```

---

## Slide 3.7 — Ce qu'on retient

Un Twig Component tient en **trois idées** :

- **Contrat** : props typées remplaçant les tableaux associatifs opaques
- **Colocation** : la classe PHP et le template vivent ensemble, on sait toujours où chercher
- **Composition** : les slots permettent de construire des composants qui en enveloppent d'autres

Mais un Twig Component reste **statique** — il rend une fois, c'est terminé. Pour un filtre qui se met à jour, un compteur, un formulaire qui valide à la frappe, il faut passer à la couche suivante.

Live Components repart de cette même base et y ajoute **un état synchronisé** et **des actions déclenchables depuis le DOM** — sans une ligne de JavaScript.

---

## 🗣️ Narration (script oral)

> "Un Twig Component, c'est exactement ce qu'on cherchait depuis les `include` et les macros du chapitre 1. Une classe PHP qui porte le contrat d'entrée avec des propriétés typées, un template Twig qui porte le markup, et un couplage net entre les deux. On peut injecter des services, écrire des méthodes calculées qui seront mises en cache pendant le rendu, valider les props avec `PreMount`, et composer des composants entre eux via les slots.
>
> Ce qui change vraiment par rapport à l'include ou à la macro, c'est le **contrat** : quand on écrit `<twig:Alert type="success" message="OK" />`, l'IDE sait exactement quelles propriétés existent, avec quels types, avec quelles valeurs par défaut. Si on passe une propriété qui n'existe pas, le bundle le dit. C'est du code qu'on peut refactorer en confiance.
>
> Et comme c'est 100 % Symfony-natif, on obtient le profiler, le var-dumper, le debug toolbar — tout ce qu'on connaît déjà. On n'apprend pas de nouvel outillage, on **étend** celui qu'on utilise."

---

## 🧭 Transition vers le chapitre 4

Un Twig Component reste statique : il rend une fois, et c'est terminé. Pour l'interactivité — un filtre qui se met à jour, un compteur, un formulaire qui valide à la frappe — il faut passer à la couche suivante.

Live Components prend exactement cette base (classe PHP + template Twig + props typées), et y ajoute deux choses : un **état synchronisé** entre client et serveur, et des **actions déclenchables depuis le DOM**. Sans écrire une ligne de JavaScript.
