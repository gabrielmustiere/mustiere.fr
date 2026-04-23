import { defineCollection, z } from 'astro:content';

const categoryEnum = z.enum(['IA', 'Tech', 'Lead', 'Business']);

const blog = defineCollection({
  type: 'content',
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
    number: z.number().int().positive(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    status: z.enum(['actif', 'archivé', 'v1.0', 'v1.1', 'v1.2', 'v1.3', 'beta']),
    kind: z.string(),
    year: z.number().int(),
    excerpt: z.string(),
    url: z.string().url().optional(),
    order: z.number().int().default(0),
  }),
});

export const collections = { blog, projects };
export type Category = z.infer<typeof categoryEnum>;
