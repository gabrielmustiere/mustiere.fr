## Opinionated choices

### SQLite over Postgres by default

Most projects that are starting out don't need Postgres in their first few weeks. SQLite lets you clone, `composer install`, migrate, and code, without booting
a container or opening a port. The day a feature needs JSONB, FTS, or Postgres extensions, you migrate — Doctrine abstracts enough that the pain is minimal.

### Tailwind without an external bundler

Vite, Webpack Encore, esbuild: three ways to answer the same question. Symfony UX + Tailwind 4 gives you an integrated solution that plays nicely with the
Symfony CLI. Fewer moving parts, fewer decisions to make about something that's never the core of the product.

### PHPStan level 9 from day 1

Starting low and planning to raise it later never happens. Starting at 9 forces correct typing from the start, and the marginal cost is zero when the code is
fresh. On an existing project, type debt is one of the worst clean-ups to catch up on.

### Playwright over Panther

Panther was stuck on ChromeDriver and showed its limits as soon as you touched JavaScript-heavy code. Playwright covers more browsers, ships better debug
tooling (trace viewer, codegen), and the community is incomparably more active.
