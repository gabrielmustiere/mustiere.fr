import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .slice(0, 20);

  return rss({
    title: `${SITE.name} — Écrits`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.excerpt,
      link: `/blog/${post.id}`,
      categories: [post.data.category, ...post.data.tags],
      author: `${SITE.author.email} (${SITE.author.name})`,
    })),
    customData: `<language>fr-FR</language>\n<copyright>© ${new Date().getFullYear()} ${SITE.author.name}</copyright>`,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    stylesheet: false,
  });
}
