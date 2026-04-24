import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import { SITE } from './src/consts.ts';

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
    format: 'file',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  redirects: {
    '/': '/fr',
    '/blog': '/fr/blog',
    '/blog/[...slug]': '/fr/blog/[...slug]',
    '/projects/[...slug]': '/fr/projects/[...slug]',
    '/rss.xml': '/fr/rss.xml',
    '/llms.txt': '/fr/llms.txt',
    '/llms-full.txt': '/fr/llms-full.txt',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt'),
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-GB',
        },
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    robotsTxt({
      sitemap: [`${SITE.url}/sitemap-index.xml`],
      policy: [
        { userAgent: 'GPTBot', allow: '/' },
        { userAgent: 'ClaudeBot', allow: '/' },
        { userAgent: 'anthropic-ai', allow: '/' },
        { userAgent: 'Claude-Web', allow: '/' },
        { userAgent: 'PerplexityBot', allow: '/' },
        { userAgent: 'Perplexity-User', allow: '/' },
        { userAgent: 'Google-Extended', allow: '/' },
        { userAgent: 'Applebot-Extended', allow: '/' },
        { userAgent: 'CCBot', allow: '/' },
        { userAgent: 'cohere-ai', allow: '/' },
        { userAgent: 'Bytespider', disallow: '/' },
        { userAgent: '*', allow: '/', disallow: ['/404'] },
      ],
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: false,
    },
  },
});
