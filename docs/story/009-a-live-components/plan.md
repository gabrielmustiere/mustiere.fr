# Plan d'article — Live Components : l'aboutissement du modèle composant côté serveur dans Symfony

> Date : 2026-05-07
> Type : article-blog
> Slug pressenti : `live-components-symfony-modele-composant-serveur`
> Stack détectée : Astro Content Collections (Zod strict, forme dossier avec chapitres)
> Langue source : fr
> Multilingue : non (FR seul ; pendant EN à décider après publication FR — le précédent article CTO a un pendant EN, donc cohérent à terme, mais hors périmètre de cette rédaction)

## Sujet & déclencheur

Article technique long sur **Symfony UX Live Components** : ce qu'ils sont, comment l'état circule entre client et serveur sans écrire de JavaScript, comment on les teste / profile / sécurise, et comment on arbitre en code review entre Twig Component, Stimulus pur et Live Component.

Déclencheur : présentation interne donnée en entreprise (matière dans `ressources/`, 7 chapitres + 1 bonus, ~70 KB de slides + narration). L'article reprend la matière du talk, **moins** la partie comparative React (réservée à un second article CTO) et **moins** le positionnement stratégique lead/équipe (idem). Il prolonge l'article précédent `php-symfony-2026-perspective-cto` qui mentionnait Live Components dans l'écosystème — ici on entre dans le détail.

## Audience

Lead dev / dev senior Symfony, déjà à l'aise avec Twig + Stimulus et le combo `render(controller())` + endpoint Ajax. A vu passer Live Components (probablement via la doc ou un talk) sans s'y mettre sérieusement. Veut comprendre **ce que ça change concrètement dans son code** avant d'investir.

## Thèse

Live Components rend obsolète le combo `render(controller())` + endpoint Ajax + contrôleur Stimulus custom pour 95 % des UIs CRUD/backoffice d'une app Symfony. Ce n'est pas un remplacement de React — c'est l'aboutissement du modèle composant côté serveur dans Symfony, empilé sur Twig Components et compatible avec Stimulus, qui reste utilisé pour les comportements 100 % client.

## Angle

Je raconte le passage de l'archéologie pré-UX (`include`, `macro`, `render(controller())`, Twig extension, Stimulus + Ajax) à Live Components, **du point de vue d'un dev Symfony qui écrit le code**, en montrant que les trois douleurs structurelles (typage, organisation, réactivité server-driven) sont résolues par deux briques empilées (Twig Components puis Live Components) — et qu'une règle de deux questions suffit en code review pour choisir la bonne brique.

**Ce n'est pas :**

- Un comparatif Live Components vs React (réservé au futur article CTO).
- Un plaidoyer « unifier front et back côté équipe » au sens organisationnel (idem, futur article CTO).
- Un tutoriel d'installation `composer require` étape par étape (renvoyé à la doc officielle).
- Un panorama exhaustif de la famille HTML-over-the-wire (Phoenix LiveView, Hotwire, Livewire, htmx) — citée en contexte, pas étudiée.
- Un argumentaire « Stimulus est mort » — Stimulus est **intégré** par Live Components et reste la bonne réponse pour les comportements client purs.

## Synthèse de recherche

**Sources lues (matière interne, dossier `ressources/`) :**

- `01-probleme-et-contexte.md` — Archéologie pré-UX en 6 slides : `include`, `macro`, `render(controller())`, Twig extension, Stimulus + Ajax, puis trois douleurs structurelles. Source principale du chapitre 1.
- `02-du-js-au-php.md` — Trois piliers du modèle composant (encapsulation, réactivité, composition), idée vs implémentation, deux briques Symfony UX empilées. Intégré en intro de chapitre 2.
- `03-twig-components.md` — Anatomie complète d'un Twig Component : classe + template, props typées, slots, services injectables, hooks `PreMount`/`PostMount`. Source principale du chapitre 2.
- `04-live-components.md` — Cœur du sujet : famille HTML-over-the-wire, trois briques (`LiveProp`, `LiveAction`, `data-model`), cycle en deux phases, anatomie d'un re-render, features avancées (`debounce`, `defer`, embedded components, `ComponentWithFormTrait`). Source principale du chapitre 3.
- `05-demo-live.md` — Démos Alert, ProductCard, Counter, ProductSearch debounce. Diffusé en extraits dans les chapitres 2 et 3 (pas de chapitre démo dédié dans l'article).
- `06-tests-perf-securite.md` — `InteractsWithTwigComponents`, `InteractsWithLiveComponents`, profiler `POST /_components/*`, anti-patterns perf (Doctrine en `LiveProp`, cascade), règle sécu (état dans le DOM = jamais de secret), `LiveProp(writable: false)`. Source principale du chapitre 4.
- `07-synthese.md` — Comparatif 12 axes (utilisé partiellement, sans la colonne React), règle des deux questions, 5 anti-patterns, take-aways. Source du chapitre 5.
- `bonus/positionnement-strategique.md` — Mindset lead/équipe. **Hors périmètre** de cet article, réservé au futur article CTO.

**Sources internes du repo :**

- `src/content/blog/fr/php-symfony-2026-perspective-cto/` — Article de référence pour la voix et le format. Mentionne Live Components dans l'écosystème (chapitre `03-symfony.mdx`), cet article-ci en est le prolongement détaillé.
- `src/content/blog/fr/construire-ce-site-avec-claude-et-astro/` — Second article de référence pour le ton « je » et la longueur.
- `src/content.config.ts` — Schéma Zod blog (bornes excerpt, enum category, champ `number` requis).

**Recherches web :** aucune lancée à ce stade. La matière interne est exhaustive. À étayer en rédaction si nécessaire :

- Versions actuelles `symfony/ux-live-component` et `symfony/ux-twig-component` au moment de la publication.
- Liens de doc officielle à jour (ux.symfony.com).
- Confirmer le poids JS embarqué (~25–30 Ko) — chiffre du chapitre 7.1 du talk, à revérifier sur la version actuelle.
- Confirmer que la famille HTML-over-the-wire reste cohérente fin 2026 (Phoenix LiveView, Hotwire, Livewire, htmx — pas de nouveau venu majeur ?).

**Angles concurrents identifiés :**

- Articles « tutoriel découverte Live Components » (introduction, premier composant, pas d'analyse). Génériques, calqués sur la doc officielle.
- Articles « Symfony UX vs React » (comparatif religieux, peu calibré). C'est précisément le piège qu'on évite ici en renvoyant cet angle au futur article CTO.
- Articles « Livewire pour devs Laravel » (cousin) — fournissent le vocabulaire HTML-over-the-wire mais pas le détail Symfony.

**Angle libre à occuper :** un article _technique long_ qui va plus loin que la doc officielle (anatomie du cycle, payload réseau commenté, tests / perf / sécu, anti-patterns en code review) sans virer au comparatif framework. Ce qu'un dev senior Symfony lit pour décider en deux heures.

## Chapitrage

### Intro — `index.mdx`

**Promesse :** poser le constat que tout dev Symfony reconnaît — un projet moyen accumule du `render(controller())`, du Stimulus + endpoint Ajax custom, des macros Twig, et finit avec une zone React greffée pour la prochaine UI un peu vivante. L'article démonte cette accumulation et présente la pile qui la remplace, **sans toucher au débat React** (réservé à un article suivant).

**Points clés :**

- Le déclencheur : présentation interne donnée en entreprise, envie de la pousser plus loin que les slides.
- Ce que l'article _est_ : techno Live Components, anatomie d'un cycle, tests / perf / sécu, règle de décision en code review.
- Ce que l'article _n'est pas_ : comparatif React, plaidoyer organisationnel.
- Stimulus dans l'image : intégré, pas remplacé. Cette nuance traverse tout l'article.
- Pointeur vers le **repo Git d'exemples** (à créer en parallèle de la rédaction) pour les démos complètes.

**Artefacts :** une ouverture sur l'accumulation typique d'une codebase Symfony, citation directe d'un cas réel si tu en as un, plan en 5 chapitres.

---

### 1. `01-archeologie-pre-ux.mdx` — Avant Symfony UX, l'inventaire

**Promesse :** faire l'archéologie des outils Symfony pré-UX et **nommer** les trois douleurs structurelles qu'aucun ne résout (typage absent, dispersion, pas de réactivité server-driven). Le chapitre est honnête : ces outils restent utiles, ils ne sont pas morts.

**Points clés :**

- `include` Twig — factorisation pure, zéro contrat, fuites de contexte sans `only`.
- `macro` Twig — signature explicite, isolation, mais zéro PHP et pas de slots.
- `render(controller())` — vraie logique PHP, mais sous-requête HTTP interne, coût qui explose, DX dispersée.
- Twig extension — bonne pour des helpers (date, prix), mauvaise pour un composant (markup en string PHP).
- Stimulus + endpoint Ajax custom — vraie interactivité, mais double codebase, validation/formatage dupliqués, divergence d'état possible. **Important : Stimulus reste utile** pour les comportements 100 % client, c'est le couple « Stimulus _custom_ + endpoint Ajax _custom_ » pour faire de la réactivité serveur qui devient redondant.
- Synthèse en trois douleurs structurelles : pas de contrat de typage, pas d'unité d'organisation, pas de réactivité server-driven.

**Artefacts :** 5 paires de blocs Twig/PHP courts (un par outil) repris du chapitre 1 du talk, table récap « ce que chaque outil résout / où il s'arrête / cas d'usage encore légitimes ».

**Source :** `ressources/01-probleme-et-contexte.md`.

---

### 2. `02-twig-components-le-socle.mdx` — Twig Components, le composant statique typé

**Promesse :** la moitié du problème (typage + unité d'organisation) se règle avec Twig Components — une classe PHP + un template Twig, props typées, slots, services injectables, **statique**. La réactivité arrive au chapitre suivant, on l'évacue ici.

**Points clés :**

- Trois piliers du modèle composant (encapsulation, réactivité, composition) repris en deux paragraphes en intro de chapitre — l'idée qu'on garde de React/Vue.
- Anatomie : `src/Twig/Components/Alert.php` + `templates/components/Alert.html.twig`, syntaxe `<twig:Alert ... />`.
- Propriétés publiques typées = props.
- Slots via `{% block content %}`, équivalent du `children` React.
- Services injectables (DI dans le constructeur) — différence clé avec une macro Twig.
- Hooks `PreMount` / `PostMount` pour transformer les props avant/après.
- `getTemplate()` pour template dynamique selon une prop.
- Statique = rend une fois, pas d'état entre les requêtes. La réactivité n'est pas dans cette brique.

**Artefacts :** composant `Alert` minimal, composant `ProductCard` avec `ProductRepository` injecté, table comparative React/Twig Component (4 lignes), pointeur vers le repo Git d'exemples pour la version complète.

**Source :** `ressources/02-du-js-au-php.md` (intégré en intro) + `ressources/03-twig-components.md` + `ressources/05-demo-live.md` slides 5.1–5.2.

---

### 3. `03-live-components-le-cycle.mdx` — Live Components, anatomie d'un round-trip

**Promesse :** le cœur de l'article. Montrer **comment l'état circule** entre client et serveur sans écrire une ligne de JavaScript — par anatomie d'un cycle complet, payload réseau commenté ligne par ligne.

**Points clés :**

- Positionnement : famille HTML-over-the-wire (Phoenix LiveView 2018, Hotwire 2020, Livewire 2020, htmx 2020, UX Live Components 2022) — ce qu'elle refuse, ce qu'elle assume.
- **Stimulus dans l'image** : Live Components s'appuie sur un contrôleur Stimulus côté client (`live_controller.js`, ~25–30 Ko). On n'écrit pas de JS, mais on en exécute. C'est une dépendance, pas un détail à cacher.
- Trois briques : `LiveProp` (état sérialisé dans le DOM), `LiveAction` (méthode déclenchable depuis le DOM), `data-model` (binding input ↔ prop, équivalent `v-model`).
- Cycle en deux phases : (a) render initial serveur → DOM hydraté avec attributs `data-live-*` → contrôleur Stimulus s'attache, (b) interaction → POST `/_components/<name>?action=...` avec l'état sérialisé → re-render serveur → patch DOM via morphdom (préserve focus, scroll, transitions).
- Sans Live vs avec Live : table « ce qu'on arrête d'écrire » (endpoint Ajax dédié, format de réponse, logique JS, mise à jour DOM manuelle, CSRF).
- Features avancées : `debounce`, `defer`, `LiveAction` avec arguments, embedded components (composant dans composant), `ComponentWithFormTrait` pour les Symfony Forms réactifs.
- Démo `Counter` (cycle minimal) puis `ProductSearch` avec `debounce(300)` — extraits courts, repo Git pour les versions complètes.

**Artefacts :** schéma du cycle en deux phases (ASCII art ou description textuelle), payload `POST /_components/ProductSearch?action=search` capturé depuis DevTools, commenté ligne par ligne (clé `data`, `prop`, signature, CSRF token), composant `Counter` complet (PHP + Twig), composant `ProductSearch` avec debounce, mention explicite du repo Git d'exemples.

**Source :** `ressources/04-live-components.md` (intégral) + `ressources/05-demo-live.md` slides 5.3–5.4.

---

### 4. `04-tests-perf-securite.mdx` — Le code marche. La prod pose trois questions

**Promesse :** la moitié des refus d'adopter Live Components vient de « comment on teste / profile / sécurise ça ? ». Réponses concrètes, sans démarrer de navigateur.

**Points clés :**

- **Tester** — `InteractsWithTwigComponents::renderTwigComponent()` pour le rendu d'un Twig Component, `mountTwigComponent()` pour la logique de mount sans rendu, `InteractsWithLiveComponents::createLiveComponent()` + `->call()` + `->set()` + `->render()` pour les actions/props/re-renders. Tout en `KernelTestCase`, pas de navigateur.
- **Profiler** — Symfony Profiler intercepte les `POST /_components/*` au même titre qu'une requête classique. Lire le payload, mesurer le temps de re-render, repérer les requêtes Doctrine en cascade.
- **Pièges perf** — entité Doctrine entière en `LiveProp` (sérialisée dans le DOM, monstrueuse → passer l'ID, recharger côté serveur), cascade de re-renders sur composants embedded mal isolés, `data-model` sans `debounce` (typing = 2–5 req/s par utilisateur), oublier `defer` sur des composants secondaires lors du render initial.
- **Sécuriser** — règle d'or : _l'état voyage dans le DOM, jamais de secret dans une `LiveProp`_. `LiveProp(writable: false)` empêche le client de modifier la valeur (signature serveur vérifiée). `IsGranted` / `Security` sur les `LiveAction` au même titre qu'un contrôleur. Validation côté re-render (jamais faire confiance à l'état renvoyé).
- Latence — table dev local / prod même région / mobile 4G / 3G dégradé, et seuils de tolérance.

**Artefacts :** test PHPUnit complet d'un `Counter` (mount + render + call action + assert prop), test d'un `ProductSearch` (set debounce + call search + assert résultats), screenshot/extrait textuel du profiler, 3 anti-patterns avec leur fix présentés en table.

**Source :** `ressources/06-tests-perf-securite.md`.

---

### 5. `05-decider-en-code-review.mdx` — Twig, Stimulus, Live : choisir en deux questions

**Promesse :** refermer la boucle. Donner un outil mental opérationnel pour trancher en code review entre Twig Component, Stimulus pur et Live Component. Le débat React est explicitement renvoyé à un futur article CTO — c'est un autre niveau de décision (techno → organisation).

**Points clés :**

- La règle des deux questions :
  - Q1 : _« Y a-t-il une interaction utilisateur qui modifie l'UI ? »_ — non → Twig Component.
  - Q2 (si Q1 = oui) : _« Cette interaction dépend-elle d'un état ou de données côté serveur ? »_ — non → Stimulus pur, oui → Live Component.
- Application sur 6 features réelles : card produit (affichage), toggle dark mode, recherche produit en live, filtre + pagination, champs conditionnels de form, copy-to-clipboard. Table Q1/Q2/brique.
- 5 anti-patterns à reconnaître en code review : entité Doctrine complète en `LiveProp` → passer l'ID ; plusieurs `LiveAction` enchaînées sur un clic → une seule action multi-étapes ; Live Component sans `LiveProp writable` ni `LiveAction` → c'est un Twig Component, économiser l'hydratation ; slider/WYSIWYG/canvas en Live → Stimulus pur ou lib client dédiée ; ignorer le profiling sur composants imbriqués → cascade de requêtes en cascade.
- Plan d'action « lundi matin » : un Twig Component extrait (alert/card/badge), un Live Component trivial (compteur, toggle, like), un widget JS bricolé converti.
- Cliffhanger honnête vers l'article suivant : ce qui reste hors de cette grille (« quand React est-il encore légitime, et comment l'organiser à côté ? ») — sans y répondre.
- Liens externes vers ux.symfony.com, doc Live/Twig Component, et cousins (Livewire, Phoenix LiveView, Hotwire, htmx). Mention explicite du repo Git d'exemples.

**Artefacts :** arbre de décision en bloc texte, table « feature → Q1 → Q2 → brique », table des 5 anti-patterns + fix, liste de liens externes.

**Source :** `ressources/07-synthese.md` slides 7.3, 7.5, 7.6 (slides 7.1 comparatif React et 7.2 hybridation explicitement réservées à l'article suivant).

---

### `resume.mdx` (obligatoire — schéma)

~150–200 mots, ≥ 60 chars plain. Synthétise : les trois douleurs structurelles pré-UX, les deux briques empilées (Twig + Live), les trois sous-briques de Live (`LiveProp`, `LiveAction`, `data-model`), le cycle en deux phases, la règle des deux questions, et la limite explicite (« on ne traite pas l'arbitrage React, ni le mindset équipe — autre article »). Lu par les LLMs et affiché en tête.

### `faq.mdx` (optionnel mais inclus ici)

5 questions choisies parmi les objections classiques + « questions ouvertes » du talk :

1. _Live Components remplace-t-il React ?_ — Non, et ce n'est pas l'objet de cet article. La question est traitée séparément.
2. _Faut-il garder Stimulus avec Live Components ?_ — Oui. Stimulus est intégré (le contrôleur `live_controller.js` _est_ Stimulus) et reste l'outil pour les comportements 100 % client (toggle, copy, animation simple).
3. _Combien coûte une interaction Live en prod ?_ — 50–300 ms en prod même région, 200–500 ms en mobile 4G. Une app à 100 req/s classique → prévoir 300–500 req/s avec Live actifs si typing fréquent.
4. _Que se passe-t-il en cas de réseau dégradé ?_ — Latence visible, pas de mode offline. Si offline est requis, Live Components n'est pas la bonne réponse.
5. _Live Components scale-t-il sur du gros trafic ?_ — Oui à conditions standards Symfony (FPM/FrankenPHP, cache HTTP, pas d'entité Doctrine en `LiveProp`, debounce sur les inputs). Le coût est un round-trip HTTP par interaction, pas plus.

### `sources.mdx` (optionnel — inclus)

Liens externes structurés (champs `title`, `url`, `author?`, `date?`) :

- ux.symfony.com — hub Symfony UX
- ux.symfony.com/live-component — doc Live Component
- ux.symfony.com/twig-component — doc Twig Component
- livewire.laravel.com — Livewire (cousin Laravel)
- hexdocs.pm/phoenix_live_view — Phoenix LiveView (Elixir, ancêtre de la famille)
- hotwired.dev — Hotwire (Rails / agnostique)
- htmx.org — htmx
- (ajouter à la rédaction : 1–2 articles de fond sur HTML-over-the-wire si pertinents — Caleb Porzio sur Livewire, articles de la team Symfony UX)

## Tonalité

- **Voix :** je. Calé sur `php-symfony-2026-perspective-cto` (« j'ai vu », « je m'adresse », expérience terrain assumée). Pas de « nous » magistral.
- **Niveau :** praticien. Le vocabulaire technique est assumé (Doctrine, Stimulus, morphdom, CSRF, autowiring) sans pédagogisation. Les comparaisons React/Vue ne sont pas expliquées — l'audience les connaît.
- **Rythme :** phrases longues mais claires, mélange paragraphes de prose + listes courtes + blocs de code + tables récap. Le précédent article fait beaucoup de paragraphes de 4–6 lignes denses, c'est le format à reproduire. Les blocs de code servent à _montrer_, pas à fournir un tutoriel exécutable bout-en-bout (le repo Git d'exemples joue ce rôle).
- **À éviter :** emojis dans le rendu publié (présents dans les ressources, à retirer en rédaction), exclamations, MAJUSCULES emphatiques, em-dashes en pagaille (1 par paragraphe maximum), formules « dans cet article nous verrons », ouvertures LinkedIn, jargon non défini autre que Symfony/PHP/JS.
- **À reproduire (depuis les articles de référence) :**
  - Ouverture par un constat concret ancré dans l'expérience (cf. « Quatorze ans de PHP. Une cinquantaine de projets… » du précédent article).
  - Citations de fichiers avec leur chemin complet (`src/Twig/Components/Alert.php`, `templates/components/Alert.html.twig`).
  - Liens inline `[texte](url)` plutôt qu'une bibliographie en bas (les vraies sources structurées vivent dans `sources.mdx`).
  - Phrases de transition entre les chapitres pour relier la matière.
  - Sortie sur une affirmation claire, pas un « voilà j'espère que ça vous a plu ».

**Articles de référence :**

- `src/content/blog/fr/php-symfony-2026-perspective-cto/index.mdx` (priorité — registre tech, voix « je », mêmes lecteurs)
- `src/content/blog/fr/construire-ce-site-avec-claude-et-astro/index.mdx` (secondaire — ton, longueur, alternance prose/code)

## Frontmatter prévisionnel

```yaml
title: "Live Components : l'aboutissement du modèle composant côté serveur dans Symfony"
excerpt: "Symfony UX Live Components rend obsolète le combo render(controller()) + endpoint Ajax + Stimulus custom pour 95 % des UIs CRUD. Anatomie d'un cycle, tests, perf, sécu, et règle de décision en code review."
publishedAt: 2026-05-XX # date à fixer à la publication
category: Tech
tags:
  - Symfony
  - PHP
  - Live Components
  - Twig Components
  - Symfony UX
  - Server-driven UI
  - Stimulus
cover: ./cover.png # ou .webp — à produire ; coverAlt requis
coverAlt: 'Live Components Symfony : modèle composant côté serveur'
keywords:
  - Symfony Live Components
  - Symfony UX
  - Twig Components
  - LiveProp
  - LiveAction
  - data-model Symfony
  - server-driven UI PHP
  - HTML over the wire Symfony
  - morphdom Symfony
  - Stimulus Live Components
  - tests Live Components
  - render controller alternative
number: 3
draft: true # passer à false à la publication
lang: fr
# pas de translationOf : article FR seul, EN à décider après publication
```

**Variantes de titre envisagées :**

1. **« Live Components : l'aboutissement du modèle composant côté serveur dans Symfony »** _(retenue par défaut — ancrée dans la thèse, descriptive, longue mais lisible)_
2. « Live Components : la fin du combo `render(controller())` + Ajax + Stimulus » _(plus concrète, plus polémique, mais peut être lue comme « Stimulus est mort » alors que le message est l'inverse — risquée)_
3. « Symfony Live Components : anatomie technique d'un round-trip » _(plus humble et plus précise sur le contenu réel — option de repli si la thèse paraît trop ambitieuse au moment de la rédaction)_

**Pendant traduit :** sans objet pour cette rédaction (FR seul). Si une version EN est décidée plus tard, le slug pressenti est `live-components-symfony-server-side-component-model` ou similaire, à caler sur la convention bilingue du repo (slug pur sans suffixe `-en`, dossier `src/content/blog/en/<slug>/`).

## Risques & garde-fous

- **Risque : devenir un tutoriel d'installation et de premier composant** → on a délibérément exclu ce périmètre (intro). Renvoyer vers la doc officielle. La valeur est dans l'anatomie du cycle et la règle de décision.
- **Risque : déraper sur React** → mention en intro et en cliffhanger final, jamais de comparatif explicite dans le corps. Si une formulation tire vers le comparatif en rédaction, la couper.
- **Risque : faire passer Stimulus pour mort** → vigilance permanente. Stimulus est _intégré_ par Live Components et reste recommandé pour les comportements 100 % client. À répéter explicitement chapitres 1 (slide Stimulus + Ajax → bien dire que c'est le couple custom qui devient obsolète, pas Stimulus), 3 (~25–30 Ko de Stimulus exécuté), 5 (règle des deux questions → Stimulus est la bonne réponse pour Q2 = non).
- **Risque : surcharger le chapitre 3 de code** → le repo Git d'exemples (à créer) absorbe les démos complètes. Dans l'article, garder des extraits courts (max ~25 lignes par bloc) et pointer le repo. Si un bloc dépasse, le découper ou le déplacer dans le repo.
- **Risque : chiffres qui périment** (latence, poids JS, version Symfony UX) → noter la date de validité dans le texte (« en 2026, version X.Y de symfony/ux-live-component »). À étayer en rédaction.
- **Risque : payload réseau réel obsolète** → capturer le payload `POST /_components/*` au moment de la rédaction, pas reprendre de mémoire. Annoter avec la version du bundle.
- **Risque : claims non sourçables** (ex. « 95 % des UIs métier ») → assumer comme une estimation argumentée par l'expérience, pas comme une mesure ; ou retirer le chiffre et reformuler en qualitatif.
- **Risque : couverture inégale Twig vs Live** → vérifier en rédaction que le chapitre 2 (Twig) reste dense mais court (le socle, pas le sujet), pour ne pas écraser le chapitre 3 (Live, le cœur).
- **Risque : intro floue** → l'intro doit nommer immédiatement les trois douleurs et les trois briques de réponse. Si elle dérive en généralités sur Symfony, la réécrire serrée.
- **Risque : repo Git d'exemples pas prêt à la publication** → soit publier l'article avec un placeholder (« repo en cours, lien à venir »), soit retarder la publication. Pas de lien cassé dans l'article publié.

## Prochaine étape

Rédaction complète à partir de ce plan. Lancer le skill `article` (`/editorial:article`) ou demander : « rédige l'article depuis ce plan ».

À préparer **en parallèle** de la rédaction :

- Repo Git d'exemples (Counter, ProductSearch, ProductCard, Alert, tests `InteractsWithLiveComponents`).
- Cover de l'article (`./cover.png` ou `.webp`) + `coverAlt`.
- Capture réelle d'un payload `POST /_components/*` depuis DevTools sur un projet Symfony courant.
- Décision finale sur le titre (variante 1 par défaut).
- Décision sur le pendant EN (après publication FR validée — pas avant).
