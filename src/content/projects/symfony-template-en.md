---
title: 'Symfony Template'
subtitle: 'A ready-to-use GitHub template to start a Symfony project without burning a day on boilerplate'
status: 'v1.0'
kind: 'Template / OSS'
year: 2026
excerpt: 'A pre-configured Symfony 8 skeleton: Tailwind 4, SQLite, Mailpit, Unit/Functional/E2E tests, PHPStan level 9, and MCP servers wired for AI assistance.'
cover: '/images/projects/symfony-template-banner.png'
summary: "A GitHub template that compresses a day of Symfony boilerplate into five commands. Symfony 8 on PHP 8.4, Tailwind 4 without an external bundler, SQLite by default to avoid any local infra, Mailpit to inspect dev emails, three test tiers wired up (PHPUnit + Playwright), PHPStan at its maximum level from the first commit, and three MCP servers ready to plug into Claude Code. The defaults are opinionated — no Redis, no API Platform, no design system — so you can clone and start writing business code within the hour, instead of spending two days uninstalling what you don't want."
url: 'https://github.com/gabrielmustiere/symfony-template'
order: 1
faq:
  - question: 'Who is this template for?'
    answer: "Developers who regularly kick off new Symfony projects and keep losing a full day rewiring the same decisions: local database, mail tool, E2E tests, static analysis. It's also for teams who want a consistent starting point instead of renegotiating those choices at every kickoff."
  - question: 'Why SQLite instead of PostgreSQL by default?'
    answer: "Most projects don't need PostgreSQL in their first few weeks. SQLite lets you clone, run composer install, migrate, and start coding without a container or an open port. The day a feature actually needs JSONB, FTS, or a Postgres extension, Doctrine abstracts things enough that the migration is short."
  - question: 'Why Playwright instead of Symfony Panther?'
    answer: 'Panther is still stuck on ChromeDriver and hits its limits quickly on JavaScript-heavy pages. Playwright covers more browsers, ships better debug tooling (trace viewer, codegen), and the community is incomparably more active. The trade-off is owned — slower to run, but far more reliable.'
  - question: 'Why PHPStan level 9 from day one?'
    answer: 'Starting at a low level with the plan to raise it later never happens in practice. Starting at 9 forces correct typing right away, and the marginal cost is zero when the code is new. On an existing project, catching up on type debt is one of the worst possible clean-ups — better not to create it.'
  - question: "What's intentionally missing?"
    answer: 'No preconfigured Redis or RabbitMQ, no GitHub Actions CI shipped, no design system, no API Platform. Those pieces are too context-dependent for a template to impose a generic choice that will end up being thrown away. They take minutes to add the day the project actually needs them.'
  - question: 'How do I actually use it?'
    answer: 'Hit the "Use this template" button on GitHub, then five commands: composer install, npm install, copy the .env, run migrations and fixtures, then symfony serve. Expect roughly ten minutes before you write the first line of business code.'
lang: en
translationOf: 'symfony-template'
---

## Why this template

Every new Symfony project starts with the same motions: wire Doctrine, pick a front-end, configure tests, decide where dev emails go, set up static analysis. Repeated ten times, that's a full day before the first line of business code.

This repo packs those decisions into a GitHub template you clone with one click. The goal isn't to make every choice for the developer, but to **clear the questions that add nothing to the project**: which database locally, how to see emails, how to run E2E tests, where to configure styling, and so on.

## What's inside

### Core stack

- **Symfony 8.0+** on **PHP 8.4+**, with the Symfony CLI for the local server (HTTPS `*.wip` proxy included).
- **SQLite** as the default database. Zero infra to install, a single `var/data.db` file, and migration to Postgres or MySQL stays trivial when the day comes.
- **Tailwind CSS 4** via Symfony UX — no external bundler, Tailwind runs in watch mode automatically thanks to `.symfony.local.yaml`.
- **Mailpit** (via Docker Compose) to intercept dev emails, reachable at `http://localhost:8027`.

### Authentication

A form-based authentication system (email / password) ships working: User entity, login form, firewall configured, tests included. No magic: standard Symfony, ready to extend (2FA, OAuth, magic link) based on the project's real needs.

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

**Symfony Messenger** configured with a Doctrine transport. No Redis or RabbitMQ imposed — we stay at zero infra as long as the load allows, and we switch transports without touching business code when we need to.

### AI assistance

The `.mcp.json` file ships three MCP servers ready for Claude Code:

- `symfony-ai-mate` — access to the Symfony profiler, Monolog logs, and container services.
- `playwright` — browser automation for debugging and E2E scenarios.
- `chrome-devtools` — interaction with Chrome via the DevTools Protocol.

In practice: an AI assistant plugged into this template understands what's happening in the application without you hand-feeding context at every question.

## Opinionated choices

### SQLite over Postgres by default

Most projects that are starting out don't need Postgres in their first few weeks. SQLite lets you clone, `composer install`, migrate, and code, without booting a container or opening a port. The day a feature needs JSONB, FTS, or Postgres extensions, you migrate — Doctrine abstracts enough that the pain is minimal.

### Tailwind without an external bundler

Vite, Webpack Encore, esbuild: three ways to answer the same question. Symfony UX + Tailwind 4 gives you an integrated solution that plays nicely with the Symfony CLI. Fewer moving parts, fewer decisions to make about something that's never the core of the product.

### PHPStan level 9 from day 1

Starting low and planning to raise it later never happens. Starting at 9 forces correct typing from the start, and the marginal cost is zero when the code is fresh. On an existing project, type debt is one of the worst clean-ups to catch up on.

### Playwright over Panther

Panther was stuck on ChromeDriver and showed its limits as soon as you touched JavaScript-heavy code. Playwright covers more browsers, ships better debug tooling (trace viewer, codegen), and the community is incomparably more active.

## What's deliberately left out

- **No preconfigured Redis, RabbitMQ, or ElasticSearch**. Most projects don't need them for months, and it's better to add them when the constraint appears than to carry them from day one.
- **No GitHub Actions CI shipped**. It's too context-dependent (who gets notified, which branches are protected, which deployments) for a template to impose a generic version that will be thrown away.
- **No design system**. Tailwind is wired, the rest is intentionally empty — a poorly chosen visual template is more expensive to remove than to add.
- **No API Platform**. Too structuring to be a default. It takes five minutes to add when the project is actually an API.

## How to use it

```bash
# 1. Create a new repo from the template ("Use this template" button on GitHub)
# 2. Clone, install
symfony composer install
npm install

# 3. Configure the environment
cp .env .env.local  # adjust variables

# 4. Prepare the database
symfony console doctrine:migrations:migrate -n
symfony console doctrine:fixtures:load -n

# 5. Start
symfony serve
```

Five commands, ten minutes, and you're writing business code.

## Roadmap

This template is versioned (v1.0.0 at this stage) and evolves alongside my own Symfony projects. Likely additions in upcoming versions:

- A minimalist feature-flag system (Doctrine-backed, no external dependency).
- A non-trivial Live Component example, beyond the hello-world.
- An optional GitHub Actions template, disabled by default, for those who want a starter CI.
- Documentation for common extension points: OAuth, finer-grained roles, audit log.

The goal isn't to add everything that might be useful, but only what I end up rebuilding by hand in my real projects. The rest stays outside the template — out of respect for whoever clones it and won't want to spend two hours uninstalling things they don't use.
