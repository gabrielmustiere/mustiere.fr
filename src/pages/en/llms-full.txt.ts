import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';
import { blogPath, isPublished } from '@/utils/content';
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

  const parts: string[] = [];

  parts.push(`# ${SITE.name}`);
  parts.push('');
  parts.push(
    `> Freelance CTO based in Nantes. 14 years in tech, CTO since 2017. Architecture, technical leadership, SaaS & e-commerce.`
  );
  parts.push('');
  parts.push(
    `Site: ${SITE.url} · GitHub: ${SITE.author.github} · LinkedIn: ${SITE.author.linkedin} · Contact: ${SITE.author.email}`
  );
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## About');
  parts.push('');
  parts.push(
    `${SITE.author.name} is a freelance CTO based in ${SITE.author.city}. 14 years in tech, CTO since 2017. Symfony and Sylius expert, product builder for SaaS and e-commerce from scratch.`
  );
  parts.push('');
  parts.push(
    `He built the SaaS subsidiary Progicar (Groupe GEMY) from zero to more than 25 people in five years (founding CTO, 2017 → 2022), then co-founded Passion Barbecue where he drove the Sylius e-commerce platform end to end (2022 → 2025).`
  );
  parts.push('');
  parts.push(
    `Since September 2025, freelance. Current engagement: Anytime, PSD2/SCA compliance via WebAuthn (passkeys, biometrics, hardware security keys). Next availability: Q3 2026, for long engagements, fractional CTO seats for early-stage startups, audits or sparring.`
  );
  parts.push('');
  parts.push(`Detailed background: ${SITE.url}/en/background/`);
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## Posts');
  parts.push('');

  const renderPost = (post: CollectionEntry<'blog'>) => {
    const date = toISODate(post.data.publishedAt);
    parts.push(`### ${post.data.title}`);
    parts.push('');
    parts.push(
      `*Published on ${date} · Category: ${post.data.category} · URL: ${SITE.url}${blogPath(post, 'en')}*`
    );
    parts.push('');
    if (post.data.resume?.markdown) {
      parts.push(`**Summary.** ${post.data.resume.markdown}`);
      parts.push('');
    }
    if (post.body) {
      parts.push(post.body.trim());
    }
    parts.push('');
    parts.push('---');
    parts.push('');
  };

  for (const group of seriesGroups) {
    parts.push(`### Series — ${group.title}`);
    parts.push('');
    parts.push(`*${group.description}*`);
    parts.push('');
    for (const post of group.episodes) {
      renderPost(post);
    }
  }
  for (const post of orphans) {
    renderPost(post);
  }

  return new Response(parts.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
