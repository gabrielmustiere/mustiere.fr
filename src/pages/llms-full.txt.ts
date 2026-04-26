import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { toISODate } from '@/utils/format-date';
import { isPublished } from '@/utils/content';

// Racine `llms-full.txt` — contenu intégral FR (langue par défaut, sans
// préfixe). La variante anglaise reste disponible sur /en/llms-full.txt.
export const GET: APIRoute = async () => {
  const posts = (
    await getCollection('blog', (entry) => isPublished(entry, 'fr'))
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

  for (const post of posts) {
    const date = toISODate(post.data.publishedAt);
    parts.push(`### ${post.data.title}`);
    parts.push('');
    parts.push(
      `*Publié le ${date} · Catégorie : ${post.data.category} · URL : ${SITE.url}/blog/${post.id}/*`
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
