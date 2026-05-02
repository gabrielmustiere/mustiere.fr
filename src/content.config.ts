import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { chapteredGlob } from '@/content-loaders/chaptered-glob';

const categoryEnum = z.enum(['IA', 'Tech', 'Lead', 'Business']);

const langEnum = z.enum(['fr', 'en']);

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
        translationOf: z.string().optional(),
      })
      // Une cover doit être disponible pour chaque article : soit déclarée
      // localement (`cover: ./cover.webp`), soit héritée d'une entrée pointée
      // par `translationOf` (typiquement la version FR pour un article EN
      // bilingue). Le helper `getCover` (src/utils/article-cover.ts) opère
      // la résolution au rendu.
      .superRefine((data, ctx) => {
        if (!data.cover && !data.translationOf) {
          ctx.addIssue({
            code: 'custom',
            path: ['cover'],
            message:
              'cover required (or translationOf to inherit cover from another entry)',
          });
        }
      }),
});

const projects = defineCollection({
  loader: chapteredGlob({
    base: './src/content/projects',
    extensions: ['.md', '.mdx'],
  }),
  schema: z.object({
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
    cover: z.string().optional(),
    url: z.url().optional(),
    order: z.number().int().default(0),
    resume: resumeSchema,
    faq: z.array(faqItem).default([]),
    sources: z.array(sourceItem).default([]),
    draft: z.boolean().default(false),
    lang: langEnum.default('fr'),
    translationOf: z.string().optional(),
  }),
});

export const collections = { blog, projects };
export type Category = z.infer<typeof categoryEnum>;
