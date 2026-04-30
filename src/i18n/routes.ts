import type { Lang } from './config';

export const ROUTES = {
  parcours: { fr: '/parcours', en: '/background' },
  blog: { fr: '/blog', en: '/blog' },
  rssFeed: { fr: '/rss.xml', en: '/en/rss.xml' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteName = keyof typeof ROUTES;

export function routePath(name: RouteName, lang: Lang): string {
  return ROUTES[name][lang];
}
