import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';
import { blogPath, isPublished } from '@/utils/content';
import { buildSeriesIndex, sortArchive } from '@/utils/series';

// Racine `llms-full.txt` — contenu intégral FR (langue par défaut, sans
// préfixe). La variante anglaise reste disponible sur /en/llms-full.txt.
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

  // Cf. llms.txt : on regroupe les articles d'une même série en tête de la
  // section, puis on liste les orphelins. Sans entrée série déclarée, le
  // rendu reste byte-équivalent à la version pré-feature.
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
    `Localized variants: ${SITE.url}/llms-full.txt (default) · ${SITE.url}/en/llms-full.txt`
  );
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## À propos');
  parts.push('');
  parts.push(
    `${SITE.author.name} est CTO freelance basé à ${SITE.author.city}. 14 ans dans la tech, CTO depuis 2017. Expert Symfony et Sylius, builder de produits SaaS et e-commerce from scratch.`
  );
  parts.push('');
  parts.push(
    `Il a bâti la filiale SaaS Progicar (Groupe GEMY) de zéro à plus de 25 personnes en cinq ans (CTO fondateur, 2017 → 2022), puis cofondé Passion Barbecue où il a porté la plateforme e-commerce Sylius de bout en bout (2022 → 2025).`
  );
  parts.push('');
  parts.push(
    `Depuis septembre 2025, freelance. Mission en cours : Anytime, conformité PSD2/SCA via WebAuthn (passkeys, biométrie, clés de sécurité matérielles). Disponibilité prochaine : Q3 2026, en mission longue, CTO fractional pour startup early stage, audit ou sparring.`
  );
  parts.push('');
  parts.push(`Parcours détaillé : ${SITE.url}/parcours/`);
  parts.push('');
  parts.push('---');
  parts.push('');

  parts.push('## Articles');
  parts.push('');

  const renderPost = (post: CollectionEntry<'blog'>) => {
    const date = toISODate(post.data.publishedAt);
    parts.push(`### ${post.data.title}`);
    parts.push('');
    parts.push(
      `*Publié le ${date} · Catégorie : ${post.data.category} · URL : ${SITE.url}${blogPath(post, 'fr')}*`
    );
    parts.push('');
    if (post.data.resume?.markdown) {
      parts.push(`**Résumé.** ${post.data.resume.markdown}`);
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
    parts.push(`### Série — ${group.title}`);
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
