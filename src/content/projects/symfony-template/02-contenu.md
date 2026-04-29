## Ce qu'il contient

### Stack principale

- **Symfony 8.0+** sur **PHP 8.4+**, avec le CLI Symfony pour le serveur local (proxy HTTPS `*.wip` inclus).
- **SQLite** comme base par défaut. Zéro infra à installer, un fichier `var/data.db`, et la migration vers Postgres ou MySQL reste triviale le jour où c'est
  nécessaire.
- **Tailwind CSS 4** via Symfony UX — pas de bundler externe, Tailwind tourne en watch automatiquement grâce au fichier `.symfony.local.yaml`.
- **Mailpit** (via Docker Compose) pour intercepter les mails en dev, accessible sur `http://localhost:8027`.

### Authentification

Un système d'authentification par formulaire (email / mot de passe) est livré fonctionnel : entité User, formulaire de login, firewall configuré, tests
associés. Pas de magie : du Symfony standard, prêt à être étendu (2FA, OAuth, magic link) selon le besoin réel du projet.

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

**Symfony Messenger** configuré avec un transport Doctrine. Pas de Redis ou RabbitMQ imposé — on reste sur l'infra zéro tant que la charge le permet, et on
change de transport sans toucher au code métier quand il faut.

### Assistance IA

Le fichier `.mcp.json` livre trois serveurs MCP prêts pour Claude Code :

- `symfony-ai-mate` — accès au profiler Symfony, aux logs Monolog et aux services du container.
- `playwright` — automatisation navigateur pour debug et scénarios E2E.
- `chrome-devtools` — interaction avec Chrome via le DevTools Protocol.

Concrètement : un assistant IA branché à ce template comprend ce qui se passe dans l'application sans qu'on lui mâche le contexte à chaque question.
