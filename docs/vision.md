# Vision — mustiere.fr

> Pitch en une phrase : le site personnel de Gabriel Mustiere, pour quiconque doit l'évaluer (recruteurs, ESN, fondateurs, pairs, clients), qui résout l'absence de preuve publique de compétence qu'il maîtrise en rassemblant parcours, réalisations et écrits dans un lieu sobre, lisible en 30 secondes.

_Document vivant — enrichi au fil du cycle de vie, refondu lors d'un pivot stratégique. Date de dernière mise à jour : 2026-05-31._

## Changelog

Historique des évolutions structurantes (création, enrichissements, éditions ciblées, pivots). Lecture du haut vers le bas = ordre chronologique. Détails fins dans `git log`.

| Date       | Nature   | Axe | Motif           |
| ---------- | -------- | --- | --------------- |
| 2026-05-31 | Création | —   | Vision initiale |

## Le problème

Quand quelqu'un doit juger Gabriel Mustiere — « il vaut quoi, techniquement et humainement ? » avant une mission, une recommandation ou une mise en relation — il ne dispose que de surfaces que Gabriel ne contrôle pas : un profil LinkedIn formaté comme tous les autres, et le bouche-à-oreille. La preuve de compétence existe dans sa tête et dans son historique, mais nulle part sous une forme qu'il maîtrise, qu'on peut consulter froidement et citer.

**Comment c'est résolu aujourd'hui** : LinkedIn (gabarit imposé, signal noyé), CV PDF envoyé au cas par cas, et la réputation transmise oralement.

**Pourquoi c'est insuffisant** : ces surfaces ne se possèdent pas, ne hiérarchisent pas ce qui compte, et mélangent le pertinent avec le bruit. Un profil LinkedIn ne permet pas de constater une compétence — il la déclare, comme tout le monde.

**Ampleur** : chaque évaluation de Gabriel (sourcing, recommandation, première prise de contact) repart de zéro sur des bases qu'il ne contrôle pas. Le site est l'actif durable qui capitalise cette preuve une fois pour toutes.

## L'audience

### Utilisateur principal

- **Persona** : _le sourceur_ — toute personne en position d'évaluer, recommander ou solliciter Gabriel. Recruteur tech, ESN, fondateur de startup/PME cherchant un CTO fractional ou un audit, pair technique susceptible de recommander, client final. Hétérogène en métier, homogène en intention : **il évalue, et il décide vite**.
- **Volume cible** : non pertinent — pas d'objectif d'audience chiffré. Le site sert chaque évaluateur individuel, pas un volume.
- **Ce qui le bloque aujourd'hui** : il ne trouve pas, en un endroit, de quoi se faire une opinion nette et défendable sur Gabriel. Il doit reconstituer le puzzle (LinkedIn + recherches + questions à des tiers).

### Utilisateurs secondaires

- **La communauté Symfony/PHP/IA** — lit les articles de fond pour leur contenu propre ; renforce le signal de crédibilité par effet de bouche-à-oreille technique.

### Hors cible explicite

- **Les sollicitations commerciales génériques** (cold sales, démarchage non ciblé). Le site n'est pas écrit pour elles ; il les filtre par son ton et son cadrage plutôt que de les courtiser.

## La proposition de valeur

### Bénéfice utilisateur

L'évaluateur repart avec une lecture **nette et défendable** : ce que fait Gabriel (architecture, leadership technique, SaaS & e-commerce from scratch et mise à l'échelle), pour qui, à quel niveau (14 ans dans la tech, CTO depuis 2017) — étayée par des **preuves concrètes** : réalisations nommées (filiale SaaS Progicar de 0 à 25+ personnes, Passion Barbecue sur Sylius, Anytime sur la conformité PSD2/SCA via WebAuthn), écrits techniques de fond, side projects, CV. Il pourrait argumenter la compétence de Gabriel à sa place.

### Pourquoi ici, plutôt qu'ailleurs

Contrairement à LinkedIn, le site est **possédé, hiérarchisé et sobre** : ce qui compte est mis en avant, le bruit est absent, et la forme (lente à lire, dense en preuve) signale elle-même un niveau d'exigence.

### Avantage non reproductible

L'épaisseur réelle du parcours (réalisations vérifiables) combinée à des écrits techniques que peu de profils équivalents prennent le temps de produire. Le fond ne se simule pas.

## Métriques de succès

### Boussole (qualitative, sans tracking)

**Un inconnu qualifié comprend en 30 secondes ce que fait Gabriel, pour qui, à quel niveau — et repart en le jugeant crédible.** Mesure : retour direct (« j'ai vu ton site, c'est clair / pas clair »), pas d'analytics. Assumé : pas de KPI chiffré, pas de tracking, pas d'instrumentation.

### Signal d'échec

Si un évaluateur qualifié, après lecture, ne sait toujours pas quoi penser de Gabriel — ou doit aller chercher l'info ailleurs pour se décider — le site rate sa cible. C'est le seul échec qui compte.

## Principes produit

1. **P1 — Preuve > promesse** — on montre des réalisations et des écrits concrets, jamais d'auto-superlatifs. Décision tranchée : préférer une réalisation nommée et datée à un adjectif (« j'ai bâti X » plutôt que « expert en Y »).
2. **P2 — Sobriété au service du fond** — la technique reste discrète (SSG, ~1 KB JS), rien ne détourne du contenu. Décision tranchée : si un effet visuel ou un script n'aide pas à comprendre Gabriel, il dégage.
3. **P3 — Lisibilité immédiate** — tout sert le « compris en 30 s » : hiérarchie claire, zéro bruit. Décision tranchée : en cas de doute, on coupe plutôt que d'ajouter.
4. **P4 — Parité FR/EN** — bilingue de premier rang, l'audience pouvant être internationale. Décision tranchée : aucune page, aucun article ne vit durablement dans une seule langue par défaut.
5. **P5 — Indépendant et durable** — une présence qu'on possède, distincte de LinkedIn, faite pour durer (« fait main »). Décision tranchée : aucune dépendance à une plateforme tierce pour exister ou être consultable.

## Anti-objectifs

Ce qu'on **refuse explicitement** de faire, et pourquoi :

- **Pas une machine à leads** — aucun tracking, pop-up, newsletter, optimisation de conversion ni A/B testing. La sobriété et le respect du lecteur priment sur la capture. Un site qui « optimise la conversion » contredirait le signal d'exigence qu'il cherche à émettre.
- **Pas un blog à cadence** — aucune obligation de publier régulièrement. On écrit « quand il y a quelque chose à dire » ; la qualité prime sur la régularité. Un calendrier éditorial dégraderait le fond pour nourrir une fréquence.

## Hypothèses critiques

| #   | Hypothèse                                                                                                          | Comment l'invalider                                                                                                              | Statut   |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Un site personnel sobre et crédible pèse davantage dans une décision de sourcing qu'un profil LinkedIn seul.       | Des évaluateurs disent explicitement que le site n'a rien changé à leur jugement, ou qu'ils se seraient décidés pareil sans lui. | À tester |
| 2   | Des articles techniques de fond renforcent la crédibilité, même auprès de sourceurs non-techniques (effet signal). | Retours indiquant que les articles sont ignorés ou perçus comme du remplissage par les évaluateurs non-techniques.               | À tester |
| 3   | La parité FR/EN élargit utilement l'audience (évaluateurs internationaux).                                         | La version EN ne génère aucun contact ni consultation pertinente sur la durée.                                                   | À tester |

## Risques externes

- **LinkedIn reste le réflexe par défaut** : la plupart des sourceurs ne quittent jamais la plateforme. Mitigation — le site doit être le lien qu'on a envie de partager, suffisamment net pour valoir le détour ; il complète LinkedIn plutôt que de prétendre le remplacer.
- **Crédibilité par le fond = exigence de tenue dans le temps** : un contenu qui vieillit mal ou se contredit nuirait plus qu'il n'aide. Mitigation — privilégier des écrits qui datent bien, assumer les trous plutôt que combler artificiellement.

## Horizons

### Maintenant

Le socle de crédibilité est en place et c'est le seul horizon engagé : parcours détaillé, blog (notes tech/business/IA, sans cadence), side projects, contact, CV. Tout l'effort porte sur la tenue de ce socle au niveau d'exigence des principes — pas sur des paliers futurs flous.

> Aucun horizon « court terme » ou « long terme » n'est inscrit volontairement : la vision refuse de s'engager sur des jalons spéculatifs. Les évolutions se décideront au cas par cas via `/feature-pitch`, à l'aune de la boussole « compris en 30 s ».

## Notes pour les features à venir

Pointeurs bruts pour `/feature-pitch` — **non engagés**, juste consignés :

- Études de cas projets approfondies (Progicar, Passion Barbecue, Anytime) — épaissir la preuve au-delà de la mention.
- Pistes de rayonnement du contenu (le site cité/partagé au-delà du cercle direct) — à n'envisager que si cela ne contredit pas l'anti-objectif « pas une machine à leads ».
