# Sections SEO standardisées pour articles et side-projects

> Toute publication (blog ou projet) suit la même convention de fichiers MDX réservés (`resume.mdx` obligatoire, `faq.mdx` et
> `sources.mdx` optionnels) afin de garantir une structure SEO homogène : résumé, sommaire auto-généré, FAQ avec JSON-LD
> `FAQPage`, sources citées.

## Contexte

Le blog et les side-projects manquent aujourd'hui d'une structure standardisée côté SEO :

- Le `tldr` du frontmatter est lu par les LLMs (`llms.txt`) mais n'est pas rendu visuellement comme « résumé ».
- Aucune FAQ structurée n'est exposée — on perd les rich snippets `FAQPage` (gros levier SEO Google).
- Aucune section « Sources » — affaiblit l'E-E-A-T et la crédibilité éditoriale.
- Aucun sommaire (TOC) — `ReadingProgress` existe mais ne donne pas la vue d'ensemble.

L'absence de convention oblige à improviser article par article : certains ont une FAQ ad hoc, d'autres pas ; les sources sont parfois
en bas, parfois inline, parfois absentes. Cela limite à la fois la lisibilité humaine et l'indexation.

L'objectif est d'imposer une **convention de nommage MDX** unique pour tous les articles et tous les side-projects, exploitant le
loader `chaptered-glob` déjà en place (cf. `004-r-mdx-chapter-split`) et étendu pour reconnaître des **noms de fichiers réservés**.

## Utilisateurs concernés

- **Lecteur (visiteur)** : voit en haut de chaque article un résumé, un sommaire cliquable ; en bas, une FAQ et des sources quand
  pertinent. Bénéfice : navigation, scan rapide, fiabilité perçue.
- **Moteurs de recherche / LLMs** : reçoivent un `FAQPage` JSON-LD valide, des meta descriptions cohérentes, un `llms.txt` enrichi.
  Bénéfice SEO direct (rich snippets) et indirect (E-E-A-T).
- **Rédacteur (Gabriel)** : suit une convention unique pour tous les articles, sans réfléchir à la structure SEO à chaque fois.
  Le build refuse une publication non conforme — qualité garantie.

Pas de notion de rôle/permission (site statique mono-auteur).

## User Stories

- En tant que **lecteur**, je veux voir un résumé de l'article en haut de page afin de décider en 5 secondes si la lecture m'est
  utile.
- En tant que **lecteur**, je veux un sommaire cliquable afin de sauter directement à la section qui m'intéresse.
- En tant que **lecteur**, je veux une FAQ en bas d'article quand le sujet s'y prête afin de trouver rapidement la réponse à des
  questions fréquentes sans relire tout l'article.
- En tant que **lecteur**, je veux voir les sources citées par l'auteur afin d'évaluer la fiabilité du contenu et approfondir.
- En tant que **moteur de recherche**, je veux récupérer un `FAQPage` JSON-LD valide afin d'afficher des rich snippets dans les
  résultats Google.
- En tant que **rédacteur**, je veux que le build échoue si un article n'a pas de résumé afin d'éviter de publier du contenu
  incomplet par inadvertance.
- En tant que **rédacteur**, je veux pouvoir omettre `faq.mdx` et `sources.mdx` quand le sujet ne s'y prête pas afin de ne pas
  produire du contenu artificiel.

## Règles métier

### Convention de fichiers

- Tout article du blog et tout side-project doit être en **forme dossier** (cf. loader `chaptered-glob`) :
  `src/content/<collection>/<slug>/`.
- Trois noms de fichiers sont **réservés** dans ce dossier :
  - `resume.mdx` — **obligatoire**
  - `faq.mdx` — optionnel
  - `sources.mdx` — optionnel
- Le loader `chaptered-glob` est étendu pour reconnaître ces trois noms : ils sont **exposés en metadata** de l'entrée et **ne sont
  pas agrégés au `body`** principal de l'article.
- Les chapitres narratifs continuent de respecter la convention `NN-kebab.mdx` (préfixe à 2 chiffres requis) — inchangé.
- Aucun autre nom non conforme n'est toléré dans le dossier (le loader lève une erreur build).

### Résumé (`resume.mdx`)

- Obligatoire pour tout article et tout projet. Build fail sinon.
- Frontmatter optionnel ; contenu MDX libre, idéalement 80-300 mots.
- Remplace **partout** l'ancien champ `tldr` du frontmatter (qui est supprimé du schéma) :
  - rendu visible en haut de l'article comme première section « Résumé »,
  - utilisé tel quel dans `llms.txt` et `llms-full.txt`,
  - tronqué automatiquement à ~160 chars pour la `meta description` HTML.
- Le champ `excerpt` (80-220 chars) **reste** dans le frontmatter et continue d'alimenter les listings/cards blog (usage différent).

### FAQ (`faq.mdx`)

- Optionnel.
- Frontmatter Zod-validé :
  ```yaml
  questions:
    - q: Question concise
      r: |
        Réponse possiblement multi-paragraphes.
  ```
- Contraintes :
  - 1 à 10 questions, `q` ≤ 200 chars, `r` non vide.
  - Body MDX peut contenir une intro libre optionnelle (rendue avant la liste des Q/R).
- Génère automatiquement au build un JSON-LD `FAQPage` injecté dans la page de l'article (en plus du `BlogPosting` existant).

### Sources (`sources.mdx`)

- Optionnel.
- Frontmatter Zod-validé :
  ```yaml
  sources:
    - titre: Titre de la source
      url: https://...
      auteur: Optionnel
      date: Optionnel (YYYY-MM-DD)
  ```
- Rendu en bas d'article comme liste de liens. Format précis (icônes, JSON-LD `Citation` éventuel) à arbitrer en design.

### Sommaire

- Généré **automatiquement** au build par extraction des `<h2>` et `<h3>` du body principal de l'article (chapitres agrégés
  inclus).
- Rendu en haut de l'article (sous le résumé) ou en sidebar — placement à arbitrer en design en cohérence avec `ReadingProgress`.
- Aucune contrainte de rédaction côté auteur. Pas de frontmatter associé.

### i18n

- Si la version FR d'un article a un `faq.mdx`, sa version EN (liée par `translationOf`) **doit** aussi avoir son `faq.mdx`. Idem
  pour `sources.mdx`. Le build échoue sinon.
- `resume.mdx` étant obligatoire dans toutes les langues, la parité est garantie de fait.
- Aucun fallback automatique d'une langue vers l'autre — pas de contenu FR sur une page EN.

### Migration

- **Big bang** : tous les articles existants (blog FR + EN) et tous les projets sont migrés dans la même PR.
- Pour chaque article existant : convertir `tldr` en `resume.mdx` (ou rédiger un résumé long si `tldr` trop court), ajouter
  `faq.mdx` quand pertinent, ajouter `sources.mdx` quand des sources existent.
- Le merge est conditionné à un build vert : aucun article non conforme.

## Critères d'acceptation

- [ ] Le loader `chaptered-glob` reconnaît les noms réservés `resume.mdx`, `faq.mdx`, `sources.mdx` et les expose en metadata
      sans les agréger au body.
- [ ] Le build échoue avec un message clair si `resume.mdx` est absent dans un dossier d'article ou de projet.
- [ ] Le schéma blog ne contient plus le champ `tldr`. La validation des articles existants passe après migration.
- [ ] `llms.txt` et `llms-full.txt` exposent le contenu de `resume.mdx` à la place de l'ancien `tldr`.
- [ ] Les meta descriptions HTML sont alimentées par un extrait tronqué de `resume.mdx` (~160 chars).
- [ ] La section « Résumé » est visible en haut de chaque article (FR et EN).
- [ ] Le sommaire (TOC) est visible et cliquable, généré depuis les `<h2>`/`<h3>` du body.
- [ ] Si `faq.mdx` est présent : la FAQ est rendue en bas d'article et un JSON-LD `FAQPage` valide est injecté (testé via
      validateur Schema.org).
- [ ] Si `sources.mdx` est présent : les sources sont rendues en bas d'article avec liens cliquables.
- [ ] Le build échoue si un article FR avec `faq.mdx` n'a pas de `faq.mdx` côté EN (et inversement). Idem `sources.mdx`.
- [ ] Tous les articles et projets existants sont migrés au format dossier avec au moins `resume.mdx`.
- [ ] `astro check`, `npm run lint`, `npm run build` passent sans warning sur la PR finale.
- [ ] Les snapshots `scripts/snapshot-build.mjs` (avant/après) ne montrent que les diffs attendus liés à l'introduction des
      nouvelles sections.

## Hors scope

- **Multi-channel / multi-tenant** : non pertinent (site personnel mono-canal).
- **Multi-thème** : non pertinent (un seul thème).
- **API REST/GraphQL** : non pertinent (SSG pur).
- **Permissions / rôles** : non pertinent (site statique mono-auteur).
- **Emails / notifications** : aucun envoi déclenché par cette feature.
- **Refonte du composant `ReadingProgress`** : conservé tel quel ; le nouveau TOC vit à côté ou s'y intègre — décision de design.
- **JSON-LD `Citation` pour les sources** : pas garanti dans cette feature ; à confirmer en design selon coût/valeur.
- **Génération automatique de FAQ par IA** : non — la FAQ reste rédigée à la main pour conserver la valeur éditoriale.
- **Lien de partage / mode lecture** : hors sujet.

## Impacts transverses

- **i18n / traduction** : parité stricte FR ↔ EN sur `faq.mdx` et `sources.mdx`. Les libellés UI (« Résumé », « Sommaire »,
  « Questions fréquentes », « Sources ») doivent être ajoutés dans `src/i18n/ui.ts`.
- **Migration de données** : tous les articles et projets existants migrent en forme dossier avec au minimum `resume.mdx`.
  Suppression du champ `tldr` du schéma blog. `excerpt` conservé.
- **SEO** : ajout d'un nouveau type JSON-LD `FAQPage` pour les articles avec FAQ (en plus du `BlogPosting` existant). Meta
  descriptions désormais dérivées de `resume.mdx`.
- **`llms.txt` / `llms-full.txt`** : la source change (`tldr` → `resume.mdx`) ; les générateurs sous `src/pages/llms*.ts` doivent
  être adaptés.
- **Sitemap** : pas d'impact direct — les URLs publiques restent identiques (l'`id` de l'entrée = nom du dossier).
- **Snapshots de non-régression** : la diff attendue après migration est large (ajout de sections sur tous les articles), à
  documenter avant/après dans la PR.

## Notes pour le design technique

Pistes brutes pour `/feature-design` (ne pas concevoir ici, juste lister) :

- **Loader `chaptered-glob`** (`src/content-loaders/chaptered-glob.ts`) : étendre pour reconnaître les noms réservés et les
  exposer en metadata distincte (ex: `entry.data.resume`, `entry.data.faq`, `entry.data.sources`). Vérifier le contrat avec le
  schéma Zod (au niveau de la collection ou via une post-validation au loader).
- **Schéma blog & projects** (`src/content.config.ts`) : retirer `tldr`, ajouter optionnellement `resume`, `faq`, `sources` côté
  metadata dérivée du loader. Conserver `excerpt`.
- **Layout d'article** (`src/layouts/ArticleLayout.astro`) : insérer composant Résumé en tête, composant TOC, et en bas Faq + Sources
  conditionnels.
- **Composant TOC** : nouveau, qui parse les headings du HTML rendu (rehype plugin ou extraction côté Astro). Cohabitation avec
  `ReadingProgress`.
- **JSON-LD** (`src/utils/schema.ts` + `src/components/seo/StructuredData.astro`) : ajouter le générateur `FAQPage` ;
  l'injecter conditionnellement.
- **Layout projet** (`src/layouts/ProjectLayout.astro`) : même traitement que `ArticleLayout`.
- **`llms.txt` / `llms-full.txt`** (`src/pages/llms.txt.ts` et `llms-full.txt.ts`) : adapter pour lire `resume` au lieu de `tldr`.
- **i18n UI** (`src/i18n/ui.ts`) : ajouter clés `summary`, `toc`, `faq`, `sources` (FR + EN).
- **Migration** : script ponctuel ou opération manuelle ? Vu le volume actuel (~10-15 articles), à arbitrer.
- **Validation parité i18n** : où l'effectuer (dans le loader, dans un check post-build, dans `astro.config.mjs` `buildTranslationIndex`) ?

## Questions ouvertes

- **Placement du sommaire** : en tête d'article (sous le résumé) ou en sidebar fixe ? Dépend de la densité visuelle souhaitée et
  de la cohabitation avec `ReadingProgress`.
- **JSON-LD `Citation` pour `sources.mdx`** : valeur SEO réelle vs complexité ? À benchmarker en design.
- **`resume.mdx` peut-il contenir du MDX riche (composants, images)** ou est-il limité à du markdown simple pour faciliter
  l'extraction meta description / llms.txt ?
- **Articles existants avec `tldr` court** (~60 chars) : on les enrichit à la main pour atteindre 80-300 mots de résumé, ou on
  accepte un résumé minimaliste pour la migration initiale ?
- **Convention de troncature pour la meta description** : à 160 chars stricts ? Coupure mot par mot avec ellipse ?
- **Format précis de rendu des sources** : liste numérotée ? Cards ? Citations académiques ?
