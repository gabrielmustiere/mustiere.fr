# Plan d'article — Le workflow que j'utilise avec Claude Code : un bon PO, un bon lead, un bon dev

> Date : 2026-07-30
> Type : article-blog
> Slug pressenti : `forge-workflow-claude-code`
> Stack détectée : Astro Content Collections (schéma Zod strict, `src/content.config.ts`, loader `chapteredGlob`)
> Langue source : fr
> Multilingue : oui — pendant EN à décider après validation de la source

## Sujet & déclencheur

Comment mener un projet informatique de bout en bout avec Claude Code sans simuler une équipe agile complète. Le déclencheur est concret : j'ai testé
successivement GSD, BMAD-METHOD et GitHub Spec Kit, et j'ai décroché des trois — pour des raisons différentes, mais avec le même arrière-goût. Trop de
cérémonial, trop de contexte consommé, et surtout des rôles qui ne correspondent à rien de ce que j'ai vécu en quatorze ans de projets. Sur le terrain,
l'efficacité maximale ne vient jamais d'un organigramme : elle vient d'un bon PO, d'un bon lead technique et d'un bon développeur. C'est exactement ce trio,
et rien de plus, que j'ai voulu matérialiser dans `forge`.

Second déclencheur, plus discret mais tout aussi structurant : ces frameworks laissent la spécification à côté du code — dans un outil, un dossier séparé, un
artifact généré qu'on ne relit pas. Or le contexte le plus riche pour écrire une story, c'est le code lui-même. Et le contexte le plus riche pour implémenter
une story, c'est la story plus le code. Les séparer, c'est appauvrir les deux.

## Audience

Développeurs seniors, lead techs et CTO qui utilisent déjà Claude Code au quotidien et qui ont dépassé le stade du prompt à main levée. Ils ont soit essayé un
framework agentique et abandonné, soit lu passer BMAD / Spec Kit / GSD sans franchir le pas. Ils cherchent une méthode qui tienne sur un projet réel et dans la
durée, pas une démo. Niveau praticien assumé : on ne réexplique ni ce qu'est un agent, ni ce qu'est une fenêtre de contexte.

Audience secondaire, à ne pas laisser sur le bord : le lecteur qui n'installera jamais `forge` mais qui repartira avec les principes — artifacts versionnés,
séparation du registre fonctionnel et du registre technique, validation explicite entre étapes.

## Thèse

Un workflow agentique n'a pas besoin de simuler une équipe. Deux moments de cadrage — le fonctionnel, puis le technique — et une exécution suffisent : la
qualité d'un développement assisté par IA ne vient pas du nombre d'agents joués, mais de la qualité des documents relus avant qu'une ligne de code soit écrite,
et du fait que ces documents vivent dans le dépôt, à côté du code qu'ils décrivent.

## Angle

Je raconte **pourquoi j'ai remplacé les équipes d'agents par deux documents et un dépôt**, du point de vue d'un développeur qui a testé GSD, BMAD et Spec Kit,
en montrant que l'efficacité d'un workflow IA tient au cadrage écrit et à sa coprésence avec le code — pas au nombre de rôles simulés.

**Ce n'est pas :**

- Un tutoriel d'installation (`/plugin marketplace add` tient en trois lignes, ce n'est pas le sujet)
- Un benchmark chiffré des quatre outils — je n'ai pas fait tourner de protocole comparatif, et le prétendre serait malhonnête
- Un manifeste anti-agents : les sous-agents à contexte frais résolvent un vrai problème, l'article doit le reconnaître
- Une étude de cas projet (décision assumée : pas de fil rouge, les exemples sont les artifacts eux-mêmes)
- Une comparaison Claude Code vs Cursor vs Copilot

## Synthèse de recherche

**Sources lues :**

- `/Users/gabriel/projets/forge/plugins/forge/skills/help/SKILL.md` — le schéma du pipeline, les quatre phases, les trois tracks, le tableau de choix de track,
  la règle d'or de validation explicite, la section « Les ADR viennent à toi ». C'est la matière principale de l'article.
- `/Users/gabriel/projets/forge/plugins/forge/SKILLS.md` — l'inventaire des 26 skills et les quatre conventions transverses (métadonnées de story,
  frontières entre skills, prompting ADR, format des documents). La convention « un artifact a un seul écrivain » est un bon détail à citer.
- `/Users/gabriel/projets/forge/CLAUDE.md` et `README.md` — nature du dépôt, installation, positionnement.
- `src/content/blog/fr/002-php-symfony-2026-perspective-cto/**` — article de référence pour la voix (lu en entier).

**Recherches web :**

- _BMAD-METHOD agents roles_ → roster de personas complet (Analyst, PM, Architect, PO, Scrum Master, Dev, QA, UX Expert) plus un Orchestrator et un Master
  agent ; pipeline greenfield Analysis → Planning → Architecture → UX → Stories → Development → Validation ; production d'un Product Brief, d'un PRD et d'un
  document d'architecture avant toute implémentation. C'est un organigramme agile joué par des agents — le contraste le plus net avec la thèse.
- _GitHub Spec Kit_ → peu de rôles mais un cycle imposé `constitution → /specify → /plan → /tasks → /analyze`, avec `/analyze` en quality gate vérifiant la
  cohérence spec/plan/tâches vis-à-vis de la constitution. Compatible 30+ agents. Le défaut n'est pas le nombre de rôles mais le poids du cycle et son
  orientation greenfield.
- _GSD (Get Stuff Done, par TACHES)_ → six slash commands (`/gsd:new-project`, `/gsd:discuss-phase`, `/gsd:plan-phase`, `/gsd:execute-phase`,
  `/gsd:verify-work`, `/gsd:complete-milestone`) ; pas multi-rôles du tout — il attaque le _context rot_ en déléguant à des sous-agents dotés chacun d'un
  contexte frais. Bonne intuition, mais l'orchestration se paie en tokens. À traiter avec respect : c'est le plus proche de `forge` dans l'esprit.
- _Coût en contexte des systèmes multi-agents_ → ordres de grandeur relayés par Augment Code (un agent ≈ 4× les tokens d'un chat, un système multi-agents
  ≈ 15×) et un cas mesuré par TinyFish (850 K tokens contre 100 K pour un agent unique, soit ×8,5). **Sources secondaires** : à attribuer nommément dans le
  texte, jamais à asséner comme un fait établi.

**Angles concurrents identifiés :** le marché est saturé de contenus « découvrez BMAD / Spec Kit / GSD » — tutoriels d'adoption, guides pour débutants, listes
de commandes. Presque personne n'écrit le texte inverse : le retour d'expérience de quelqu'un qui les a essayés et qui explique **pourquoi il en est parti** et
**ce qu'il a construit à la place**.

**Angle libre à occuper :** le récit de décrochage argumenté, suivi de la méthode de remplacement. Position rare, crédible, et qui rend l'article utile même au
lecteur qui n'installera jamais le plugin.

## Chapitrage

### Intro (`index.mdx`)

**Promesse :** poser le déclencheur et la thèse en trois paragraphes, sans dérouler encore la méthode.
**Points clés :**

- Ancrage terrain : des années de projets, une conviction née de la pratique et non d'une lecture
- Trois frameworks testés, trois décrochages, une question restée : qu'est-ce qui produit réellement de la qualité ?
- La réponse courte : un bon PO, un bon lead, un bon dev — et des documents qui vivent dans le dépôt
- Annonce du plan et de la grille de lecture finale

**Artefacts :** aucun (prose seule, comme l'article de référence)

### 1. Ce que j'ai testé, et où j'ai décroché

**Promesse :** décrire honnêtement les trois frameworks, puis nommer les trois frictions qui m'ont fait partir.
**Points clés :**

- BMAD : le roster de personas et le pipeline greenfield complet — décrit factuellement, sans ironie
- Spec Kit : la constitution, `/specify`, `/plan`, `/tasks`, `/analyze` — un cycle cohérent mais lourd
- GSD : les six commandes et les sous-agents à contexte frais — la meilleure intuition des trois, à saluer explicitement
- Friction 1, le cérémonial : un Scrum Master agent ne tranche aucun arbitrage, il produit du document
- Friction 2, le contexte : chaque rôle recharge le décor ; citation attribuée des ordres de grandeur (×4, ×15, cas à ×8,5)
- Friction 3, la spec exilée : l'artifact généré vit à côté du code, souvent trop long pour être relu — donc pas relu
- Transition : ces trois frictions ont une racine commune — modéliser une organisation plutôt qu'un geste

**Artefacts :** tableau comparatif à trois lignes (framework / ce qu'il propose / pourquoi j'ai décroché) ; liens vers les dépôts et docs officiels

### 2. L'unité irréductible : un bon PO, un bon lead, un bon dev

**Promesse :** justifier le trio par l'expérience terrain, puis montrer sa traduction directe en artifacts.
**Points clés :**

- Ce qui débloque un projet en équipe réelle : quelqu'un qui sait dire non au périmètre, quelqu'un qui tranche la solution, quelqu'un qui exécute proprement
- Les rôles supplémentaires d'un organigramme agile servent la coordination — or il n'y a personne à coordonner face à un agent
- Deux moments de cadrage, pas deux personnes : le fonctionnel (`pitch.md`), puis le technique (`plan.md`)
- La règle du registre, qui est le cœur du dispositif : le pitch ne contient aucun nom de classe, de service ou de framework ; le plan ne rediscute pas le
  besoin. Un document = un but, un registre, une question
- Pourquoi cette séparation tient dans le temps : elle empêche l'agent de résoudre techniquement un problème mal posé
- Le troisième rôle, le dev, n'écrit pas de document — il exécute un plan et produit du code plus des tests

**Artefacts :** tableau (rôle réel / moment de cadrage / artifact produit / registre imposé) ; extrait court montrant l'en-tête normalisé d'un document

### 3. Le dépôt est la source de vérité

**Promesse :** défendre le choix structurant — la story vit dans `docs/story/`, versionnée avec le code — et en montrer les trois effets.
**Points clés :**

- Le constat de départ : une spec dans un outil de ticketing est invisible à l'agent, et périmée dès la deuxième itération
- Effet 1, côté PO : on cadre avec le code sous les yeux. Le périmètre proposé devient réaliste parce qu'il est confronté à l'existant, pas imaginé à côté
- Effet 2, côté implémentation : à l'exécution, le modèle a le pitch, le plan et le code dans la même fenêtre. C'est le contexte le plus riche possible, et il
  est gratuit — il suffit de ne pas l'avoir dispersé
- Effet 3, côté relecture : une story versionnée se relit en diff, se commente en revue, se blâme. Elle passe la même barre de qualité que le code
- La convention de nommage `NNN-<f|r|t>-<slug>` : compteur global d'abord, donc `ls docs/story/` restitue la timeline du projet dans l'ordre
- `metadata.json` par story : titre, dates, tags, changelog consolidé, livraison. Un fichier machine-lisible, donc branchable — mentionner Forge Board en une
  phrase, comme conséquence naturelle de ce choix, sans en faire une démo
- Le corollaire honnête : le dépôt grossit, et les artifacts d'une story livrée restent. C'est le prix de la mémoire

**Artefacts :** arborescence commentée d'un `docs/story/` réel (plusieurs stories, tracks mélangés) ; bloc `metadata.json` abrégé

### 4. Quatre phases, trois tracks

**Promesse :** donner le squelette complet du pipeline et le critère de choix, pour que le lecteur sache où il met les pieds.
**Points clés :**

- Les deux axes qu'il ne faut pas confondre : la phase dit _quand_, le track dit _avec quelles skills_
- Phase 0, à poser une fois : vision, backlog produit, stack, `CLAUDE.md`, règles projet scopées par chemins. Ce sont des documents vivants, pas des livrables
  figés
- Phases 1 à 3 traversées par chaque story : cadrer, implémenter, clôturer
- Les trois tracks et leur logique : feature (valeur utilisateur), refacto (comportement strictement figé), tech (observable mais sans valeur user nouvelle)
- Le test de choix, en questions fermées — et le piège du diff qui mélange deux tracks
- Le track fast, et l'aveu utile : sur un changement de trois fichiers, le pipeline complet est une perte de temps. Le dire renforce le reste

**Artefacts :** tableau de choix de track (question → track) ; schéma ASCII simplifié du pipeline, allégé par rapport à celui de `/forge:help`

### 5. Le déroulé d'une feature, du besoin flou au commit

**Promesse :** montrer la méthode en marche, étape par étape, avec ce que chaque étape produit et ce qu'elle coûte.
**Points clés :**

- Le besoin flou : `feature-interview` produit un `brief.md` à partir d'un irritant mal formulé, ancré sur une reconnaissance du code existant
- Le cadrage fonctionnel : `feature-pitch` challenge l'alignement avec la vision et le backlog, et produit le `pitch.md`
- Le cadrage technique : `feature-plan` conçoit la solution, liste les alternatives écartées, découpe en étapes vérifiables
- L'exécution : `feature-implem` avance sous-tâche par sous-tâche avec QA continue — l'agent ne part pas en roue libre sur trente fichiers
- La règle d'or : aucune étape ne s'enchaîne sans validation explicite. C'est ce qui rend le workflow supportable en durée
- Le retournement à faire sentir au lecteur : on ne relit plus un diff de six cents lignes, on relit un plan de deux pages **avant** qu'il existe. C'est le
  vrai gain, et il est cognitif avant d'être économique

**Artefacts :** extrait squelettique d'un `plan.md` (titres de sections canoniques, pas de contenu) ; encart sur le format des étapes

### 6. Clôturer sans laisser de dette documentaire

**Promesse :** expliquer pourquoi la fin d'une story compte autant que son début, et pourquoi le commit vient en dernier.
**Points clés :**

- `review` sur le diff non commité — sécurité, qualité, conformité au plan
- `report.md` : la mémoire factuelle, figée, de ce qui a été fait par rapport à ce qui était prévu — écarts, dette laissée, métriques obtenues
- `sync` : réaligner les documents d'intention pour qu'ils se lisent comme s'ils avaient été justes dès le départ, sans cicatrice de l'historique
- La distinction qui mérite un paragraphe entier : `report` raconte une fois pour toutes, `sync` révise en place. Une doc d'intention non réalignée est pire
  qu'une absence de doc, parce qu'elle ment avec autorité
- `commit` en dernier, embarquant code, report et documents réalignés en un seul geste
- Les ADR qui viennent à toi : neuf skills proposent d'en graver un quand la décision passe un test d'ADR-ité ; la proposition tient en une ligne, n'est jamais
  bloquante, et le silence est le cas normal. L'insight à formuler : un ADR ne se perd pas quand on prend la décision, mais quand on passe à la suite

**Artefacts :** tableau (skill de clôture / ce qu'il produit / ce qu'il ne fait pas)

### 7. Ce que ça coûte vraiment

**Promesse :** payer honnêtement le prix de la méthode avant d'en vendre le bénéfice.
**Points clés :**

- Le coût réel : le cadrage prend du temps humain, et les validations successives sont bavardes. Sur une petite story, c'est disproportionné
- L'économie de contexte : moins de rôles rechargés, des documents courts et relus plutôt que des specs générées jamais ouvertes. Rappeler les ordres de
  grandeur cités en section 1, en gardant l'attribution
- La contrepartie invisible : un agent qui repart d'une story bien cadrée refait moins de tours de boucle. Le token économisé n'est pas celui du prompt, c'est
  celui de la reprise
- `estimate.md` et ses deux colonnes — temps de référence sans IA, temps réel avec assistant — parce que l'écart entre les deux est exactement ce qu'on facture
  ou ce qu'on négocie. Point intéressant pour un lecteur freelance
- `status` à la reprise : après trois semaines, on ne sait plus où on en est. Recenser les stories, leur fraîcheur, l'état du dépôt, et nommer une seule reprise
- Le garde-fou à dire tout haut : un plan dormant depuis plus d'un mois se relit avant d'être exécuté

**Artefacts :** tableau des deux colonnes d'estimation (structure, sans chiffres inventés)

### 8. Quand ce workflow est le bon choix

**Promesse :** donner une grille de décision utilisable, et refuser explicitement les cas où la méthode ne sert à rien.
**Points clés :**

- La grille en critères, sur le modèle de la conclusion PHP/Symfony : durée de vie du projet, taille du diff typique, nombre de reprises après pause,
  besoin de traçabilité, travail en solo ou à plusieurs
- Ce pour quoi ce n'est pas fait : script jetable, POC exploratoire, one-shot, terrain de jeu — et l'équipe qui n'écrira de toute façon rien
- Le cas où le bénéfice est maximal : projet qu'on reprend par intermittence, où la mémoire du contexte est le vrai goulot
- Fermeture sur la thèse, sans la répéter mot pour mot : ce n'est pas le nombre d'agents qui fait la qualité, c'est ce qu'on a écrit avant de les lancer

**Artefacts :** tableau final (critère / verdict), format identique à la conclusion de l'article PHP/Symfony

### `resume.mdx`

Synthèse dense de 120 à 180 mots destinée aux moteurs et aux LLM : les trois frameworks testés, le trio PO / lead / dev, les artifacts versionnés dans le
dépôt, les quatre phases et trois tracks, la clôture `review → report → sync → commit`, et la position finale. Même densité factuelle que le `resume.mdx` de
l'article PHP/Symfony. Contrainte de schéma : `plain` doit faire au moins 60 caractères — sans objet ici, mais à ne pas oublier.

### `faq.mdx`

Trois questions, calibrées comme celles de l'article de référence (réponses longues, nuancées, qui tranchent) :

1. Est-ce que ça vaut le coup sur un projet solo, ou est-ce que le cadrage écrit est un luxe d'équipe ?
2. Combien de temps ajoute réellement le cadrage avant qu'une ligne de code soit écrite ?
3. Est-ce que ça marche avec un autre agent que Claude Code, ou avec un autre plugin de workflow ?

## Tonalité

- **Voix :** « je », praticien, ancré sur le vécu. C'est la voix dominante des deux articles publiés et elle porte particulièrement bien ici, l'article étant un
  récit de décision personnelle
- **Niveau :** praticien assumé. Le lecteur sait ce qu'est un agent, une fenêtre de contexte, un slash command. On n'explique ni Claude Code ni le
  fonctionnement d'un LLM
- **Rythme :** paragraphes de trois à cinq phrases, tableaux de synthèse en fin de section, blocs de code courts et rares (arborescences, YAML, squelettes de
  documents — jamais de code applicatif, il n'y en a pas dans le sujet). Alternance prose dense / tableau, comme dans l'article PHP/Symfony
- **À éviter :** exclamations, emojis, superlatifs, « dans cet article nous verrons », relances LinkedIn, majuscules emphatiques, tirets cadratins en pagaille
  (un par paragraphe maximum), et surtout tout ton de dénigrement envers BMAD, Spec Kit ou GSD
- **À reproduire :** l'ouverture par un ancrage chiffré et personnel ; la reconnaissance explicite de ce qu'on ne maîtrise pas (dans l'article PHP/Symfony :
  « je n'ai pas utilisé Laravel en profondeur ») — ici, l'équivalent est « je n'ai pas fait tourner de protocole comparatif » ; les tableaux qui synthétisent
  plutôt qu'ils n'énumèrent ; la conclusion en grille de critères plutôt qu'en résumé ; les liens sortants vers les sources officielles

**Articles de référence :**

- `src/content/blog/fr/002-php-symfony-2026-perspective-cto/` — référence principale (structure chapitrée, tableaux, conclusion en grille, FAQ nuancée)
- `src/content/blog/fr/001-construire-ce-site-avec-claude-et-astro/` — référence secondaire pour le registre « retour d'expérience outillage IA »

## Frontmatter prévisionnel

```yaml
title: 'Le workflow que j’utilise avec Claude Code : un bon PO, un bon lead, un bon dev'
excerpt:
  'J’ai testé GSD, BMAD et Spec Kit avant de construire forge. Pourquoi deux documents versionnés dans le dépôt battent une équipe d’agents simulée, et comment
  mener un projet du cadrage au commit.'
publishedAt: 2026-07-30
category: IA
tags: [Claude Code, Forge, Workflow, Agents, Spec-Driven Development, PO]
cover: ./cover.png
coverAlt: 'Le pipeline forge : cadrage, implémentation, clôture avec Claude Code'
keywords:
  - workflow Claude Code
  - plugin Claude Code
  - forge Claude Code
  - BMAD METHOD
  - GitHub Spec Kit
  - GSD framework
  - spec-driven development
  - développement assisté par IA
  - artifacts versionnés
  - cadrage produit IA
number: 3
draft: false
lang: fr
slug: forge-workflow-claude-code
translationKey: forge-workflow-claude-code
```

Contraintes de schéma vérifiées : `title` ≤ 120 caractères, `excerpt` entre 80 et 220 caractères (à recompter précisément à la rédaction — la proposition
ci-dessus est proche de la borne haute), `category` dans l'enum `IA | Tech | Lead | Business`, `slug` en kebab-case strict, `number` en entier positif suivant
la séquence FR (1 puis 2 publiés, donc 3), `cover` obligatoire sauf à hériter via `translationKey`, `resume` requis par le schéma — donc `resume.mdx`
obligatoire dans le dossier.

**Variantes de titre envisagées :**

1. « Le workflow que j’utilise avec Claude Code : un bon PO, un bon lead, un bon dev » _(retenue — porte le trio, qui est la thèse)_
2. « Forge : pourquoi j’ai remplacé les équipes d’agents par deux documents »
3. « Développer avec Claude Code sans simuler une équipe agile »

**Variantes de slug envisagées :** `forge-workflow-claude-code` _(retenue — nomme le produit et capte la requête principale)_, `workflow-claude-code-po-dev`,
`workflow-ia-sans-equipe-agents`.

**Pendant traduit :** à décider après validation de la source. Si retenu — slug EN pressenti `forge-claude-code-workflow`, `translationKey` partagée
`forge-workflow-claude-code`, `number: 3` partagé entre les deux langues, cover héritée du FR via la `translationKey` (pas de `cover` déclarée côté EN).

## Risques & garde-fous

- **Les chiffres de consommation de tokens (×4, ×15, 850 K contre 100 K) viennent de sources secondaires** → les attribuer nommément dans le corps du texte
  (« selon Augment Code », « un cas mesuré par TinyFish »), ne jamais les présenter comme un fait établi, et renseigner les deux URLs dans `sources.mdx`. Au
  moindre doute à la rédaction : les retirer plutôt que les affaiblir par des précautions verbeuses.
- **Le dénigrement des trois frameworks tuerait la crédibilité de l'article** → chacun est décrit d'abord par ce qu'il réussit. GSD en particulier mérite un
  éloge explicite sur le traitement du _context rot_. La critique porte sur l'adéquation à un contexte de travail, jamais sur la qualité du travail des auteurs.
- **L'article peut glisser vers le catalogue de skills** — il y en a 26, et les énumérer serait mortel → limite ferme : ne nommer une skill que lorsqu'elle
  illustre un principe déjà posé. Les sections 4 à 6 sont les zones à risque. La documentation exhaustive existe déjà sur `forge.mustiere.fr`, l'article renvoie
  vers elle plutôt que de la dupliquer.
- **Décrire un état du plugin qui périmera** (numéro de version, nombre de skills, noms exacts) → parler des principes et des artifacts, qui bougent peu ;
  éviter de citer un numéro de version dans le corps ; si un compte de skills est mentionné, le dater explicitement.
- **La section 3 est le pilier de l'article et peut être noyée** entre le récit de décrochage et le déroulé du pipeline → lui donner du volume, un titre fort,
  et y placer l'arborescence commentée. Si l'article doit être raccourci, c'est ailleurs qu'on coupe.
- **Aucun fil rouge projet n'a été retenu** (décision de cadrage) → le risque est un article abstrait. Compensation : les exemples concrets viennent des
  artifacts eux-mêmes (arborescence, `metadata.json`, squelette de `plan.md`, en-têtes normalisés), pas d'anecdotes projet. À surveiller à la relecture : toute
  section sans artifact concret est une section en danger.
- **La FAQ doit trancher, pas ménager** → sur « est-ce que ça vaut le coup en solo », la réponse honnête est nuancée mais doit finir par un verdict.

## Prochaine étape

Rédaction complète à partir de ce plan — dossier cible `src/content/blog/fr/003-forge-workflow-claude-code/`, structure chapitrée (`index.mdx`, `01-` à `08-`,
`resume.mdx`, `faq.mdx`, `sources.mdx`, `cover.png`). Lancer `/editorial:article` ou demander : « rédige l'article depuis ce plan ».
