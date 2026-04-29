## What's inside

### Core stack

- **Symfony 8.0+** on **PHP 8.4+**, with the Symfony CLI for the local server (HTTPS `*.wip` proxy included).
- **SQLite** as the default database. Zero infra to install, a single `var/data.db` file, and migration to Postgres or MySQL stays trivial when the day comes.
- **Tailwind CSS 4** via Symfony UX — no external bundler, Tailwind runs in watch mode automatically thanks to `.symfony.local.yaml`.
- **Mailpit** (via Docker Compose) to intercept dev emails, reachable at `http://localhost:8027`.

### Authentication

A form-based authentication system (email / password) ships working: User entity, login form, firewall configured, tests included. No magic: standard Symfony,
ready to extend (2FA, OAuth, magic link) based on the project's real needs.

### Tests

Three tiers, all wired:

- **PHPUnit 12** for unit and functional tests, via `symfony php bin/phpunit`.
- **Playwright** for E2E — an owned migration from Panther, slower but far more reliable on modern JavaScript interactions.
- A dedicated test SQLite database (`var/data_test.db`) isolates fixtures without ceremony.

### Quality

- **PHPStan level 9**: the maximum. No compromise.
- **PHP-CS-Fixer** for style.
- **EditorConfig** so the next developer's IDE doesn't make decisions on behalf of the project.

### Async

**Symfony Messenger** configured with a Doctrine transport. No Redis or RabbitMQ imposed — we stay at zero infra as long as the load allows, and we switch
transports without touching business code when we need to.

### AI assistance

The `.mcp.json` file ships three MCP servers ready for Claude Code:

- `symfony-ai-mate` — access to the Symfony profiler, Monolog logs, and container services.
- `playwright` — browser automation for debugging and E2E scenarios.
- `chrome-devtools` — interaction with Chrome via the DevTools Protocol.

In practice: an AI assistant plugged into this template understands what's happening in the application without you hand-feeding context at every question.
