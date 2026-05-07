# 🧪 6. Tests, perf & sécu

## 🎯 Objectif du chapitre

Le code marche. Place aux trois questions que la prod pose **systématiquement** :

1. **Tester** — sans démarrer un navigateur
2. **Profiler** — repérer les pièges typiques
3. **Sécuriser** — quand l'état voyage dans le DOM

> ⚠️ **À retenir** : un Live Component mal testé ou non profilé est une dette qui se paie vite en prod — chaque interaction utilisateur = une requête HTTP qui passe dans ton code. Côté sécu, la règle propre aux Live Components tient en une phrase : **l'état voyage dans le DOM, donc jamais de secret dans une `LiveProp`**.

---

## Slide d'intro — Tests, perf & sécu

Le code marche. Place aux 3 questions que la prod pose toujours :

1. **Tester** — sans démarrer un navigateur
2. **Profiler** — les pièges typiques
3. **Sécuriser** — quand l'état voyage dans le DOM

---

## Slide 6.1 — Tester un Twig Component

### Tester le rendu

```php
use Symfony\UX\TwigComponent\Test\InteractsWithTwigComponents;

final class ButtonTest extends KernelTestCase
{
    use InteractsWithTwigComponents;

    public function testRendersPrimary(): void
    {
        $rendered = $this->renderTwigComponent('Atom:Button', [
            'label'   => 'Acheter',
            'variant' => ButtonVariant::Primary,
        ]);

        self::assertStringContainsString('btn-primary', (string) $rendered);
    }
}
```

### Tester uniquement le mount

Quand on veut vérifier la **logique de classe** sans payer le coût du rendu Twig :

```php
$component = $this->mountTwigComponent('UserAvatar', [
    'user' => $this->createUser('Alice'),
]);

self::assertSame('AL', $component->initials);
self::assertStringStartsWith('https://', $component->generatedUrl);
```

### Quand tester, quoi tester

| Cas | Stratégie |
|-----|-----------|
| Composant atomic critique (Button, Alert) | Test de rendu avec quelques variantes |
| Composant avec `PreMount` / `PostMount` / services | Test du mount |
| Composant purement présentationnel (layout, Card) | Pas de test — couvert par les tests fonctionnels |
| Composant qui encapsule une règle métier | Test unitaire sur la méthode métier |

---

## Slide 6.2 — Tester un Live Component

### Tester une `LiveProp`

```php
public function testSearchFiltersResults(): void
{
    $component = $this->createLiveComponent(
        name: 'ProductSearch',
        data: ['query' => ''],
    );

    $component->set('query', 'clavier');

    $instance = $component->component();
    self::assertCount(3, $instance->getResults());

    self::assertStringContainsString(
        'Clavier mécanique',
        (string) $component->render(),
    );
}
```

### Tester une `LiveAction`

```php
public function testIncrementAction(): void
{
    $component = $this->createLiveComponent(
        'Counter',
        ['count' => 0],
    );

    $component->call('increment');
    $component->call('increment');
    self::assertSame(2, $component->component()->count);

    $component->call('reset');
    self::assertSame(0, $component->component()->count);
}
```

> 💡 Pas de navigateur, pas de headless, pas de jsdom. PHPUnit, vitesse d'un test unitaire — la même boucle instanciation / hydratation / action / rendu que le bundle exécute en prod.

---

## Slide 6.3 — L'API du `TestLiveComponent`

| Méthode | Rôle |
|---------|------|
| `set(string $prop, mixed $value)` | Modifie une LiveProp writable (re-render implicite) |
| `call(string $action, array $args = [])` | Invoque une LiveAction avec arguments `#[LiveArg]` |
| `refresh()` | Force un re-render sans action |
| `emit(string $name, array $args = [])` | Émet un événement vers un parent |
| `component()` | Retourne l'instance PHP courante |
| `render()` | Retourne le HTML courant |
| `response()` | Retourne la `Response` brute (statuts, redirections) |

### Tester une redirection

```php
$component = $this->createLiveComponent('CheckoutWizard', [
    'orderId' => 42,
]);
$component->call('confirm');

$response = $component->response();
self::assertStringContainsString(
    '/orders/42/summary',
    (string) $response->headers->get('X-Live-Redirect'),
);
```

### Tester la validation

```php
$component = $this->createLiveComponent('RegistrationForm', [
    'email' => 'not-an-email',
]);
$component->call('submit');

$instance = $component->component();
self::assertTrue($instance->hasValidationErrors());
```

> 💡 Pour les interactions qui dépendent réellement du navigateur (focus preserve, morphdom), passer par **Panther**. Dans 90 % des cas, `InteractsWithLiveComponents` suffit.

---

## Slide 6.4 — Performance : 3 erreurs à éviter

### N+1 SQL — le coût du lazy loading se répète à chaque interaction

Le template boucle sur une collection et accède à une relation non chargée (ex. `article.author`) → Doctrine exécute 1 requête par élément. Avec un Live Component, ce rendu est rejoué **à chaque requête Ajax** : un N+1 imperceptible au chargement initial peut devenir bloquant à chaque frappe.

> 🔍 **Diagnostic** : profiler Symfony → `POST /_components/*` → onglet Doctrine.

### Appels répétés aux méthodes de rendu

```twig
{# ❌ this.results appelé 2 fois = 2 requêtes SQL #}
{% if this.results is not empty %}
    <ul>{% for p in this.results %}...{% endfor %}</ul>
{% endif %}

{# ✅ assigner dans une variable Twig #}
{% set results = this.results %}
{% if results is not empty %}
    <ul>{% for p in results %}...{% endfor %}</ul>
{% endif %}
```

### Volume de requêtes réseau — contrôler quand le re-render se déclenche

```twig
{# Recherche : debounce 300 ms #}
<input data-model="debounce(300)|query" type="search">

{# Select : re-render seulement au change #}
<select data-model="on(change)|sortBy">...</select>

{# Formulaire long : on maintient l'état, on attend la soumission #}
<input data-model="norender|draft" type="text">
```

---

## Slide 6.5 — Les performances

### Ordres de grandeur sains vs alerte

| Métrique | 🟢 Sain | 🟠 À surveiller | 🔴 Alerte |
|----------|---------|-----------------|-----------|
| Temps re-render (local) | < 50 ms | 50–200 ms | > 200 ms |
| Queries Doctrine / cycle | 1–5 | 5–15 | > 15 |
| Taille payload sérialisé | < 5 KB | 5–30 KB | > 30 KB |
| Taille réponse HTML | < 30 KB | 30–100 KB | > 100 KB |

### Profiler en pratique

```bash
# 1. Laisser le profiler ouvert sur la page du composant
# 2. Interagir (taper, cliquer)
# 3. Dans /_profiler, filtrer les requêtes par URL /_components/
# 4. Pour chaque cycle :
#    - Onglet Doctrine    → nombre de queries, requêtes lentes
#    - Onglet Twig        → temps de rendu, nombre de templates
#    - Onglet Performance → temps total, goulots
```

> 💡 **Blackfire** *(non testé)* : profiler directement une `LiveAction` via le header `X-Blackfire-Query`. Recommandé pour les pages à trafic élevé.

---

## Slide 6.6 — Rien de nouveau — sauf une chose

Un Live Component, **c'est un contrôleur Symfony**. Les outils que vous utilisez déjà suffisent.

- **Tester ?** `createLiveComponent()`, on pilote avec `set()` / `call()`, on lit l'instance. Pas de navigateur.
- **Profiler ?** Chaque interaction est un POST `/_components/*` — le profiler Symfony la voit comme n'importe quelle requête.
- **Sécuriser ?** `#[IsGranted]` sur les actions, contraintes sur les `writable`, comme sur un `FormType`.

> 💬 **La seule règle propre aux Live Components** : l'état voyage dans le DOM. Donc jamais de secret dans une `LiveProp`, et on fait confiance à la signature pour le reste.

Les briques sont posées. Reste la question qui décide : **quand choisir Live Components, et quand s'en passer ?**

---

## 🗣️ Narration (script oral)

> "La bonne nouvelle avec les tests, c'est qu'un Live Component se teste comme une classe PHP. `createLiveComponent`, `set`, `call`, on observe l'instance après le cycle. Pas de navigateur, pas de headless, pas de jsdom. Les tests tournent en PHPUnit, à la vitesse d'un test unitaire.
>
> Côté perf, les deux choses à regarder systématiquement sont le nombre de queries Doctrine par re-render — le N+1 passe vite inaperçu parce qu'on l'a pas à chaque page, mais à chaque frappe clavier — et la taille de l'état sérialisé dans le DOM, qui explose dès qu'on stocke une entité complète au lieu d'un ID.
>
> Côté sécu, le mental model à garder : un Live Component, c'est un contrôleur déguisé. Tu valides comme un form, tu autorises avec `#[IsGranted]`, tu ne stockes jamais un secret dans une `LiveProp` parce que tout ce qui est dans une LiveProp finit dans le DOM. C'est du réflexe Symfony classique, appliqué à une classe qui se comporte comme un contrôleur persistant."

---

## 🧭 Transition vers le chapitre 7

On a le code, les tests, la perf. Place à la **synthèse** : quand choisir quoi, quelles limites assumer, et qu'est-ce qu'on retient au final ?
