---
title: 'Symfony Template'
subtitle: "Template GitHub prêt à l'emploi pour démarrer un projet Symfony sans perdre une journée en boilerplate"
status: 'v1.0'
kind: 'Template / OSS'
year: 2026
excerpt: "Un squelette Symfony 8 pré-configuré : Tailwind 4, SQLite, Mailpit, tests Unit/Functional/E2E, PHPStan niveau 9 et serveurs MCP pour l'assistance IA."
cover: '/images/projects/symfony-template-banner.png'
summary: "Un template GitHub qui condense une journée de boilerplate Symfony en cinq commandes. Symfony 8 sur PHP 8.4, Tailwind 4 sans bundler externe, SQLite par défaut pour éviter toute infra locale, Mailpit pour inspecter les mails de dev, trois niveaux de tests câblés (PHPUnit + Playwright), PHPStan au niveau maximal dès le premier commit, et trois serveurs MCP prêts à brancher sur Claude Code. Les choix par défaut sont assumés — pas de Redis, pas d'API Platform, pas de design system — pour qu'on puisse cloner et écrire du code métier dans la même heure, plutôt que de passer deux jours à désinstaller ce qu'on ne veut pas."
url: 'https://github.com/gabrielmustiere/symfony-template'
order: 1
faq:
  - question: "À qui s'adresse ce template ?"
    answer: "Aux développeurs qui démarrent régulièrement de nouveaux projets Symfony et qui perdent systématiquement une journée à recâbler les mêmes décisions : base de données locale, outil de mails, tests E2E, analyse statique. Il s'adresse aussi aux équipes qui veulent un point de départ cohérent plutôt que de négocier ces choix à chaque kickoff."
  - question: 'Pourquoi SQLite plutôt que PostgreSQL par défaut ?'
    answer: "La plupart des projets n'ont pas besoin de PostgreSQL pendant les premières semaines. SQLite permet de cloner, lancer composer install, migrer et coder sans container ni port à ouvrir. Le jour où une feature exige JSONB, FTS ou une extension Postgres, Doctrine abstrait suffisamment pour que la migration soit courte."
  - question: 'Pourquoi Playwright plutôt que Symfony Panther ?'
    answer: "Panther reste bloqué sur ChromeDriver et atteint vite ses limites dès qu'il y a du JavaScript un peu dense. Playwright couvre plus de navigateurs, embarque de meilleurs outils de debug (trace viewer, codegen) et la communauté est incomparablement plus active. La migration est assumée — plus lent à l'exécution, mais beaucoup plus fiable."
  - question: 'Pourquoi PHPStan niveau 9 dès le départ ?'
    answer: "Commencer à un niveau bas avec l'idée de monter plus tard ne se fait jamais en pratique. Démarrer à 9 oblige à typer correctement tout de suite, et le coût marginal est nul quand le code est neuf. Sur un projet existant, rattraper la dette typage fait partie des pires chantiers — autant éviter de la créer."
  - question: 'Que manque-t-il intentionnellement ?'
    answer: "Pas de Redis ou RabbitMQ préconfiguré, pas de CI GitHub Actions livrée, pas de design system, pas d'API Platform. Ces pièces sont trop dépendantes du contexte pour qu'un template impose un choix générique qui finira à la poubelle. Elles s'ajoutent en quelques minutes le jour où le projet en a réellement besoin."
  - question: "Comment l'utiliser concrètement ?"
    answer: "Via le bouton « Use this template » sur GitHub, puis cinq commandes : composer install, npm install, copier le .env, lancer les migrations et fixtures, puis symfony serve. Compter une dizaine de minutes avant d'écrire la première ligne de code métier."
lang: fr
translationOf: 'symfony-template-en'
---

## Pourquoi ce template

Chaque nouveau projet Symfony commence par les mêmes gestes : câbler Doctrine, choisir un front, configurer les tests, décider où les mails partent en dev, mettre en place l'analyse statique. Répété une dizaine de fois, ça finit par représenter une journée entière avant la première ligne de code métier.

Ce dépôt condense ces décisions dans un template GitHub que l'on clone en un clic. L'objectif n'est pas de tout faire à la place du développeur, mais de **lever les questions qui n'apportent rien au projet** : quelle base de données en local, comment voir les emails, comment lancer les tests E2E, où configurer le style, etc.

## Ce qu'il contient

### Stack principale

- **Symfony 8.0+** sur **PHP 8.4+**, avec le CLI Symfony pour le serveur local (proxy HTTPS `*.wip` inclus).
- **SQLite** comme base par défaut. Zéro infra à installer, un fichier `var/data.db`, et la migration vers Postgres ou MySQL reste triviale le jour où c'est nécessaire.
- **Tailwind CSS 4** via Symfony UX — pas de bundler externe, Tailwind tourne en watch automatiquement grâce au fichier `.symfony.local.yaml`.
- **Mailpit** (via Docker Compose) pour intercepter les mails en dev, accessible sur `http://localhost:8027`.

### Authentification

Un système d'authentification par formulaire (email / mot de passe) est livré fonctionnel : entité User, formulaire de login, firewall configuré, tests associés. Pas de magie : du Symfony standard, prêt à être étendu (2FA, OAuth, magic link) selon le besoin réel du projet.

### Tests

Trois niveaux, tous câblés :

- **PHPUnit 12** pour l'unitaire et le fonctionnel, via `symfony php bin/phpunit`.
- **Playwright** pour les tests E2E — migration assumée depuis Panther, plus lent mais beaucoup plus fiable sur les interactions JavaScript modernes.
- Une base SQLite dédiée aux tests (`var/data_test.db`) isole les jeux de données sans cérémonie.

### Qualité

- **PHPStan niveau 9** : le maximum. Pas de compromis.
- **PHP-CS-Fixer** pour le style.
- **EditorConfig** pour que l'IDE du suivant ne décide pas à la place du projet.

### Asynchrone

**Symfony Messenger** configuré avec un transport Doctrine. Pas de Redis ou RabbitMQ imposé — on reste sur l'infra zéro tant que la charge le permet, et on change de transport sans toucher au code métier quand il faut.

### Assistance IA

Le fichier `.mcp.json` livre trois serveurs MCP prêts pour Claude Code :

- `symfony-ai-mate` — accès au profiler Symfony, aux logs Monolog et aux services du container.
- `playwright` — automatisation navigateur pour debug et scénarios E2E.
- `chrome-devtools` — interaction avec Chrome via le DevTools Protocol.

Concrètement : un assistant IA branché à ce template comprend ce qui se passe dans l'application sans qu'on lui mâche le contexte à chaque question.

## Les choix assumés

### SQLite plutôt que Postgres par défaut

La plupart des projets qui démarrent n'ont pas besoin de Postgres pendant les premières semaines. SQLite permet de cloner, `composer install`, migrer et coder, sans lancer un container ni ouvrir un port. Le jour où une feature exige JSONB, FTS ou les extensions Postgres, on migre — Doctrine abstrait suffisamment pour que la douleur soit minime.

### Tailwind sans bundler externe

Vite, Webpack Encore, esbuild : trois façons de répondre à la même question. Symfony UX + Tailwind 4 donne une solution intégrée qui se comporte bien avec le CLI Symfony. Moins de pièces mobiles, moins de décisions à prendre pour quelque chose qui n'est jamais le cœur du produit.

### PHPStan niveau 9 dès le jour 1

Commencer à un niveau bas et « on montera plus tard » ne se fait jamais. Démarrer à 9 oblige à typer correctement tout de suite, et le coût marginal est nul quand le code est neuf. Sur un projet existant, la dette typage est un des pires chantiers à rattraper.

### Playwright plutôt que Panther

Panther restait bloqué sur ChromeDriver et montrait ses limites dès qu'on touchait à du JavaScript un peu dense. Playwright couvre plus de navigateurs, a de meilleurs outils de debug (trace viewer, codegen), et la communauté est incomparablement plus active.

## Ce qui n'y est pas — intentionnellement

- **Pas de Redis, RabbitMQ ou ElasticSearch préconfiguré**. La majorité des projets n'en a pas besoin avant plusieurs mois, et mieux vaut les ajouter au moment où la contrainte apparaît que les traîner dès le départ.
- **Pas de CI GitHub Actions livrée**. Elle est trop dépendante du contexte (qui est notifié, quelles branches protégées, quels déploiements) pour qu'un template impose une version générique qui finira à la poubelle.
- **Pas de design system**. Tailwind est câblé, le reste est volontairement vide — un template visuel mal choisi est plus coûteux à retirer qu'à ajouter.
- **Pas d'API Platform**. Trop structurant pour être par défaut. On l'ajoute en cinq minutes quand le projet est effectivement une API.

## Comment l'utiliser

```bash
# 1. Créer un nouveau dépôt depuis le template (bouton "Use this template" sur GitHub)
# 2. Cloner, installer
symfony composer install
npm install

# 3. Configurer l'environnement
cp .env .env.local  # adapter les variables

# 4. Préparer la base
symfony console doctrine:migrations:migrate -n
symfony console doctrine:fixtures:load -n

# 5. Démarrer
symfony serve
```

Cinq commandes, dix minutes, et on écrit du code métier.

## Perspectives

Ce template est versionné (v1.0.0 à ce stade) et évolue avec mes propres projets Symfony. Les ajouts probables dans les prochaines versions :

- Un système de feature flags minimaliste (Doctrine-backed, sans dépendance externe).
- Un exemple de Live Component un peu non-trivial, au-delà du hello world.
- Un template GitHub Actions optionnel, désactivé par défaut, pour ceux qui veulent une CI starter.
- Documentation des points d'extension courants : OAuth, rôles plus fins, audit log.

L'idée n'est pas d'ajouter tout ce qui pourrait servir, mais seulement ce que je finis systématiquement par reconstruire à la main dans mes projets réels. Le reste reste en dehors du template — par respect pour la personne qui va cloner et ne voudra pas passer deux heures à désinstaller ce qu'elle n'utilise pas.
