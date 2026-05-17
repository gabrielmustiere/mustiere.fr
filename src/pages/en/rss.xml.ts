import rss from '@astrojs/rss';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '@/consts';
import { ui } from '@/i18n/ui';
import { blogPath, isPublished } from '@/utils/content';
import { buildSeriesIndex, sortArchive } from '@/utils/series';

export async function GET(context: APIContext) {
  const allBlog = await getCollection('blog');
  const allSeries = await getCollection('series');
  const seriesIndex = buildSeriesIndex(allBlog, allSeries, {
    isVisible: (a) => isPublished(a as CollectionEntry<'blog'>, 'en'),
  });
  const posts = sortArchive(
    allBlog.filter((entry) => isPublished(entry, 'en')),
    seriesIndex
  ).slice(0, 20);

  const tr = ui.en;

  return rss({
    title: tr.rss.title,
    description: tr.rss.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.excerpt,
      link: blogPath(post, 'en'),
      categories: [post.data.category, ...post.data.tags],
      author: `${SITE.author.email} (${SITE.author.name})`,
    })),
    customData: `<language>en-GB</language>\n<copyright>© ${new Date().getFullYear()} ${SITE.author.name}</copyright>`,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    stylesheet: false,
  });
}
