import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';

export const GET: APIRoute = async () => {
  const posts = (
    await getCollection('blog', ({ data }) => !data.draft && data.lang === 'en')
  ).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

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
    `${SITE.author.name} is a freelance CTO based in ${SITE.author.city}. He has been writing code since 2009, leading engineering teams since 2014, and working independently since 2021 with scale-ups, studios and founders. His field: technical products where data, tempo and architectural clarity matter as much as the feature.`
  );
  parts.push('');
  parts.push(
    `He has been CTO in two startups (Series A and B), Lead Engineer in a media group, and still contributes regularly as an IC — TypeScript, Python, Go when needed, and PostgreSQL when possible.`
  );
  parts.push('');
  parts.push(
    `He is currently interested in tooling around LLMs: orchestration, evaluation, product integration.`
  );
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## Posts');
  parts.push('');

  for (const post of posts) {
    const date = toISODate(post.data.publishedAt);
    parts.push(`### ${post.data.title}`);
    parts.push('');
    parts.push(
      `*Published on ${date} · Category: ${post.data.category} · URL: ${SITE.url}/en/blog/${post.id}/*`
    );
    parts.push('');
    if (post.data.tldr) {
      parts.push(`**TL;DR.** ${post.data.tldr}`);
      parts.push('');
    }
    if (post.body) {
      parts.push(post.body.trim());
    }
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  return new Response(parts.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
