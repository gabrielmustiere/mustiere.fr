import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';
import { blogPath, isPublished, projectPath } from '@/utils/content';
import { buildSeriesIndex, sortArchive } from '@/utils/series';

// Racine `llms.txt` — contenu FR (langue par défaut du site), avec un pointeur
// explicite vers la variante localisée anglaise. Servi en text/plain pour que
// les crawlers LLM (Anthropic, OpenAI, Perplexity, Google…) obtiennent le
// contenu attendu sans meta-refresh intermédiaire.
export const GET: APIRoute = async () => {
  const allBlog = await getCollection('blog');
  const allSeries = await getCollection('series');
  const seriesIndex = buildSeriesIndex(allBlog, allSeries, {
    isVisible: (a) => isPublished(a as CollectionEntry<'blog'>, 'fr'),
  });
  const posts = sortArchive(
    allBlog.filter((entry) => isPublished(entry, 'fr')),
    seriesIndex
  );

  const projects = (
    await getCollection('projects', (entry) => isPublished(entry, 'fr'))
  ).sort((a, b) => a.data.order - b.data.order);

  // Regroupement par série : on conserve l'ordre originel (publishedAt desc)
  // des articles orphelins. Pour les articles de série, on les hisse en
  // groupe en tête de section, dans l'ordre seriesOrder croissant. La
  // section reste « ## Articles » — c'est juste une réorganisation interne.
  // En l'absence d'entrée `series` déclarée, le rendu est byte-équivalent
  // à la version pré-feature (cf. étape 8 du plan).
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
    const key = `fr/${post.data.series}`;
    if (seenSeries.has(key)) continue;
    seenSeries.add(key);
    seriesGroups.push({
      title: ctx.series.data.title,
      description: ctx.series.data.description,
      // seriesOrder DESC : aligné avec l'archive (dernier épisode en tête).
      episodes: [...ctx.episodes].reverse() as CollectionEntry<'blog'>[],
    });
  }

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
    `- Français (default): [${SITE.url}/llms.txt](${SITE.url}/llms.txt)`
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
    `- [Accueil](${SITE.url}/) : présentation, parcours, domaines d'expertise (IA, architecture, leadership).`
  );
  lines.push(
    `- [Parcours](${SITE.url}/parcours/) : parcours détaillé, expériences (Anytime, Passion Barbecue, Progicar), expertises (Symfony, Sylius, product builder), modes d'intervention, FAQ.`
  );
  lines.push(
    `- [Blog](${SITE.url}/blog/) : notes et essais d'un CTO freelance sur la tech, l'IA, le leadership et le business.`
  );
  lines.push(
    `- [CV PDF](${SITE.url}/cv.pdf) : CV détaillé, dernière mise à jour avril 2026.`
  );
  lines.push(`- [Flux RSS](${SITE.url}/rss.xml) : mises à jour du blog.`);
  lines.push(`- [English version](${SITE.url}/en/) : same content in English.`);
  lines.push('');

  lines.push('## Articles');
  lines.push('');
  for (const group of seriesGroups) {
    lines.push(`### ${group.title}`);
    lines.push('');
    lines.push(`*${group.description}*`);
    lines.push('');
    for (const post of group.episodes) {
      const date = toISODate(post.data.publishedAt);
      lines.push(
        `- [${post.data.title}](${SITE.url}${blogPath(post, 'fr')}) (${date}, ${post.data.category}) : ${post.data.excerpt}`
      );
    }
    lines.push('');
  }
  for (const post of orphans) {
    const date = toISODate(post.data.publishedAt);
    lines.push(
      `- [${post.data.title}](${SITE.url}${blogPath(post, 'fr')}) (${date}, ${post.data.category}) : ${post.data.excerpt}`
    );
  }
  lines.push('');

  if (projects.length) {
    lines.push('## Side projects');
    lines.push('');
    for (const project of projects) {
      lines.push(
        `- [${project.data.title}](${SITE.url}${projectPath(project, 'fr')}) (${project.data.kind} · ${project.data.year} · ${project.data.status}) : ${project.data.excerpt}`
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
