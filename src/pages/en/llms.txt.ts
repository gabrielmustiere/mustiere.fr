import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';
import { blogPath, isPublished, projectPath } from '@/utils/content';
import { buildSeriesIndex } from '@/utils/series';

export const GET: APIRoute = async () => {
  const allBlog = await getCollection('blog');
  const allSeries = await getCollection('series');
  const seriesIndex = buildSeriesIndex(allBlog, allSeries, {
    isVisible: (a) => isPublished(a as CollectionEntry<'blog'>, 'en'),
  });
  const posts = allBlog
    .filter((entry) => isPublished(entry, 'en'))
    .sort(
      (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
    );

  const projects = (
    await getCollection('projects', (entry) => isPublished(entry, 'en'))
  ).sort((a, b) => a.data.order - b.data.order);

  const seriesGroups: Array<{
    title: string;
    description: string;
    episodes: CollectionEntry<'blog'>[];
  }> = [];
  const seenSeries = new Set<string>();
  const orphans: CollectionEntry<'blog'>[] = [];
  for (const post of posts) {
    if (!post.data.series) {
      orphans.push(post);
      continue;
    }
    const ctx = seriesIndex.get(post.id);
    if (!ctx) {
      orphans.push(post);
      continue;
    }
    const key = `en/${post.data.series}`;
    if (seenSeries.has(key)) continue;
    seenSeries.add(key);
    seriesGroups.push({
      title: ctx.series.data.title,
      description: ctx.series.data.description,
      episodes: ctx.episodes as CollectionEntry<'blog'>[],
    });
  }

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(
    `> Freelance CTO based in Nantes. 14 years in tech, CTO since 2017. Architecture, technical leadership, SaaS & e-commerce.`
  );
  lines.push('');

  lines.push('## Identity');
  lines.push('');
  lines.push(`- Name: ${SITE.author.name}`);
  lines.push(`- Role: Freelance CTO`);
  lines.push(`- Location: ${SITE.author.city}, ${SITE.author.country}`);
  lines.push(`- Contact: ${SITE.author.email}`);
  lines.push(`- GitHub: ${SITE.author.github}`);
  lines.push(`- LinkedIn: ${SITE.author.linkedin}`);
  lines.push(`- Site: ${SITE.url}`);
  lines.push('');

  lines.push('## Main pages');
  lines.push('');
  lines.push(
    `- [Home](${SITE.url}/en/): introduction, background, areas of expertise (AI, architecture, leadership).`
  );
  lines.push(
    `- [Background](${SITE.url}/en/background/): detailed background, experience (Anytime, Passion Barbecue, Progicar), expertise (Symfony, Sylius, product builder), engagement modes, FAQ.`
  );
  lines.push(
    `- [Blog posts](${SITE.url}/en/blog/): notes and essays from a freelance CTO on tech, AI, leadership and business.`
  );
  lines.push(
    `- [Resume PDF](${SITE.url}/cv.pdf): detailed résumé, last updated April 2026.`
  );
  lines.push(`- [RSS feed](${SITE.url}/en/rss.xml): blog updates.`);
  lines.push(`- [French version](${SITE.url}/): same content in French.`);
  lines.push('');

  lines.push('## Posts');
  lines.push('');
  for (const group of seriesGroups) {
    lines.push(`### ${group.title}`);
    lines.push('');
    lines.push(`*${group.description}*`);
    lines.push('');
    for (const post of group.episodes) {
      const date = toISODate(post.data.publishedAt);
      lines.push(
        `- [${post.data.title}](${SITE.url}${blogPath(post, 'en')}) (${date}, ${post.data.category}): ${post.data.excerpt}`
      );
    }
    lines.push('');
  }
  for (const post of orphans) {
    const date = toISODate(post.data.publishedAt);
    lines.push(
      `- [${post.data.title}](${SITE.url}${blogPath(post, 'en')}) (${date}, ${post.data.category}): ${post.data.excerpt}`
    );
  }
  lines.push('');

  if (projects.length) {
    lines.push('## Side projects');
    lines.push('');
    for (const project of projects) {
      lines.push(
        `- [${project.data.title}](${SITE.url}${projectPath(project, 'en')}) (${project.data.kind} · ${project.data.year} · ${project.data.status}): ${project.data.excerpt}`
      );
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(
    `- [llms-full.txt](${SITE.url}/en/llms-full.txt): full site content in markdown for LLMs.`
  );
  lines.push(`- [Sitemap](${SITE.url}/sitemap-index.xml)`);
  lines.push(
    `- [robots.txt](${SITE.url}/robots.txt): crawler access policy (AI included).`
  );
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
