# 🧭 12. Positionnement stratégique (mindset lead dev)

## 🎯 Objectif du chapitre

Sortir de la technique pure et adopter un **regard de lead / architecte** : quand, pourquoi, comment introduire Symfony UX dans une équipe existante, et où poser la frontière avec un framework JS.

Quatre questions structurantes pour tout le chapitre :

1. **Pour un écran donné**, quelle brique choisir par défaut — Twig, Live, ou React/Vue ?
2. **Pour une équipe existante**, par où commencer sans prendre de risque fonctionnel ?
3. **Pour un design system**, comment l'organiser pour qu'il tienne dans la durée ?
4. **Pour une gouvernance**, quelles règles afficher pour que l'équipe livre en autonomie ?

> ⚠️ **À retenir** : ce chapitre n'est **pas** une checklist à appliquer aveuglément. C'est un cadre d'arbitrage. Le vrai livrable d'un lead, c'est une **décision défendable**, pas un dogme.

---

## Slide 12.1 — Quand choisir quoi ?

### La matrice complexité × interactivité

```
  Interactivité
  (richesse UI)
      ▲
 haut │                     │  SPA complète
      │                     │  (React/Vue + API)
      │                     │
      │        Live + îlots │
      │        React ciblés │
      │─────────────────────┼──────────────────▶
      │                     │
      │   Twig + Live       │  Live Components
      │   Components        │  (CRUD, filtres,
      │                     │   formulaires riches)
      │                     │
  bas │   Twig Components   │
      │   uniquement        │
      └─────────────────────┴──────────────────▶
         faible                haut    Complexité
                                       métier
```

**Lecture** : la vaste majorité des apps Symfony en production vit dans le **cadran bas-gauche** et **bas-droite**. Le cadran haut-droite (SPA) est réel mais rare — et souvent **surestimé** lors de la décision initiale.

> 🧭 Le **tableau "où brille chaque approche"** — par feature et par type d'app — est repris dans la **synthèse (chapitre 8.1)** du talk principal. Ici, on se concentre sur le **raisonnement lead dev** : quelles questions se poser avant de trancher, et comment défendre la décision dans 12 mois.

### Les 4 questions à se poser par écran

1. **Est-ce que l'UI a besoin d'un état client riche ?** (undo/redo, draft non sauvegardé, sélection multiple complexe, drag & drop libre)
2. **Est-ce que les interactions doivent être instantanées ?** (feedback en < 16 ms, pas 100–300 ms)
3. **Est-ce qu'on a besoin de fonctionner offline ?** (PWA, terrain mobile, mode avion)
4. **Est-ce que l'équipe a l'expertise front pour maintenir du React/Vue dans la durée ?**

> Si on répond **non** à la plupart → **Symfony UX suffit (et gagne)**.

### Le test du "1 an plus tard"

Avant de choisir React pour un écran, demande-toi : **dans 12 mois, qui va maintenir ce code ?**

- Si c'est la même équipe PHP → Live
- Si une équipe front dédiée est en place → arbitrage plus ouvert
- Si l'équipe va tourner et perdre son expertise React → Live

---

## Slide 12.2 — Stratégies d'adoption

### 🟢 Stratégie 1 : adoption progressive (**recommandée**)

**Principe** : on n'arrête pas la prod, on **incruste** Symfony UX là où la douleur est la plus forte, et on avance par petites itérations de valeur.

#### Phase 1 — Extraire le design system en Twig Components (0–1 mois)

- On part des **primitives visuelles** répétées : `Button`, `Badge`, `Alert`, `Card`, `FormField`
- Un composant = une classe + un template, rien de plus
- On **ne touche pas** à la logique métier
- Quick wins immédiats :
  - Cohérence visuelle enfin garantie
  - L'équipe apprend la syntaxe `<twig:...>` sur des cas triviaux
  - Diff Git propre (plus de markup dupliqué)

**Critère de succès de la phase 1** : 10–15 composants en place, utilisés dans au moins 3 pages.

#### Phase 2 — Remplacer les zones "Stimulus/Ajax bricolé" par du Live (1–3 mois)

- Identifier les **widgets JS custom** : search, filtres, mini-forms, validation temps réel, auto-complétion maison
- Les **réécrire en Live Component** un par un, avec **feature flag** si possible
- **Supprimer** le JS correspondant au fur et à mesure (sinon la dette reste)

**Critère de succès de la phase 2** : -50 % de lignes de JS custom, premiers Live en prod sans incident.

#### Phase 3 — Standardiser sur de nouveaux patterns (3 mois+)

- Toute nouvelle UI interactive → **Live Component par défaut**
- React/Vue uniquement pour les cas **explicitement justifiés** (validés par le lead)
- Documenter la règle dans le `CONTRIBUTING.md` ou le `CLAUDE.md` de l'équipe

**Critère de succès de la phase 3** : aucun nouvel endpoint Ajax custom créé depuis 3 mois.

### 🟠 Stratégie 2 : big bang

- Migrer toute l'UI d'un coup
- **Rarement recommandé** : risque élevé pour gain incertain
- **Acceptable seulement** sur une **réécriture complète** déjà planifiée (ex. passage Symfony 4 → 7)
- Si tu y vas : **figeler les specs** avant, tests E2E d'abord, migration écran par écran

### 🔴 Anti-patterns de migration

- ❌ **"On met du Live partout, on verra plus tard"** → régression de perf garantie, équipe perdue
- ❌ **Réécrire un écran React en Live** sans parler au métier → tu vas perdre des features cachées
- ❌ **Mélanger Live et un controller Stimulus custom qui manipule le DOM du Live** → conflits de morphing, debug cauchemardesque
- ❌ **Laisser coexister deux design systems** (Bootstrap patché + Twig Components) → supprimer l'ancien au fur et à mesure, pas de demi-mesure durable

---

## Slide 12.3 — Construire un design system Twig

### Pourquoi c'est le premier chantier à lancer

- **Investissement faible, ROI élevé** : on livre immédiatement de la cohérence visuelle
- **Montée en compétence** naturelle de l'équipe sur Twig Components
- **Prépare le terrain** pour Live (mêmes conventions, même layout de dossiers)
- **Réduit la dette** existante sans introduire de nouveau risque

### Arborescence recommandée (atomic design)

```
src/Twig/Components/
├── Atom/               # composants atomiques
│   ├── Button.php
│   ├── Badge.php
│   ├── Icon.php
│   └── Spinner.php
├── Molecule/           # composés
│   ├── Alert.php
│   ├── Card.php
│   ├── FormField.php
│   └── Breadcrumb.php
├── Organism/           # blocs complexes
│   ├── Navbar.php
│   ├── ProductList.php
│   ├── Sidebar.php
│   └── DataTable.php
└── Live/               # Live Components (opt-in)
    ├── Counter.php
    ├── ProductSearch.php
    └── Cart.php

templates/components/
└── (même arborescence miroir)
```

**Principe clé** : le **nom de la classe** dicte le chemin du template. Aucune configuration manuelle.

### Typer les props strictement

```php
<?php

declare(strict_types=1);

namespace App\Twig\Components\Atom;

use App\Enum\ButtonVariant;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
final class Button
{
    public string $label;
    public ButtonVariant $variant = ButtonVariant::Primary;
    public bool $disabled = false;
    public ?string $icon = null;
}
```

- Props **typées** PHP 8 (pas de `mixed`, pas de tableau magique)
- **Enums backed** pour les variantes (`Primary`, `Secondary`, `Danger`…)
- Pas d'`array` d'options informe : préférer des **propriétés explicites**

### Documenter les composants

Deux approches complémentaires :

1. **Playground `ux-twig-component`** — page `/twig-components/playground` (dev only) listant chaque composant avec ses variations
2. **Stories par composant** : un fichier Twig dédié qui présente les principales variantes côte à côte

```twig
{# templates/_storybook/button.html.twig (exemple interne) #}
<h2>Button</h2>

<twig:Atom:Button label="Primary" />
<twig:Atom:Button label="Secondary" variant="secondary" />
<twig:Atom:Button label="Disabled" :disabled="true" />
<twig:Atom:Button label="Avec icône" icon="check" />
```

### Tester les composants critiques

```php
public function testButtonRendersVariant(): void
{
    $rendered = $this->renderTwigComponent('Atom:Button', [
        'label' => 'Acheter',
        'variant' => ButtonVariant::Primary,
    ]);

    self::assertStringContainsString('btn-primary', $rendered);
    self::assertStringContainsString('Acheter', $rendered);
}
```

- **Tests de rendu** pour les composants critiques (Button, FormField, DataTable)
- **Tests fonctionnels** pour les Live Components (via `LiveComponentTestCase`)
- Pas besoin de tester **chaque** composant — cibler ceux dont la régression casse plusieurs écrans

### Versionner (si partagé entre apps)

- Design system dans un **package Composer interne** (monorepo ou registry privé)
- SemVer rigoureux : un changement de prop = bump mineur, une suppression = bump majeur
- Changelog tenu à jour, **migration guide** pour les breaking changes

---

## Slide 12.4 — Introduire Symfony UX dans une équipe existante

### Les trois profils à gérer

| Profil | Résistance potentielle | Comment embarquer |
|--------|-----------------------|-------------------|
| **Dev backend PHP** | Aucune en général, l'adoption est naturelle | Pair-programming sur un premier composant |
| **Dev front React/Vue** | "Je vais perdre mon expertise" | Montrer les îlots `ux-react` : leur skill reste utile |
| **Dev fullstack habitué au bricolage** | "Je sais déjà faire en Stimulus custom" | Démontrer le gain en lignes sur **son propre code** |

### Onboarding concret

1. **Session de 1 h** : démo live (reprendre le chapitre 6 du talk principal) + Q&A
2. **Atelier de 2–3 h** : chaque dev écrit **son premier Twig Component** (un `Badge`, un `Alert`) puis **son premier Live Component** (un filtre de liste)
3. **Premier ticket dédié** : chaque dev prend une zone existante et la convertit — code review serrée par le lead

### Template de pull request à mettre en place

```markdown
## Changements
- [ ] Nouveau composant Twig : <nom>
- [ ] Nouveau Live Component : <nom>
- [ ] Suppression de JS custom : <fichier>

## Checklist
- [ ] Props typées PHP (pas de mixed)
- [ ] Template dans `templates/components/<chemin>` miroir de la classe
- [ ] Pas de `render(controller())` introduit
- [ ] Tests de rendu si composant critique
- [ ] Pas de JS custom ajouté sans justification

## Justification si React/Vue introduit
(obligatoire, à faire valider par le lead)
```

### Piège classique

❌ **Laisser l'équipe apprendre en autonomie sans feedback loop** → chacun réinvente ses conventions, le design system diverge. Prévoir une **code review dédiée aux composants** les 2–3 premiers mois.

---

## Slide 12.5 — Poser une gouvernance claire

### Règles à afficher dans le `CONTRIBUTING.md` / `CLAUDE.md` de l'équipe

1. **Markup répété ≥ 2 fois** → Twig Component (pas d'include ou de macro pour un nouveau cas)
2. **Interactivité nécessitant du JS** → d'abord envisager Live, React/Vue seulement si **justifié par écrit**
3. **Pas de `render(controller())`** dans les nouveaux développements (sauf cache ESI explicite)
4. **Pas de Twig extension** pour générer du markup (les extensions restent pour les helpers purs : formatage, slug, label d'enum)
5. **Props typées PHP** obligatoires : pas de tableau associatif magique
6. **Pas de manipulation DOM custom** à l'intérieur d'un Live Component (sauf cas documenté)

### Processus d'arbitrage pour les cas limites

```
Un cas semble justifier React ?
        │
        ▼
[1] Peut-on le faire en Live avec un pattern connu (debounce, modal, flux…) ?
        │            │
       oui          non
        │            │
        ▼            ▼
    Live par     [2] Est-ce un vrai besoin métier (offline, 60fps, éditeur) ?
    défaut           │            │
                    oui          non
                     │            │
                     ▼            ▼
                 Îlot React   Retravailler le besoin
                 documenté    avec le métier
                 + validé
                 par le lead
```

### Qui décide ?

- Un **architecte / lead** arbitre les cas limites (documenté dans l'ADR)
- Les devs livrent avec **autonomie** dans le cadre fixé — le lead n'est pas un goulot d'étranglement sur chaque PR
- Une **revue trimestrielle** du design system : ce qui a été ajouté, ce qui a été supprimé, règles à ajuster

### ADR (Architecture Decision Record) type

À écrire au moment où on introduit Symfony UX :

```markdown
# ADR-00X : Adoption de Symfony UX comme couche composant

## Contexte
<la situation avant : patchwork de macros, includes, Stimulus…>

## Décision
Adopter Twig Components + Live Components comme standard pour toute nouvelle UI.
React/Vue autorisés uniquement pour <cas documentés>.

## Conséquences
- Positives : <cohérence, DX, moins de JS>
- Négatives : <courbe d'apprentissage, latence HTTP sur Live>

## Alternatives étudiées
- SPA React complète : écartée car <raison>
- Rester en macros + Stimulus custom : écarté car <raison>
```

---

## Slide 12.6 — Le piège "React par défaut"

### Le coût caché de React dans une app Symfony "classique"

| Dimension | Surcoût concret |
|-----------|-----------------|
| **Stack** | 2 écosystèmes à maintenir (Composer + npm/yarn) |
| **Modèles** | DTO PHP + types TS dupliqués, désynchronisation fréquente |
| **Build** | 2 pipelines CI (PHPStan/PHPUnit + ESLint/Vitest/TSC) |
| **Équipes** | souvent front + back séparées → coordination, lag, bugs d'intégration |
| **Recrutement** | 2 compétences à chercher, coûts doublés |
| **Onboarding** | 2× le temps pour qu'un dev soit autonome sur toute la stack |
| **Design system** | risque d'en maintenir **deux** (un Twig, un React) |

**Ordre de grandeur** sur une équipe de 5 devs : +30 à +50 % de temps de coordination pour des gains UX souvent imaginaires.

### Quand ce coût est justifié

- ✅ UI réellement riche (collaborative temps réel, éditeur WYSIWYG, canvas, timeline vidéo)
- ✅ Besoin offline / PWA
- ✅ Équipe **dimensionnée** pour ça (au moins 2 devs front solides + design system React maintenu)
- ✅ ROI clair **pour l'utilisateur final** (pas juste pour l'équipe qui trouve ça "plus sexy")

### Quand ce coût n'est **pas** justifié

- ❌ Backoffice CRUD standard
- ❌ App interne à faible concurrence d'usage
- ❌ MVP où chaque heure compte
- ❌ SaaS B2B classique (formulaires, listings, tableaux de bord)
- ❌ "Parce que c'est moderne" / "Parce que le marché recrute mieux en React"

### Cas vécu (à raconter en conf si l'occasion se présente)

> Une équipe de 4 devs PHP + 2 devs React sur un backoffice SaaS. 18 mois de dev, 3 incidents de désync DTO/TS en prod, design system doublé. Migration vers Live Components sur 4 mois : **-60 % de lignes de JS, -1 pipeline CI, équipe unifiée, vélocité × 1,5**.

---

## Slide 12.7 — Arbitrer les cas limites

### Arbre de décision consolidé

```
Nouvelle UI à construire
        │
        ▼
Est-ce interactif ?
        │
    ┌───┴───┐
   non      oui
    │       │
    ▼       ▼
Twig      Besoin d'état côté serveur ?
Component  (filtres, formulaire, validation…)
              │
          ┌───┴───┐
         oui      non
          │       │
          ▼       ▼
       Live    Besoin purement client ?
       Component  (toggle, clipboard, modale statique)
                    │
                ┌───┴───┐
               oui      non
                │       │
                ▼       ▼
            Stimulus   Cas rare ?
            controller  → questionner le besoin
                         avec le métier
                         │
                         ▼
                      Si vrai besoin
                      (offline, 60fps, éditeur)
                         │
                         ▼
                      Îlot ux-react/vue
                      documenté
```

### Checklist "je suis sur le point de choisir React"

Avant de valider le choix, répondre à **5 questions** par écrit dans la PR :

1. **Quel besoin métier précis** n'est pas couvrable en Live ?
2. **Combien de temps** estimé de dev vs Live ?
3. **Qui maintient** ce code dans 6 mois ? Dans 18 mois ?
4. **Est-ce un îlot isolé** ou est-ce que ça va contaminer le reste ?
5. **Quelle stratégie de rollback** si le choix s'avère mauvais ?

Si une réponse est faible, le choix n'est pas assez mûr.

---

## 💬 Message clé

> **"En tant que lead dev, la question n'est pas *'comment intégrer Symfony UX ?'* mais *'jusqu'où peut-on aller sans quitter Symfony UX ?'*"**
>
> Plus on repousse la frontière React, plus on simplifie l'architecture — et plus l'équipe livre vite avec moins de bugs d'intégration.

### Trois mots à retenir

- **Sobriété** : une stack, une équipe, un design system, jusqu'à ce que le besoin exige vraiment plus
- **Progressif** : adoption brique par brique, sans big bang, sans risque
- **Défendable** : chaque dérogation à la règle est documentée et validée, pas subie

---

## 🗣️ Narration (script oral)

> "Dans les équipes où je suis intervenu, le réflexe par défaut était souvent : *'on fait du React parce que c'est moderne'*. Mais quand on analyse objectivement les besoins, 80 % des écrans sont du CRUD, du listing, du formulaire. Pour ça, Symfony UX n'est pas seulement **suffisant** — il est **meilleur** : moins de code, une seule équipe, une architecture unifiée.
>
> Mon rôle de lead, ce n'est pas d'imposer un dogme *'jamais de React'*. C'est de poser une **frontière défendable** : Twig et Live par défaut, React/Vue uniquement quand un besoin métier précis le justifie — et ce besoin, je le fais écrire noir sur blanc dans la PR. Pas pour freiner, mais pour éviter que chaque dev réintroduise la complexité par habitude ou par nostalgie.
>
> Et surtout : je ne démarre jamais par un big bang. La recette qui marche, c'est design system Twig d'abord, puis Live sur les widgets bricolés, puis standardisation. Trois à six mois, et l'équipe a changé d'ère sans que personne n'ait eu à suer sur une migration brutale."

---

## 🧭 Note

Ce chapitre est **extrait du talk principal** et conservé en bonus car il s'adresse davantage à un public lead dev / architecte qu'à des développeurs purement techniques. La synthèse et les take-aways du talk principal sont regroupés dans `08-synthese.md`.
