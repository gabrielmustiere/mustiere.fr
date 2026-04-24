import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { toISODate } from '../utils/format-date';

// Racine `llms-full.txt` — contenu intégral (FR par défaut) destiné aux LLMs
// qui consomment les pages complètes pour l'entraînement / le RAG.
// Les versions localisées restent disponibles sur /fr/llms-full.txt et /en/llms-full.txt.
export const GET: APIRoute = async () => {
  const posts = (
    await getCollection(
      'blog',
      ({ data }) => !data.draft && (data.lang ?? 'fr') === 'fr'
    )
  ).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const parts: string[] = [];

  parts.push(`# ${SITE.name}`);
  parts.push('');
  parts.push(
    `> CTO freelance basé à Nantes. 14 ans dans la tech, CTO depuis 2017. Architecture, leadership technique, SaaS & e-commerce.`
  );
  parts.push('');
  parts.push(
    `Site : ${SITE.url} · GitHub : ${SITE.author.github} · LinkedIn : ${SITE.author.linkedin} · Contact : ${SITE.author.email}`
  );
  parts.push('');
  parts.push(
    `Localized variants: ${SITE.url}/fr/llms-full.txt (default) · ${SITE.url}/en/llms-full.txt`
  );
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## À propos');
  parts.push('');
  parts.push(
    `${SITE.author.name} est CTO freelance basé à ${SITE.author.city}. Il écrit du code depuis 2009, dirige des équipes depuis 2014, et travaille en indépendant depuis 2021 avec des scale-ups, studios et fondateurs. Son terrain : les produits techniques où la donnée, le tempo et la lisibilité de l'architecture comptent autant que la feature.`
  );
  parts.push('');
  parts.push(
    `Il a été CTO dans deux startups (séries A et B), Lead Engineer dans un groupe média, et contribue encore régulièrement en IC — TypeScript, Python, Go quand il faut, et PostgreSQL quand c'est possible.`
  );
  parts.push('');
  parts.push(
    `Il s'intéresse actuellement à l'outillage autour des LLMs : orchestration, évaluation, intégration produit.`
  );
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## Articles');
  parts.push('');

  for (const post of posts) {
    const date = toISODate(post.data.publishedAt);
    parts.push(`### ${post.data.title}`);
    parts.push('');
    parts.push(
      `*Publié le ${date} · Catégorie : ${post.data.category} · URL : ${SITE.url}/fr/blog/${post.id}/*`
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
