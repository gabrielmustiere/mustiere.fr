import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/config';
import {
  isPublished,
  getDraftPreviewEntries,
  getDraftSlugParam,
  publicSlug,
} from './content';
import { buildSeriesIndex, type SeriesContext } from './series';

// Helpers `getStaticPaths` partagés entre les pendants FR/EN de
// `pages/blog/[...slug].astro` et `pages/projets|projects/[...slug].astro`.
// Avant extraction, chaque paire dupliquait ~50 lignes identiques au seul
// argument `lang` près (cf. audit codebase 2026-05).

type BlogRoute = {
  params: { slug: string };
  props: {
    post: CollectionEntry<'blog'>;
    nextPosts: CollectionEntry<'blog'>[];
    seriesContext: SeriesContext | null;
    isDraftPreview: boolean;
  };
};

export async function buildBlogStaticPaths(lang: Lang): Promise<BlogRoute[]> {
  const all = await getCollection('blog');
  const allSeries = await getCollection('series');
  const seriesIndex = buildSeriesIndex(all, allSeries, {
    isVisible: (a) => isPublished(a as CollectionEntry<'blog'>, lang),
  });

  const published = all.filter((entry) => isPublished(entry, lang));
  const sorted = [...published].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  const publishedRoutes: BlogRoute[] = published.map((post) => {
    const idx = sorted.findIndex((p) => p.id === post.id);
    const nextPosts = [sorted[idx + 1], sorted[idx - 1]].filter(
      (p): p is CollectionEntry<'blog'> => Boolean(p)
    );
    const seriesContext = seriesIndex.get(post.id);
    return {
      params: { slug: publicSlug(post) },
      props: { post, nextPosts, seriesContext, isDraftPreview: false },
    };
  });

  const draftRoutes = getDraftPreviewEntries(all, lang)
    .map((post): BlogRoute | null => {
      const slug = getDraftSlugParam(publicSlug(post));
      if (!slug) return null;
      const seriesContext = seriesIndex.get(post.id);
      return {
        params: { slug },
        props: { post, nextPosts: [], seriesContext, isDraftPreview: true },
      };
    })
    .filter((r): r is BlogRoute => r !== null);

  return [...publishedRoutes, ...draftRoutes];
}

type ProjectRoute = {
  params: { slug: string };
  props: {
    project: CollectionEntry<'projects'>;
    others: CollectionEntry<'projects'>[];
    isDraftPreview: boolean;
  };
};

export async function buildProjectsStaticPaths(
  lang: Lang
): Promise<ProjectRoute[]> {
  const all = await getCollection('projects');
  const published = all.filter((entry) => isPublished(entry, lang));
  const sorted = [...published].sort((a, b) => a.data.order - b.data.order);

  const publishedRoutes: ProjectRoute[] = published.map((project) => {
    const others = sorted.filter(
      (p): p is CollectionEntry<'projects'> => p.id !== project.id
    );
    return {
      params: { slug: publicSlug(project) },
      props: { project, others, isDraftPreview: false },
    };
  });

  const draftRoutes = getDraftPreviewEntries(all, lang)
    .map((project): ProjectRoute | null => {
      const slug = getDraftSlugParam(publicSlug(project));
      if (!slug) return null;
      return {
        params: { slug },
        props: { project, others: [], isDraftPreview: true },
      };
    })
    .filter((r): r is ProjectRoute => r !== null);

  return [...publishedRoutes, ...draftRoutes];
}
