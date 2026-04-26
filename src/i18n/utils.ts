import { DEFAULT_LANG, LANGUAGES, isLang, type Lang } from './config';
import { ui, type UiDict } from './ui';

// Le FR (langue par défaut) est servi sans préfixe (`/`, `/blog/`, …).
// Seul l'anglais est préfixé (`/en/`, `/en/blog/`, …).

export function getLangFromUrl(url: URL): Lang {
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first === 'en') return 'en';
  return DEFAULT_LANG;
}

export function useTranslations(lang: Lang): UiDict {
  return ui[lang] as UiDict;
}

export function localizedPath(lang: Lang, path: string = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const isFile = /\.[a-z0-9]+$/i.test(normalized);
  if (lang === DEFAULT_LANG) {
    if (normalized === '/') return '/';
    if (isFile) return normalized;
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }
  if (normalized === '/') return `/${lang}/`;
  if (isFile) return `/${lang}${normalized}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return `/${lang}${withSlash}`;
}

export function stripLangFromPath(pathname: string): {
  lang: Lang;
  rest: string;
} {
  // Supporte les artefacts `.html` hérités d'anciens builds.
  const normalized = pathname.replace(/\.html$/i, '');
  const segments = normalized.split('/').filter(Boolean);
  const first = segments[0];
  if (first === 'en') {
    const rest = '/' + segments.slice(1).join('/');
    const withSlash =
      rest === '/' || pathname.endsWith('/') ? (rest === '/' ? '/' : `${rest}/`) : rest;
    return { lang: 'en', rest: withSlash };
  }
  return { lang: DEFAULT_LANG, rest: normalized || '/' };
}

export function swapLang(pathname: string, target: Lang): string {
  const { rest } = stripLangFromPath(pathname);
  if (target === DEFAULT_LANG) return rest === '/' ? '/' : rest;
  if (rest === '/') return `/${target}/`;
  return `/${target}${rest}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

export function formatDate(date: Date, lang: Lang): string {
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(date: Date, lang: Lang): string {
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export { LANGUAGES, DEFAULT_LANG, isLang };
export type { Lang };
