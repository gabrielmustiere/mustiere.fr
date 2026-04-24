import { DEFAULT_LANG, LANGUAGES, isLang, type Lang } from './config';
import { ui, type UiDict } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isLang(first)) return first;
  return DEFAULT_LANG;
}

export function useTranslations(lang: Lang): UiDict {
  return ui[lang] as UiDict;
}

export function localizedPath(lang: Lang, path: string = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return `/${lang}`;
  return `/${lang}${normalized}`;
}

export function stripLangFromPath(pathname: string): {
  lang: Lang;
  rest: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isLang(first)) {
    const rest = '/' + segments.slice(1).join('/');
    return { lang: first, rest: rest === '/' ? '/' : rest };
  }
  return { lang: DEFAULT_LANG, rest: pathname || '/' };
}

export function swapLang(pathname: string, target: Lang): string {
  const { rest } = stripLangFromPath(pathname);
  if (rest === '/') return `/${target}`;
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
