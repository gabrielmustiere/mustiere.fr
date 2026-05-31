# 🧠 1. Problème & contexte

## 🎯 Objectif du chapitre

Faire l'**archéologie** des solutions historiques utilisées côté Symfony pour composer de l'UI : `include`, `macro`, `render(controller())`, extensions Twig, Stimulus. On regarde **ce que chaque approche résout**, **où elle s'arrête**, et on en déduit **les douleurs structurelles** que Symfony UX vient combler.

> ⚠️ **À retenir** : ces techniques **ne sont pas mortes**. Elles restent utiles pour des cas précis. Mais aucune, seule, ne fournit un vrai modèle composant.

---

## Slide d'intro — Avant Symfony UX

Avant Symfony UX, on composait l'UI avec `include`, `macro`, `render()`, form types, Stimulus…

Deux questions structurantes :

1. **Que résolvent ces outils ?**
2. **Où s'arrêtent-ils ?**

---

## Slide 1.1 — Twig `include`

### Exemple

```twig
{# templates/components/_alert.html.twig #}
<div class="alert alert-{{ type|default('info') }}">
    {{ message }}
</div>

{# Utilisation — `only` isole le contexte parent #}
{% include 'components/_alert.html.twig'
    with { type: 'error', message: 'Oops' } only %}
```

### Ce que ça résout

- ✅ Factorisation du **markup répété**
- ✅ Un seul endroit pour changer le design

### Ce que ça ne résout PAS

- ❌ **Zéro logique PHP** : le template ne sait rien faire
- ❌ Pas de contrat fort sur les props · faute de frappe = bug silencieux
- ❌ Pas d'état · `only` oublié = fuite de contexte

### Cas d'usage légitimes (aujourd'hui encore)

- Fragments purement visuels (en-tête, pied de page, snippet statique)
- Réutilisation locale à un groupe de templates

---

## Slide 1.2 — Twig `macro`

### Exemple

```twig
{# templates/macros/ui.html.twig #}
{% macro button(label, variant = 'primary', type = 'button') %}
    <button type="{{ type }}" class="btn btn-{{ variant }}">
        {{ label }}
    </button>
{% endmacro %}

{# Utilisation #}
{% import 'macros/ui.html.twig' as ui %}
{{ ui.button('Acheter', 'success') }}
```

### Ce que ça améliore

- ✅ **Signature explicite** · valeurs par défaut
- ✅ Isolation totale du contexte (contrairement à `include`)

### Ce que ça ne résout toujours pas

- ❌ Toujours **zéro PHP** · pas de services injectables
- ❌ Pas de types sur les paramètres, pas d'état
- ❌ Pas de **slots** : on ne peut pas passer un bloc Twig en paramètre

### Verdict

Progrès réel, mais toujours dans le monde Twig pur. Parfait pour les primitives sans logique (bouton, badge, label).

---

## Slide 1.3 — `render(controller(…))`

C'est la solution historique pour avoir un **"composant avec logique PHP"** : déléguer le rendu à un contrôleur dédié.

### Appel Twig

```twig
{# Dans le layout principal #}
{{ render(controller(
    'App\\Controller\\CartController::miniCart'
)) }}
```

### Contrôleur dédié

```php
public function miniCart(
    CartRepository $carts,
    Security $security,
): Response {
    $cart = $carts->findCurrentFor($security->getUser());

    return $this->render('cart/_mini_cart.html.twig', [
        'itemCount' => $cart->count(),
        'total' => $cart->total(),
    ]);
}
```

### Ce que ça résout

- ✅ **Vraie logique PHP** : DI, services, repositories
- ✅ Cache indépendant possible (ESI + Varnish)

### Ce que ça ne résout PAS

- ❌ **Sous-requête HTTP interne** à chaque rendu — event subscribers rejoués
- ❌ Coût qui explose sur une page à 10–15 fragments
- ❌ DX médiocre : route + action + template dispersés

### Cas d'usage légitimes (aujourd'hui)

- Fragments avec **politique de cache différente** (ESI + Varnish)
- Fragments chargés **en lazy** côté client via `render_hinclude`

---

## Slide 1.4 — Twig extension

> 💡 Idée : enregistrer une fonction Twig qui génère du HTML.

### La fonction PHP

```php
// UiExtension.php
new TwigFunction('badge', [$this, 'renderBadge'], ['is_safe' => ['html']]),

public function renderBadge(string $label, string $color = 'gray'): string
{
    return sprintf(
        '<span class="badge badge-%s">%s</span>',
        htmlspecialchars($color),
        htmlspecialchars($label),
    );
}
```

### L'usage dans le template

```twig
{{ badge('Nouveau', 'green') }}
{{ badge(product.status, 'red') }}
```

L'appel est propre… mais **le markup vit dans une string PHP** :

- impossible à lire / modifier sans toucher au PHP
- pas de slots, pas d'IDE qui autocomplète le HTML
- chaque nouveau composant = une nouvelle fonction dans le namespace Twig global

### Verdict

Bon outil pour des helpers de formatage (date, slug, prix). Mauvais outil pour un composant d'UI.

---

## Slide 1.5 — Template Twig + contrôleur JS (Stimulus)

> 💡 Ajouter de l'interactivité via Stimulus : le template déclare **qui fait quoi** via des attributs `data-`. Un contrôleur JS écoute et agit — sans toucher au HTML.

### Twig — le markup

```twig
{# data-controller="search" → active le contrôleur JS #}
<div data-controller="search"
     data-search-url-value="{{ path('app_search') }}">

    {# data-action → appelle search#query à chaque frappe #}
    <input type="text"
           data-action="input->search#query"
           data-search-target="input">

    {# la liste vide — remplie par le JS #}
    <ul data-search-target="results"></ul>
</div>
```

### JS — le comportement

```javascript
export default class extends Controller {
  static targets = ['input', 'results'];
  static values = { url: String };

  async query() {
    // appelle l'endpoint PHP, reçoit du HTML
    const r = await fetch(`${this.urlValue}?q=${this.inputTarget.value}`);
    // injecte le HTML dans la liste
    this.resultsTarget.innerHTML = await r.text();
  }
}
```

### Ce que ça résout

- ✅ **Vraie interactivité** côté client
- ✅ Séparation markup / comportement propre

### Ce que ça ne résout PAS

- ❌ **Double codebase** : validation, formatage souvent dupliqués PHP + JS
- ❌ Un endpoint dédié + du boilerplate par comportement
- ❌ État client et état serveur peuvent diverger

### Cas d'usage légitimes (aujourd'hui, et demain)

- Comportements purement visuels : ouvrir un menu, copier dans le presse-papier, toggler une classe
- Dans Symfony UX, Stimulus reste là — mais **uniquement** pour ces cas

---

## Slide 1.6 — Ce qui manque à toutes ces approches

Trois douleurs transversales émergent de l'inventaire :

1. **Pas de contrat de typage** entre la vue et ses données d'entrée.
   Pas d'autocomplétion, pas d'erreur statique, refactor dangereux.

2. **Pas d'unité d'organisation** naturelle.
   Logique, markup et comportement dispersés sur 3–4 fichiers dans des dossiers différents.

3. **Pas de réactivité server-driven**.
   Pour un comportement qui dépend de l'état serveur, on sort de Symfony et on réimplémente côté client.

> 💬 **Symfony UX comble ces faiblesses en deux temps** :
> **Twig Components** (unité + props typées) · **Live Components** (réactivité server-driven).

---

## 🗣️ Narration (script oral)

> "Avant Symfony UX, on composait l'UI avec une boîte à outils hétéroclite : `include` pour factoriser le markup, `macro` pour ajouter une signature, `render(controller())` quand on voulait du PHP, des extensions Twig pour des helpers, du Stimulus pour l'interactivité. Chaque outil résout un morceau, aucun ne résout l'ensemble.
>
> Le résultat : pour un seul bloc d'UI un peu vivant — un filtre, un panier, un formulaire dynamique — on se retrouve avec une classe PHP, un template, un contrôleur Stimulus, un endpoint Ajax, et de la logique métier dupliquée des deux côtés. C'est cette friction qui pousse beaucoup d'équipes à attaquer du React 'juste pour cette zone-là' — et à se retrouver avec deux stacks à maintenir.
>
> Trois douleurs structurelles ressortent : pas de contrat de typage, pas d'unité d'organisation, pas de réactivité server-driven. C'est exactement à ces trois douleurs que Twig Components et Live Components vont répondre."

---

## 🧭 Transition vers le chapitre 2

Avant de plonger dans les briques de Symfony UX, un court détour : **qu'est-ce qu'on emprunte au modèle composant JS moderne**, et **comment on le traduit en PHP** ?
