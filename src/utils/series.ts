import type { Lang } from '@/i18n/config';

// Helpers et validation pour la feature 009-f-blog-series.
//
// Le module est volontairement indépendant d'`astro:content` pour rester
// testable depuis un test Node natif (cf. tests/series.test.mjs). L'appelant
// Astro charge les collections via `getCollection` puis passe les entrées en
// argument. Les types ci-dessous sont structurels (duck-typing) et compatibles
// avec `CollectionEntry<'blog'>` / `CollectionEntry<'series'>`.

export type BlogEntryLike = {
  id: string;
  data: {
    title: string;
    publishedAt: Date;
    draft?: boolean;
    lang?: Lang;
    series?: string;
    seriesOrder?: number;
  };
};

export type SeriesEntryLike = {
  id: string;
  data: {
    title: string;
    description: string;
    lang?: Lang;
    translationOf?: string;
  };
};

export type SeriesContext = {
  series: SeriesEntryLike;
  // Tous les épisodes visibles (publiés ou drafts visibles selon le mode),
  // triés par `seriesOrder` croissant.
  episodes: BlogEntryLike[];
  // Position de l'article courant (1-based) parmi les épisodes visibles.
  position: number;
  // Total d'épisodes visibles (= episodes.length). Le compteur affiché "N/M"
  // s'appuie sur les seuls épisodes visibles, jamais sur le total déclaré
  // (cf. spec : un draft réserve sa place côté contenu, pas côté rendu).
  total: number;
  // Premier épisode visible de la série (= episodes[0]).
  firstEpisode: BlogEntryLike;
  // L'article courant est-il le premier épisode visible ?
  isFirst: boolean;
  // Voisins immédiats parmi les épisodes visibles (drafts sautés).
  prev: BlogEntryLike | null;
  next: BlogEntryLike | null;
};

export type SeriesIndex = {
  get(articleId: string): SeriesContext | null;
};

type IndexOptions = { isVisible?: (entry: BlogEntryLike) => boolean };

function entrySlug(entry: { id: string }): string {
  const parts = entry.id.split('/');
  return parts[parts.length - 1];
}

function entryLang(entry: { data: { lang?: Lang } }): Lang {
  return entry.data.lang ?? 'fr';
}

// Filtre par défaut : un article est "visible côté public" s'il n'est pas
// draft. Les appelants Astro doivent passer `isPublished` (qui prend en compte
// `import.meta.env.DEV` et `SHOW_DRAFTS=1`) pour que dev et build prod soient
// alignés. Ce défaut sert surtout aux tests Node natifs.
function defaultIsVisible(entry: BlogEntryLike): boolean {
  return !entry.data.draft;
}

// Vérifie la cohérence cross-collection des séries au build :
//   - Tout article référençant une `series` doit pointer vers une entrée
//     existante dans la collection `series` de la même langue.
//   - Au sein d'une même série (lang + slug), les `seriesOrder` doivent être
//     uniques parmi les articles publiés (drafts ignorés — un draft "réserve"
//     sa position côté contenu mais ne rend rien côté public).
//
// La cohérence du couple `series`/`seriesOrder` (présents ensemble ou absents
// ensemble) est déjà couverte par le superRefine Zod du schema `blog`.
//
// Lance une Error explicite, pointant l'`id` fautif, dès qu'un invariant est
// rompu. Appelée en interne par `buildSeriesIndex` — le build casse si la
// spec se rompt.
export function validateSeriesGraph(
  articles: ReadonlyArray<BlogEntryLike>,
  seriesEntries: ReadonlyArray<SeriesEntryLike>
): void {
  const seriesIndex = new Map<string, SeriesEntryLike>();
  for (const s of seriesEntries) {
    const key = `${entryLang(s)}/${entrySlug(s)}`;
    seriesIndex.set(key, s);
  }

  for (const article of articles) {
    const seriesSlug = article.data.series;
    if (!seriesSlug) continue;
    const lang = entryLang(article);
    const key = `${lang}/${seriesSlug}`;
    if (!seriesIndex.has(key)) {
      throw new Error(
        `[series] article "${article.id}" référence la série "${seriesSlug}" ` +
          `qui n'existe pas dans la langue "${lang}". ` +
          `Crée src/content/series/${lang}/${seriesSlug}.md ou corrige le frontmatter.`
      );
    }
  }

  // Unicité de `seriesOrder` parmi les articles publiés d'une même série/lang.
  const ordersBySeries = new Map<string, Map<number, string>>();
  for (const article of articles) {
    const seriesSlug = article.data.series;
    const order = article.data.seriesOrder;
    if (!seriesSlug || order === undefined) continue;
    if (article.data.draft) continue;
    const lang = entryLang(article);
    const key = `${lang}/${seriesSlug}`;
    let bucket = ordersBySeries.get(key);
    if (!bucket) {
      bucket = new Map<number, string>();
      ordersBySeries.set(key, bucket);
    }
    const existing = bucket.get(order);
    if (existing !== undefined) {
      throw new Error(
        `[series] seriesOrder=${order} dupliqué dans la série "${seriesSlug}" (${lang}) : ` +
          `articles "${existing}" et "${article.id}". ` +
          `Chaque épisode publié doit avoir un rang unique.`
      );
    }
    bucket.set(order, article.id);
  }
}

// Cœur de calcul partagé entre `buildSeriesIndex` (validation incluse, usage
// Astro) et `getSeriesContext` (sans validation, usage tests Node). Renvoie
// une Map articleId → SeriesContext pour tous les articles ayant une série
// référencée et résolvable. Articles sans série, ou avec série introuvable,
// ne figurent pas dans la map.
function buildContextMap(
  articles: ReadonlyArray<BlogEntryLike>,
  seriesEntries: ReadonlyArray<SeriesEntryLike>,
  options: IndexOptions
): Map<string, SeriesContext> {
  const isVisible = options.isVisible ?? defaultIsVisible;

  const seriesByKey = new Map<string, SeriesEntryLike>();
  for (const s of seriesEntries) {
    seriesByKey.set(`${entryLang(s)}/${entrySlug(s)}`, s);
  }

  // Groupe les épisodes visibles par clé `${lang}/${seriesSlug}` puis trie
  // chaque groupe par `seriesOrder`. Une seule passe O(N + Σ K log K).
  const visibleByKey = new Map<string, BlogEntryLike[]>();
  for (const article of articles) {
    if (!article.data.series || article.data.seriesOrder === undefined)
      continue;
    if (!isVisible(article)) continue;
    const key = `${entryLang(article)}/${article.data.series}`;
    let list = visibleByKey.get(key);
    if (!list) {
      list = [];
      visibleByKey.set(key, list);
    }
    list.push(article);
  }
  for (const list of visibleByKey.values()) {
    list.sort(
      (a, b) => (a.data.seriesOrder as number) - (b.data.seriesOrder as number)
    );
  }

  const contextById = new Map<string, SeriesContext>();
  for (const article of articles) {
    const seriesSlug = article.data.series;
    if (!seriesSlug || article.data.seriesOrder === undefined) continue;
    const lang = entryLang(article);
    const key = `${lang}/${seriesSlug}`;
    const seriesEntry = seriesByKey.get(key);
    if (!seriesEntry) continue;

    let episodes = visibleByKey.get(key) ?? [];
    // Cas spécial : la page d'un article invisible (draft preview) doit
    // afficher son propre épisode dans le bandeau / la nav. On l'insère à sa
    // position théorique sans toucher à la liste partagée par les autres
    // articles. Cf. test "la page d'un draft inclut le draft courant".
    if (!isVisible(article)) {
      const order = article.data.seriesOrder;
      let insertAt = episodes.findIndex(
        (e) => (e.data.seriesOrder as number) >= order
      );
      if (insertAt === -1) insertAt = episodes.length;
      episodes = [
        ...episodes.slice(0, insertAt),
        article,
        ...episodes.slice(insertAt),
      ];
    }
    if (episodes.length === 0) continue;

    const idx = episodes.findIndex((a) => a.id === article.id);
    if (idx === -1) continue;

    contextById.set(article.id, {
      series: seriesEntry,
      episodes,
      position: idx + 1,
      total: episodes.length,
      firstEpisode: episodes[0],
      isFirst: idx === 0,
      prev: idx > 0 ? episodes[idx - 1] : null,
      next: idx < episodes.length - 1 ? episodes[idx + 1] : null,
    });
  }

  return contextById;
}

// API bulk pour les pages Astro : valide la cohérence cross-collection puis
// pré-calcule un index articleId → SeriesContext en une seule passe. Chaque
// page (`[...slug]`, `BlogArchive`, `llms.txt`) construit l'index une fois et
// fait des lookups O(1) par article. L'appelant doit fournir `isVisible` —
// typiquement `(a) => isPublished(a, lang)` — pour aligner la visibilité avec
// le reste du site (drafts en dev, `SHOW_DRAFTS=1`).
export function buildSeriesIndex(
  articles: ReadonlyArray<BlogEntryLike>,
  seriesEntries: ReadonlyArray<SeriesEntryLike>,
  options: IndexOptions = {}
): SeriesIndex {
  validateSeriesGraph(articles, seriesEntries);
  const contextById = buildContextMap(articles, seriesEntries, options);
  return {
    get: (id) => contextById.get(id) ?? null,
  };
}

// API per-article, conservée pour les tests Node natifs et les cas où un seul
// contexte est attendu hors page Astro. Ne valide pas le graphe (certains
// tests passent volontairement des entrées partiellement invalides pour
// vérifier les fallback null). Les appelants Astro doivent préférer
// `buildSeriesIndex` qui valide en plus de calculer.
export function getSeriesContext(
  article: BlogEntryLike,
  articles: ReadonlyArray<BlogEntryLike>,
  seriesEntries: ReadonlyArray<SeriesEntryLike>,
  options: IndexOptions = {}
): SeriesContext | null {
  const map = buildContextMap(articles, seriesEntries, options);
  return map.get(article.id) ?? null;
}

// Tri des listings (archive blog, RSS, llms.txt) avec regroupement de séries.
//
// Règles, dans l'ordre :
//   1. `bucketDate` DESC — pour un article de série, c'est `max(publishedAt)`
//      de tous les épisodes visibles de la série ; pour un orphelin, c'est
//      son propre `publishedAt`. Effet : toute la série partage la même clé
//      primaire et reste contiguë, même si un orphelin a une date qui
//      tomberait au milieu.
//   2. `seriesOrder` DESC dans une série — le dernier épisode publié est
//      en tête du bloc (cf. choix produit : "dernier en haut").
//   3. `publishedAt` DESC en tie-break — départage deux orphelins à la même
//      date, ou deux épisodes sans `seriesOrder` (cas improbable filtré
//      avant, mais le comparateur reste total).
//
// L'`seriesIndex` doit avoir été construit avec le même `isVisible` que le
// filtre amont des `articles`, sinon `bucketDate` peut inclure des épisodes
// non rendus et casser le regroupement visuel.
export function sortArchive<T extends BlogEntryLike>(
  articles: ReadonlyArray<T>,
  seriesIndex: SeriesIndex
): T[] {
  const bucketDateCache = new Map<string, number>();
  const bucketDate = (a: T): number => {
    const ctx = seriesIndex.get(a.id);
    if (!ctx) return a.data.publishedAt.getTime();
    const key = `${entryLang(a)}/${a.data.series}`;
    const cached = bucketDateCache.get(key);
    if (cached !== undefined) return cached;
    let max = 0;
    for (const ep of ctx.episodes) {
      const t = ep.data.publishedAt.getTime();
      if (t > max) max = t;
    }
    bucketDateCache.set(key, max);
    return max;
  };

  return [...articles].sort((a, b) => {
    const db = bucketDate(b) - bucketDate(a);
    if (db !== 0) return db;
    const oa = a.data.seriesOrder;
    const ob = b.data.seriesOrder;
    if (oa !== undefined && ob !== undefined) {
      const ds = ob - oa;
      if (ds !== 0) return ds;
    }
    return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
  });
}
