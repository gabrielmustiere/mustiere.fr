# Plan d'article — Quitter l'hexagonale pour ADR (Symfony / API Platform)

> Date : 2026-04-27 Type : article-blog Slug pressenti : `quitter-hexagonale-pour-adr-symfony` Langue source : fr Numéro (collection blog) : 2

## Sujet & déclencheur

ADR (Action-Domain-Responder) appliqué dans un projet Symfony / API Platform, vu comme l'aboutissement naturel quand on **quitte** une architecture hexagonale
jugée trop chère pour son contexte.

**Déclencheur concret** : projet pro en cours de migration d'une archi hexagonale vers une archi plus simple. Réflexion en cours sur ADR comme cible. L'article
fixe par écrit le raisonnement qui a mené à cette décision et les arbitrages qui l'ont accompagnée — utile à l'équipe en interne, partageable à l'extérieur.

## Audience

Développeurs Symfony seniors. Connaissent les contrôleurs, les bundles, l'écosystème, ont probablement déjà touché à hexa ou DDD. Pas de pédagogie sur les bases
du framework : on attaque le pattern et les arbitrages directement.

## Thèse

ADR est l'aboutissement naturel quand on quitte une architecture hexagonale trop chère : il garde la séparation HTTP/métier qui comptait, supprime les
abstractions qui ne tenaient que par dogme, et s'aligne avec ce qu'API Platform fait déjà nativement via Providers et Processors.

## Angle

Récit de transition d'un praticien : _« j'ai fait hexa, j'en reviens vers ADR, voici le tri »._ L'angle n'est pas comparatif théorique — c'est un retour de
terrain qui assume la position et nomme ce qui ne tenait pas.

**Ce n'est pas :**

- Un tutoriel ADR de plus (Paul M. Jones et la communauté l'ont déjà couvert).
- Un cours d'API Platform — on s'appuie dessus, on n'en explique que ce qui sert l'argument.
- Un bashing de l'hexagonale en absolu — la section 6 garde-fous protège explicitement la place légitime de hexa.
- Une comparaison MVC vs ADR (déjà saturé).

## Synthèse de recherche

**Sources lues :** aucune fournie par l'auteur — recherche web from scratch.

**Recherches web effectuées :**

- `Action-Domain-Responder pattern Symfony controller __invoke 2026` → tutoriels d'implémentation classiques + doc API Platform sur les contrôleurs custom.
- `Paul M Jones Action Domain Responder ADR PHP pattern alternative MVC` → référence canonique du pattern, GitHub pmjones/adr, Wikipedia.
- `hexagonal architecture Symfony PHP overengineering critique limits` → paysage saturé d'articles **pro-hexa**, critique systématiquement désamorcée par "non,
  ça vaut le coup".
- `API Platform single action controller invokable Resources providers processors 2026` → doc officielle Providers/Processors/\_\_invoke.

**Sources de référence à citer dans l'article :**

- [Paul M. Jones — pmjones.io/adr](https://pmjones.io/adr/) et [GitHub pmjones/adr](https://github.com/pmjones/adr) — passage obligé, créateur du pattern
  (2014).
- [API Platform — Custom Operations and Symfony Controllers](https://api-platform.com/docs/symfony/controllers/) et
  [State Processors](https://api-platform.com/docs/core/state-processors/) — appui central de la section 4.
- [Strangebuzz — A better ADR pattern for Symfony controllers](https://www.strangebuzz.com/en/blog/a-better-adr-pattern-for-your-symfony-controllers) — article
  récent à mentionner comme état de l'art.
- [Herberto Graça — Action-Domain-Responder](https://herbertograca.com/2018/09/03/action-domain-responder/) — replace ADR dans le paysage des patterns archi.
- [Matthias Noback — Hexagonal Architecture with Symfony (SymfonyCasts)](https://symfonycasts.com/screencast/symfonycon2019/hexagonal-architecture-with-symfony)
  — référence pro-hexa la plus solide, à citer pour respecter la position adverse.
- [CodelyTV — php-ddd-example](https://github.com/CodelyTV/php-ddd-example) — repo emblématique d'hexa+DDD en Symfony, à mentionner comme exemple typique de
  l'approche maximaliste.

**Angles concurrents identifiés :**

- "Comment implémenter ADR avec Symfony" (Strangebuzz, Medium, hgraca) — tutoriels d'implémentation, pas de récit de migration.
- "Symfony + Hexagonal + DDD : le guide complet" (très nombreux, Medium, DZone, SymfonyCasts) — quasi tous **pro-hexa**, critique posée puis désamorcée.
- "MVC vs ADR" (Paul M. Jones et dérivés) — comparaison historique, sans contexte Symfony moderne.

**Angle libre à occuper (gros) :**

1. **Le récit de transition hexa → ADR n'existe quasiment pas.** Tous les articles sont des "comment faire X". Le récit "j'ai fait X, je le défais, voici
   pourquoi" est la matière la plus rare — et c'est exactement la position de l'auteur.
2. **API Platform implémente déjà du ADR de fait** (Providers = lecture, Processors = écriture, `__invoke` pour les ops custom) sans jamais le nommer. Aucun
   article identifié ne formule frontalement _« le framework t'a déjà mis sur les rails ADR, hexa luttait contre »_. C'est l'argument massue de la section 4.

## Chapitrage

### 1. Le moment où l'hexagonale devient une dette

**Promesse :** poser le déclencheur — pourquoi l'auteur est parti d'hexa, ce qui semblait justifié au départ, ce qui pèse aujourd'hui. Ouvre par une situation
concrète (PR bloquée, debug qui traverse 6 fichiers, etc.).

**Points clés :**

- Raisons légitimes du choix initial d'hexa (testabilité, indépendance framework, séparation domaine/infra).
- Signaux qui ont basculé : lenteur des PRs, couches mortes, mappers DTO ↔ entité qui ne mappent rien, tests qui testent les abstractions plus que le métier,
  onboarding lent.
- Le moment précis où la décision de migrer s'est cristallisée.
- Garder le ton « je », pas de généralisation prématurée.

**Artefacts :** un exemple concret de "couche en trop" dans le code actuel (interface de port + implémentation qui fait juste un appel Doctrine).

### 2. ADR en 5 minutes (et pas plus)

**Promesse :** rappeler le pattern pour que la suite soit lisible, sans en faire un tuto de plus. Lecteur senior, pas besoin de le tenir par la main.

**Points clés :**

- Action / Domain / Responder, Paul M. Jones 2014.
- Différence avec MVC : un contrôleur = une action, pas plusieurs méthodes routées.
- Le cas particulier PHP : `__invoke` magic method = invokable class.
- Pourquoi le pattern colle au request/response HTTP mieux que MVC (qui vient du desktop).

**Artefacts :** un schéma textuel A → D → R, lien vers [pmjones.io/adr](https://pmjones.io/adr/), pas plus de 400 mots sur cette section.

### 3. Ce qui survit, ce qui meurt

**Promesse :** montrer concrètement quels bénéfices d'hexa sont conservés par ADR, et quelles abstractions disparaissent sans rien perdre. Cœur du tri.

**Points clés :**

- **Conservés** : séparation HTTP / métier, testabilité du domaine, single responsibility, classes courtes.
- **Supprimés** : interfaces de ports identiques à leur unique implémentation, mappers DTO ↔ entité quand les deux ont la même structure, factories pour de
  l'injection que Symfony fait déjà, application services qui ne font qu'un appel.
- À chaque suppression, expliquer **le coût réel** (lignes de code, fichiers à ouvrir, friction onboarding).
- Marquer ce qui n'est PAS dans cet axe : repository pattern, agrégats, value objects — sujets séparés.

**Artefacts :** un tableau "abstraction hexa → équivalent ADR → coût supprimé".

### 4. API Platform fait déjà du ADR sans le dire

**Promesse :** argument central de l'article — le framework t'a déjà mis sur les rails, hexa luttait contre. C'est la section qui doit faire dire au lecteur _«
ah merde, c'est vrai »_.

**Points clés :**

- **State Provider** = Action de lecture (collecte input, appelle domaine, renvoie données).
- **State Processor** = Action d'écriture (collecte input, appelle domaine, renvoie ressource modifiée).
- **Contrôleur `__invoke`** pour les opérations custom hors CRUD.
- **Sérialisation native** (Normalizer, JSON-LD, Hydra) = Responder déguisé.
- L'expression _"go with the grain"_ : aller dans le sens du framework coûte 10x moins cher que lutter contre.
- Citer la doc API Platform : elle décrit ADR en code, pas en mots.

**Artefacts :** un même endpoint custom (ex: `POST /users/{id}/promote`) implémenté en hexa (3 fichiers + 2 interfaces + un application service + un mapper)
puis en ADR/API Platform (1 Processor de ~30 lignes). Diff visuel.

### 5. Le squelette ADR concret en Symfony 7

**Promesse :** montrer le code minimal qui marche en prod, sans cérémonie inutile. Pas de surenchère, pas d'abstractions préventives.

**Points clés :**

- Un contrôleur `__invoke` invokable (Action).
- Un service métier appelé directement, autowired (Domaine).
- Le Responder : souvent juste un `return` + le normalizer JSON-LD d'API Platform — pas besoin d'une classe Responder dédiée tant que la sérialisation par
  défaut suffit.
- Tests : intégration HTTP (TestCase + KernelBrowser) plutôt qu'unitaires sur des mocks. Argument : on teste le contrat, pas l'implémentation.
- Commentaires explicites sur ce qu'on a **failli** ajouter et qu'on a évité (interface de service, DTO d'entrée, exception de domaine custom).

**Artefacts :** un contrôleur complet (~30 lignes), un service domaine (~40 lignes), un test d'intégration HTTP (~40 lignes). Les trois doivent tenir ensemble
dans un seul écran mental.

**Note rédaction :** le cas applicatif est à figer en début de rédaction. Deux candidats fictifs crédibles :

- **Gestion de tickets de support** (`POST /tickets/{id}/escalate`) — métier simple, naturel pour un side-project.
- **E-commerce** (`POST /orders/{id}/refund`) — plus universel, risque de tomber dans le cliché.

→ Préférer **gestion de tickets**, plus original et plus court à expliquer.

### 6. Quand ne PAS appliquer ADR

**Promesse :** honnêteté de l'angle, garde-fous explicites pour que l'article ne devienne pas un dogme inverse. Cette section porte aussi la chute de l'article
— pas de "Conclusion" générique en plus.

**Points clés :**

- **Projet très petit / CRUD pur** : ADR overkill, le générateur d'API Platform suffit sans réflexion.
- **Domaine vraiment complexe** (event sourcing, CQRS, agrégats lourds, invariants forts) : hexa garde son sens, parce que c'est précisément le contexte pour
  lequel elle a été inventée. Ne pas jeter le bébé.
- **Équipe qui n'a pas digéré la séparation HTTP/métier** : passer par MVC d'abord, ADR après. Le pattern n'a de valeur que si l'équipe comprend pourquoi.
- **Codebase legacy en cours de stabilisation** : changer d'archi pendant qu'on stabilise = double risque. Attendre.
- Formuler la chute : _« la simplicité n'est pas un défaut quand elle est une décision »_ — ou variante plus sobre.

**Artefacts :** une checklist 4–5 critères "applique ADR si…" en fin de section.

## Tonalité

- **Voix :** « je » assumé, comme dans `building-this-site-with-claude-and-astro.mdx`. Pas de « nous » corporate, pas d'impersonnel scolaire.
- **Niveau :** praticien. Le jargon Symfony est assumé (autowire, normalizer, KernelBrowser, JSON-LD). Pas d'explication des bases.
- **Rythme :** phrases courtes dominantes, paragraphes de 2–4 phrases. Listes pour énumérer, prose pour argumenter. Code commenté inline, pas en bloc à la fin.
- **À éviter :**
  - Em-dashes en pagaille (max un par paragraphe).
  - Emojis (aucun).
  - Formules type _"dans cet article nous verrons"_, _"sans plus attendre"_, _"voyons ensemble"_.
  - MAJUSCULES emphatiques.
  - Relances LinkedIn-like (_"vous êtes prêt ?"_, _"on y va ?"_).
  - Conclusion molle qui répète l'intro.
  - Prétendre que tout le monde devrait faire pareil — l'angle est personnel, l'assumer.
- **À reproduire (depuis l'article de référence) :**
  - Ouvrir par une situation concrète, pas par une définition.
  - Citer les fichiers avec leur chemin (`src/Controller/PromoteUserController.php`).
  - Bloc de code court, commenté, autosuffisant.
  - Sections numérotées ou nommées selon utilité, pas par symétrie forcée.
  - Phrases qui prennent position (_"voilà ce que je garde"_, pas _"on pourrait considérer que"_).

**Articles de référence :**

- `src/content/blog/construire-ce-site-avec-claude-et-astro.mdx` (FR)
- `src/content/blog/building-this-site-with-claude-and-astro.mdx` (EN, même article)

## Frontmatter prévisionnel

```yaml
title: "Quitter l'hexagonale pour ADR : ce que j'ai gardé, ce que j'ai jeté"
excerpt:
  "Trois ans d'architecture hexagonale sur un Symfony, et un retour assumé vers Action-Domain-Responder. Récit du tri entre ce qu'hexa apportait vraiment et ce
  qu'elle facturait pour rien."
publishedAt: 2026-04-27 # à ajuster à la date de publication réelle
category: Tech
tags: [Symfony, 'API Platform', ADR, Architecture, Hexagonale]
keywords:
  - 'pattern ADR Symfony'
  - 'Action Domain Responder PHP'
  - 'alternative architecture hexagonale'
  - 'API Platform pattern controller'
  - 'single action controller Symfony'
  - 'quitter hexagonale Symfony'
number: 2
tldr:
  "Action-Domain-Responder remplace ici une architecture hexagonale jugée trop chère pour le contexte d'un projet Symfony / API Platform. ADR garde la
  séparation HTTP/métier qui comptait, supprime les ports/adapters dupliqués, et s'aligne avec ce qu'API Platform fait déjà nativement via Providers et
  Processors."
faq:
  - question: "ADR remplace-t-il l'architecture hexagonale ?"
    answer: '_à rédiger — réponse contextuelle, pas en absolu_'
  - question: 'Faut-il une classe Responder dédiée ou le normalizer suffit-il ?'
    answer: '_à rédiger_'
  - question: 'ADR fonctionne-t-il avec API Platform ?'
    answer: '_à rédiger — pointer Providers, Processors, __invoke_'
  - question: "Quand garder l'hexagonale plutôt que migrer vers ADR ?"
    answer: '_à rédiger — checklist de la section 6_'
lang: fr
```

**Variantes de titre envisagées :**

1. `Quitter l'hexagonale pour ADR : ce que j'ai gardé, ce que j'ai jeté` (64 chars) — narratif, position claire, ton « je ».
2. `ADR après l'hexagonale : la simplification que Symfony attendait` (62 chars) — plus orienté thèse, moins personnel.
3. `Pourquoi j'ai abandonné l'hexagonale pour ADR dans un projet Symfony` (70 chars) — explicite, format question.

**Variantes d'excerpt envisagées :**

1. _« Trois ans d'architecture hexagonale sur un Symfony, et un retour assumé vers Action-Domain-Responder. Récit du tri entre ce qu'hexa apportait vraiment et
   ce qu'elle facturait pour rien. »_ (~190 chars)
2. _« ADR remplace une architecture hexagonale dans un projet Symfony / API Platform. Récit de la transition : ce qui survit, ce qui meurt, et pourquoi le
   framework te l'avait déjà préparé. »_ (~185 chars)

**Vérification contraintes Zod :**

- `title` : 64 chars ≤ 120 ✓
- `excerpt` : 190 chars dans `[80, 220]` ✓
- `tldr` : ~310 chars dans `[60, 320]` ✓ (à resserrer après rédaction si besoin)
- `category` : `Tech` ∈ enum ✓
- `number` : 2 (article #1 = `building-this-site-with-claude-and-astro` / `construire-ce-site-avec-claude-et-astro`)

**Pendant EN :** prévoir `quitting-hexagonal-for-adr-symfony.mdx` avec `lang: en`, `translationOf: quitter-hexagonale-pour-adr-symfony`. Décision de traduire à
prendre après rédaction FR validée.

## Risques & garde-fous

- **Risque : tomber dans le bashing d'hexa pur** → garde-fou : la section 6 protège explicitement la place légitime de hexa, et la voix « je » contextualise («
  dans mon contexte »). À relire en fin de rédaction pour s'assurer qu'aucun passage ne généralise.
- **Risque : la section 4 (API Platform fait déjà du ADR) dérive en cours API Platform** → garde-fou : limite explicite à ~600 mots, focus sur le triptyque
  Provider / Processor / \_\_invoke, pas d'exhaustivité sur les filtres, sécurité, validation.
- **Risque : citer des chiffres de perf / temps de PR non sourcés** → garde-fou : marquer `_à étayer ou retirer_` à la rédaction. Préférer "j'ai senti X" à "X%
  plus rapide" si pas de mesure.
- **Risque : périmétrabilité dans le temps** (Symfony 7.x, API Platform 4.x) → garde-fou : annoncer les versions explicitement en intro de la section technique.
  Date de validité = date de publication.
- **Risque : claims sur des comportements API Platform mal vérifiés** → garde-fou : pour chaque code de la section 4 et 5, vérifier dans la doc officielle
  ([api-platform.com/docs](https://api-platform.com/docs/)) avant de figer. Si possible, faire tourner le code localement.
- **Risque : conclusion molle** → garde-fou : la section 6 fait office de chute. Pas de section 7 "Conclusion" séparée. La dernière phrase doit être tranchante.

## Prochaine étape

Rédaction complète à partir de ce plan. Lancer le skill de rédaction (à venir) ou demander : « rédige l'article depuis ce plan ».

**Avant rédaction :**

1. Choisir le titre définitif parmi les 3 variantes.
2. Figer le cas applicatif des sections 4 et 5 (recommandation : gestion de tickets, `POST /tickets/{id}/escalate`).
3. Confirmer la longueur cible (~3500 mots).
