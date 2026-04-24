import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { toISODate } from '../utils/format-date';

// Racine `llms.txt` — contenu FR (langue par défaut du site), avec un pointeur
// explicite vers la variante localisée anglaise. Servi en text/plain pour que
// les crawlers LLM (Anthropic, OpenAI, Perplexity, Google…) obtiennent le
// contenu attendu sans meta-refresh intermédiaire.
export const GET: APIRoute = async () => {
  const posts = (
    await getCollection(
      'blog',
      ({ data }) => !data.draft && (data.lang ?? 'fr') === 'fr'
    )
  ).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const projects = (
    await getCollection('projects', ({ data }) => (data.lang ?? 'fr') === 'fr')
  ).sort((a, b) => a.data.order - b.data.order);

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(
    `> CTO freelance basé à Nantes. 14 ans dans la tech, CTO depuis 2017. Architecture, leadership technique, SaaS & e-commerce.`
  );
  lines.push('');

  lines.push('## Languages');
  lines.push('');
  lines.push(
    `- Français (default): [${SITE.url}/fr/llms.txt](${SITE.url}/fr/llms.txt)`
  );
  lines.push(`- English: [${SITE.url}/en/llms.txt](${SITE.url}/en/llms.txt)`);
  lines.push('');

  lines.push('## Identité');
  lines.push('');
  lines.push(`- Nom : ${SITE.author.name}`);
  lines.push(`- Rôle : CTO freelance`);
  lines.push(`- Localisation : ${SITE.author.city}, ${SITE.author.country}`);
  lines.push(`- Contact : ${SITE.author.email}`);
  lines.push(`- GitHub : ${SITE.author.github}`);
  lines.push(`- LinkedIn : ${SITE.author.linkedin}`);
  lines.push(`- Site : ${SITE.url}`);
  lines.push('');

  lines.push('## Pages principales');
  lines.push('');
  lines.push(
    `- [Accueil](${SITE.url}/fr/) : présentation, parcours, domaines d'expertise (IA, architecture, leadership).`
  );
  lines.push(
    `- [Blog](${SITE.url}/fr/blog/) : notes et essais d'un CTO freelance sur la tech, l'IA, le leadership et le business.`
  );
  lines.push(
    `- [CV PDF](${SITE.url}/cv.pdf) : CV détaillé, dernière mise à jour avril 2026.`
  );
  lines.push(`- [Flux RSS](${SITE.url}/fr/rss.xml) : mises à jour du blog.`);
  lines.push(`- [English version](${SITE.url}/en/) : same content in English.`);
  lines.push('');

  lines.push('## Articles');
  lines.push('');
  for (const post of posts) {
    const date = toISODate(post.data.publishedAt);
    lines.push(
      `- [${post.data.title}](${SITE.url}/fr/blog/${post.id}/) (${date}, ${post.data.category}) : ${post.data.excerpt}`
    );
  }
  lines.push('');

  if (projects.length) {
    lines.push('## Side projects');
    lines.push('');
    for (const project of projects) {
      lines.push(
        `- [${project.data.title}](${SITE.url}/fr/projects/${project.id}/) (${project.data.kind} · ${project.data.year} · ${project.data.status}) : ${project.data.excerpt}`
      );
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(
    `- [llms-full.txt](${SITE.url}/llms-full.txt) : contenu intégral du site en markdown pour les LLMs.`
  );
  lines.push(`- [Sitemap](${SITE.url}/sitemap-index.xml)`);
  lines.push(
    `- [robots.txt](${SITE.url}/robots.txt) : politique d'accès des crawlers (IA inclus).`
  );
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
