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
