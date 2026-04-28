import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { chapteredGlob } from '@/content-loaders/chaptered-glob';

const categoryEnum = z.enum(['IA', 'Tech', 'Lead', 'Business']);

const langEnum = z.enum(['fr', 'en']);

const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
});

const blog = defineCollection({
  loader: chapteredGlob({
    base: './src/content/blog',
    extensions: ['.mdx', '.md'],
  }),
  schema: z.object({
    title: z.string().max(120),
    excerpt: z.string().min(80).max(220),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: categoryEnum,
    tags: z.array(z.string()).default([]),
    readingTime: z.number().int().positive().optional(),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
    keywords: z.array(z.string()).default([]),
    tldr: z.string().min(60).max(320),
    faq: z.array(faqItem).default([]),
    number: z.number().int().positive(),
    lang: langEnum.default('fr'),
    translationOf: z.string().optional(),
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
    excerpt: z.string(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    url: z.url().optional(),
    order: z.number().int().default(0),
    faq: z.array(faqItem).default([]),
    draft: z.boolean().default(false),
    lang: langEnum.default('fr'),
    translationOf: z.string().optional(),
  }),
});

export const collections = { blog, projects };
export type Category = z.infer<typeof categoryEnum>;
