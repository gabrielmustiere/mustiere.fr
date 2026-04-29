# Blog — roadmap éditoriale

> Document interne. Non publié sur mustiere.fr (le dossier `docs/` n'est pas exposé par Astro). Source de référence pour piloter les sujets, le positionnement
> et l'angle éditorial du blog.

## Contexte

CTO, 14 ans d'expérience, spécialisé Symfony / SaaS / e-commerce & retail. Lancement du blog : combiner **vision stratégique (CTO hands-off)** et **expertise
terrain (hands-on)**, avec un fil rouge sur l'impact de l'IA sur le développement logiciel, les organisations tech et les modèles business.

Cible : dev seniors, lead, CTO, product.

---

## Positionnement

**Promesse éditoriale (de travail) :**

> CTO pragmatique à l'ère de l'IA — entre hype et réalité terrain.

Variante plus offensive :

> Ce que les CTO doivent vraiment comprendre de l'IA (et que personne n'explique).

Intersection à occuper : **tech × business × org × IA**.

### Mix recommandé

| Bloc                         | Part visée |
| ---------------------------- | ---------- |
| Vision / opinion CTO         | 40 %       |
| Hands-on technique           | 40 %       |
| Business / e-commerce / SaaS | 20 %       |

---

## Meta-thèmes structurants 2026

Forces de fond à exploiter pour donner de la cohérence au territoire :

- **AI-native engineering** — le dev devient orchestrateur d'agents.
- **Explosion des agents IA** dans les apps SaaS.
- **Jusqu'à 75 % du code généré par IA** dans certaines organisations (cf. Google, Amazon).
- **Agentic commerce** — l'IA achète à la place de l'utilisateur.
- **GEO (Generative Engine Optimization)** — le SEO classique mute sous la pression des moteurs de réponse.
- **Gouvernance + ROI obligatoires** — sortie de la phase de hype, retour sur la valeur mesurable.
- **Transformation du rôle CTO** — architecte + product + org, plus que builder.

---

## Bloc 1 — CTO vision (hands-off)

### Transformation du rôle CTO

- Pourquoi le CTO devient un orchestrateur d'agents IA (et plus un builder).
- Le mythe du CTO technique en 2026 : ce qui compte vraiment.
- AI-native company : comment transformer une org sans tout casser.
- Pourquoi 80 % des équipes vont intégrer l'IA… et échouer.

### Organisation & delivery

- Pourquoi l'IA accélère le code mais ralentit la delivery.
- Comment repenser le delivery avec des agents IA.
- Le vrai bottleneck en 2026 : plus le code, mais la validation.
- AI sprawl : le nouveau chaos des équipes tech.

---

## Bloc 2 — CTO hands-on (tech concrète)

### Dev avec IA

- Comment structurer un projet Symfony AI-first.
- Prompt engineering pour développeur : les patterns qui marchent.
- Claude Code vs Copilot vs agents : retour terrain.
- Comment faire du refactoring avec l'IA sans casser ton code.

### Architecture

- Architecture SaaS à l'ère des agents IA.
- Multi-agent systems : comment les intégrer dans un produit.
- Pourquoi ton architecture actuelle ne survivra pas à l'IA.
- AI + event-driven architecture : le duo gagnant ?

### Sécurité & gouvernance

- Shadow AI : le nouveau shadow IT.
- Comment sécuriser une stack avec des agents IA.
- Audit et observabilité des systèmes IA.

---

## Bloc 3 — SaaS / E-commerce (différenciant)

### IA + business model

- Agentic commerce : quand ton client n'est plus humain.
- Comment l'IA va tuer les fiches produits.
- Pricing SaaS intelligent avec les LLM.
- Le futur du checkout : invisible.

### Growth & acquisition

- SEO est mort : bienvenue dans le GEO.
- Comment être visible dans ChatGPT et Google SGE.
- Le contenu généré par IA : opportunité ou dilution totale ?

### Produit

- Construire une feature AI qui apporte vraiment de la valeur.
- Pourquoi 90 % des features IA sont inutiles.
- Comment intégrer l'IA sans dégrader l'expérience utilisateur.

---

## Bloc 4 — Sujets différenciants (gold mine SEO/GEO)

### Contre-intuitifs

- Pourquoi il faut ralentir ton adoption de l'IA.
- L'illusion de productivité des développeurs avec l'IA.
- L'IA va créer plus de bugs qu'elle n'en corrige.
- Pourquoi les startups IA-first vont battre les scale-ups.

### Thought leadership

- Software 3.0 : écrire du code sans coder.
- Intent-driven development : le futur du dev.
- Le développeur en 2030 : toujours utile ?

---

## Notes de pilotage

- Caler chaque article sur la grille `category ∈ {IA, Tech, Lead, Business}` imposée par le schéma Zod de `src/content.config.ts`. Mapping indicatif :
  - Bloc 1 → `Lead`
  - Bloc 2 → `Tech` (parfois `IA` si l'angle est l'outillage IA lui-même)
  - Bloc 3 → `Business` (ou `IA` pour les sujets agentic / GEO)
  - Bloc 4 → `IA` ou `Lead` selon l'angle.
- Penser bilingue dès le brief : prévoir le pendant EN (`lang` + `translationOf`) pour les articles à fort potentiel SEO international (GEO, Software 3.0,
  agentic commerce).
- Respecter `tldr` 60–320 chars et `excerpt` 80–220 — c'est le `tldr` qui est lu par les LLM, donc rédigé pour être autoportant.

---

## Sources

- TechRadar — _Software 3.0 is speeding up coding — but delivery is a different story_.
- Elinext — _2026 AI Integration Trends: What Every CTO Needs to Know_.
- Business Insider — _Google says 75 % of the company's new code is AI-generated_.
- Business Insider — _Amazon pushes AI use and closely tracks adoption_.
- E-Commerce Nation — _Tendances e-commerce 2026 : IA, Transparence et Data_.
- Dn'D — _8 tendances E-Commerce & Digital de 2026_.
- Waydev — _2026 Tech Trends: A Guide For Engineering Leaders_.
- Tout pour la gestion — _Tendances E-commerce 2026_.

---

## Prochaines étapes possibles

- Prioriser 8–12 sujets pour un premier trimestre éditorial.
- Décliner en titres SEO/GEO + `tldr` calibrés.
- Identifier les 2–3 articles « pilier » (long form, fort maillage interne) vs. les articles d'opinion plus courts.
