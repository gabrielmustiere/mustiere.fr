import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { chapteredGlob } from '@/content-loaders/chaptered-glob';

const categoryEnum = z.enum(['IA', 'Tech', 'Lead', 'Business']);

const langEnum = z.enum(['fr', 'en']);

// Slug public d'une entrée (refacto 010-r-decouple-dossiers-frontmatter).
// Source de vérité pour l'URL canonique : découplé du nom de dossier, ce qui
// permet de renommer ou déplacer un dossier sans casser l'URL. Requis depuis
// l'étape 10. Regex stricte = même alphabet que les segments d'URL
// (kebab-case).
const publicSlugField = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'slug doit être kebab-case (a-z, 0-9, -)');

// Clef de paire FR/EN partagée. Deux entrées d'une même collection qui
// portent la même `translationKey` forment une paire de traduction. La
// cardinalité (strict 0 ou 2) est validée par
// `validateTranslationKeyCardinality` dans astro.config.mjs. Optionnel pour
// les entrées orphelines (pas de pendant dans l'autre langue).
const translationKeyField = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'translationKey doit être kebab-case (a-z, 0-9, -)')
  .optional();

// Schémas des sections SEO injectées par chapteredGlob (cf. seo-sections.ts).
// Le loader lit resume.mdx / faq.mdx / sources.mdx présents dans le dossier
// de chaque entrée, parse leur contenu et l'injecte ici dans `data` avant la
// validation Zod. Cf. plan 005-f-sections-seo-articles.
const resumeSchema = z.object({
  markdown: z.string().min(1),
  html: z.string().min(1),
  plain: z.string().min(60),
});

const faqItem = z.object({
  question: z.string().max(200),
  answer: z.string().min(1),
});

const sourceItem = z.object({
  title: z.string().min(1),
  url: z.url(),
  author: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const blog = defineCollection({
  loader: chapteredGlob({
    base: './src/content/blog',
    extensions: ['.mdx', '.md'],
    // Layout i18n : `blog/fr/<slug>/` et `blog/en/<slug>/`. L'`id` d'entrée
    // porte le préfixe lang (`fr/<slug>`) ; le slug public est extrait via
    // `publicSlug(entry)` (cf. utils/content). Les URLs publiques restent
    // `/blog/<slug>/` (FR) et `/en/blog/<slug>/` (EN), inchangées.
    nestedByLang: ['fr', 'en'],
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(120),
        excerpt: z.string().min(80).max(220),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        category: categoryEnum,
        tags: z.array(z.string()).default([]),
        readingTime: z.number().int().positive().optional(),
        cover: image().optional(),
        coverAlt: z.string().min(3).optional(),
        draft: z.boolean().default(false),
        keywords: z.array(z.string()).default([]),
        resume: resumeSchema,
        faq: z.array(faqItem).default([]),
        sources: z.array(sourceItem).default([]),
        number: z.number().int().positive(),
        lang: langEnum.default('fr'),
        slug: publicSlugField,
        translationKey: translationKeyField,
        // Appartenance à une série d'articles (cf. plan 009-f-blog-series).
        // `series` référence le slug public d'une entrée de la collection
        // `series` dans la même langue que l'article. `seriesOrder` est le
        // rang dans la série (entier positif unique par série, validé par
        // `validateSeriesGraph` au runtime — Zod ne peut pas vérifier la
        // cohérence cross-collection). Les deux champs sont présents
        // ensemble ou absents ensemble.
        series: z.string().optional(),
        seriesOrder: z.number().int().positive().optional(),
      })
      // Une cover doit être disponible pour chaque article : soit déclarée
      // localement (`cover: ./cover.webp`), soit héritée de la paire FR/EN
      // (via `translationKey` partagée — typiquement la version FR fournit la
      // cover pour la version EN). Le helper `getCover` (src/utils/cover.ts)
      // opère la résolution au rendu.
      .superRefine((data, ctx) => {
        if (!data.cover && !data.translationKey) {
          ctx.addIssue({
            code: 'custom',
            path: ['cover'],
            message:
              'cover required (or translationKey to inherit cover from the paired entry)',
          });
        }
        const hasSeries = data.series !== undefined;
        const hasOrder = data.seriesOrder !== undefined;
        if (hasSeries !== hasOrder) {
          ctx.addIssue({
            code: 'custom',
            path: hasSeries ? ['seriesOrder'] : ['series'],
            message:
              'series et seriesOrder doivent être présents ensemble ou absents ensemble',
          });
        }
      }),
});

const series = defineCollection({
  loader: chapteredGlob({
    base: './src/content/series',
    extensions: ['.md', '.mdx'],
    nestedByLang: ['fr', 'en'],
  }),
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(40).max(280),
    lang: langEnum.default('fr'),
    slug: publicSlugField,
    translationKey: translationKeyField,
  }),
});

const projects = defineCollection({
  loader: chapteredGlob({
    base: './src/content/projects',
    extensions: ['.md', '.mdx'],
    // Layout i18n : `projects/fr/<slug>/` et `projects/en/<slug>/`. L'`id`
    // d'entrée porte le préfixe lang (`fr/symfony-template`) ; le slug public
    // est extrait via `publicSlug(entry)` (cf. utils/content).
    nestedByLang: ['fr', 'en'],
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        subtitle: z.string(),
        status: z.enum([
          'actif',
          'archivé',
          'v1.0',
          'v1.1',
          'v1.2',
          'v1.3',
          'beta',
        ]),
        kind: z.string(),
        year: z.number().int(),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        excerpt: z.string(),
        cover: image().optional(),
        coverAlt: z.string().min(3).optional(),
        url: z.url().optional(),
        order: z.number().int().default(0),
        resume: resumeSchema,
        faq: z.array(faqItem).default([]),
        sources: z.array(sourceItem).default([]),
        draft: z.boolean().default(false),
        lang: langEnum.default('fr'),
        slug: publicSlugField,
        translationKey: translationKeyField,
      })
      .superRefine((data, ctx) => {
        if (!data.cover && !data.translationKey) {
          ctx.addIssue({
            code: 'custom',
            path: ['cover'],
            message:
              'cover required (or translationKey to inherit cover from the paired entry)',
          });
        }
      }),
});

export const collections = { blog, projects, series };
export type Category = z.infer<typeof categoryEnum>;
