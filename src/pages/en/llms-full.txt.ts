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
  parts.push(
    `Detailed background: ${SITE.url}/en/background/`
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
