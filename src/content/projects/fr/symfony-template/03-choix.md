## Les choix assumés

### SQLite plutôt que Postgres par défaut

La plupart des projets qui démarrent n'ont pas besoin de Postgres pendant les premières semaines. SQLite permet de cloner, `composer install`, migrer et coder,
sans lancer un container ni ouvrir un port. Le jour où une feature exige JSONB, FTS ou les extensions Postgres, on migre — Doctrine abstrait suffisamment pour
que la douleur soit minime.

### Tailwind sans bundler externe

Vite, Webpack Encore, esbuild : trois façons de répondre à la même question. Symfony UX + Tailwind 4 donne une solution intégrée qui se comporte bien avec le
CLI Symfony. Moins de pièces mobiles, moins de décisions à prendre pour quelque chose qui n'est jamais le cœur du produit.

### PHPStan niveau 9 dès le jour 1

Commencer à un niveau bas et « on montera plus tard » ne se fait jamais. Démarrer à 9 oblige à typer correctement tout de suite, et le coût marginal est nul
quand le code est neuf. Sur un projet existant, la dette typage est un des pires chantiers à rattraper.

### Playwright plutôt que Panther

Panther restait bloqué sur ChromeDriver et montrait ses limites dès qu'on touchait à du JavaScript un peu dense. Playwright couvre plus de navigateurs, a de
meilleurs outils de debug (trace viewer, codegen), et la communauté est incomparablement plus active.
