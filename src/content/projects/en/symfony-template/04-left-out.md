## What's deliberately left out

- **No preconfigured Redis, RabbitMQ, or ElasticSearch**. Most projects don't need them for months, and it's better to add them when the constraint appears than
  to carry them from day one.
- **No GitHub Actions CI shipped**. It's too context-dependent (who gets notified, which branches are protected, which deployments) for a template to impose a
  generic version that will be thrown away.
- **No design system**. Tailwind is wired, the rest is intentionally empty — a poorly chosen visual template is more expensive to remove than to add.
- **No API Platform**. Too structuring to be a default. It takes five minutes to add when the project is actually an API.
