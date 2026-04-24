import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../../consts';
import { toISODate } from '../../utils/format-date';

export const GET: APIRoute = async () => {
  const posts = (
    await getCollection('blog', ({ data }) => !data.draft && data.lang === 'en')
  ).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const projects = (
    await getCollection('projects', ({ data }) => data.lang === 'en')
  ).sort((a, b) => a.data.order - b.data.order);

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
    `- [Writing](${SITE.url}/en/blog/): notes and essays from a freelance CTO on tech, AI, leadership and business.`
  );
  lines.push(
    `- [Résumé PDF](${SITE.url}/cv.pdf): detailed résumé, last updated April 2026.`
  );
  lines.push(`- [RSS feed](${SITE.url}/en/rss.xml): blog updates.`);
  lines.push(`- [French version](${SITE.url}/fr/): same content in French.`);
  lines.push('');

  lines.push('## Posts');
  lines.push('');
  for (const post of posts) {
    const date = toISODate(post.data.publishedAt);
    lines.push(
      `- [${post.data.title}](${SITE.url}/en/blog/${post.id}/) (${date}, ${post.data.category}): ${post.data.excerpt}`
    );
  }
  lines.push('');

  if (projects.length) {
    lines.push('## Side projects');
    lines.push('');
    for (const project of projects) {
      lines.push(
        `- [${project.data.title}](${SITE.url}/en/projects/${project.id}/) (${project.data.kind} · ${project.data.year} · ${project.data.status}): ${project.data.excerpt}`
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
