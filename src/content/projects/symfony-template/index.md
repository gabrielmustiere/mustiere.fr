---
title: 'Symfony Template'
subtitle: "Template GitHub prêt à l'emploi pour démarrer un projet Symfony sans perdre une journée en boilerplate"
status: 'v1.0'
kind: 'Template / OSS'
year: 2026
excerpt: "Un squelette Symfony 8 pré-configuré : Tailwind 4, SQLite, Mailpit, tests Unit/Functional/E2E, PHPStan niveau 9 et serveurs MCP pour l'assistance IA."
cover: '/images/projects/symfony-template-banner.png'
summary:
  "Un template GitHub qui condense une journée de boilerplate Symfony en cinq commandes. Symfony 8 sur PHP 8.4, Tailwind 4 sans bundler externe, SQLite par
  défaut pour éviter toute infra locale, Mailpit pour inspecter les mails de dev, trois niveaux de tests câblés (PHPUnit + Playwright), PHPStan au niveau
  maximal dès le premier commit, et trois serveurs MCP prêts à brancher sur Claude Code. Les choix par défaut sont assumés — pas de Redis, pas d'API Platform,
  pas de design system — pour qu'on puisse cloner et écrire du code métier dans la même heure, plutôt que de passer deux jours à désinstaller ce qu'on ne veut
  pas."
url: 'https://github.com/gabrielmustiere/symfony-template'
order: 1
faq:
  - question: "À qui s'adresse ce template ?"
    answer:
      "Aux développeurs qui démarrent régulièrement de nouveaux projets Symfony et qui perdent systématiquement une journée à recâbler les mêmes décisions :
      base de données locale, outil de mails, tests E2E, analyse statique. Il s'adresse aussi aux équipes qui veulent un point de départ cohérent plutôt que de
      négocier ces choix à chaque kickoff."
  - question: 'Pourquoi SQLite plutôt que PostgreSQL par défaut ?'
    answer:
      "La plupart des projets n'ont pas besoin de PostgreSQL pendant les premières semaines. SQLite permet de cloner, lancer composer install, migrer et coder
      sans container ni port à ouvrir. Le jour où une feature exige JSONB, FTS ou une extension Postgres, Doctrine abstrait suffisamment pour que la migration
      soit courte."
  - question: 'Pourquoi Playwright plutôt que Symfony Panther ?'
    answer:
      "Panther reste bloqué sur ChromeDriver et atteint vite ses limites dès qu'il y a du JavaScript un peu dense. Playwright couvre plus de navigateurs,
      embarque de meilleurs outils de debug (trace viewer, codegen) et la communauté est incomparablement plus active. La migration est assumée — plus lent à
      l'exécution, mais beaucoup plus fiable."
  - question: 'Pourquoi PHPStan niveau 9 dès le départ ?'
    answer:
      "Commencer à un niveau bas avec l'idée de monter plus tard ne se fait jamais en pratique. Démarrer à 9 oblige à typer correctement tout de suite, et le
      coût marginal est nul quand le code est neuf. Sur un projet existant, rattraper la dette typage fait partie des pires chantiers — autant éviter de la
      créer."
  - question: 'Que manque-t-il intentionnellement ?'
    answer:
      "Pas de Redis ou RabbitMQ préconfiguré, pas de CI GitHub Actions livrée, pas de design system, pas d'API Platform. Ces pièces sont trop dépendantes du
      contexte pour qu'un template impose un choix générique qui finira à la poubelle. Elles s'ajoutent en quelques minutes le jour où le projet en a réellement
      besoin."
  - question: "Comment l'utiliser concrètement ?"
    answer:
      "Via le bouton « Use this template » sur GitHub, puis cinq commandes : composer install, npm install, copier le .env, lancer les migrations et fixtures,
      puis symfony serve. Compter une dizaine de minutes avant d'écrire la première ligne de code métier."
lang: fr
translationOf: 'symfony-template-en'
---
