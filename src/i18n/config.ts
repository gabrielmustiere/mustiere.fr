export const LANGUAGES = ['fr', 'en'] as const;
export const DEFAULT_LANG = 'fr' as const;

export type Lang = (typeof LANGUAGES)[number];

export const LANG_META: Record<
  Lang,
  {
    bcp47: string;
    ogLocale: string;
    htmlLang: string;
    nativeName: string;
    flagLabel: string;
  }
> = {
  fr: {
    bcp47: 'fr-FR',
    ogLocale: 'fr_FR',
    htmlLang: 'fr-FR',
    nativeName: 'Français',
    flagLabel: 'Drapeau français',
  },
  en: {
    bcp47: 'en-GB',
    ogLocale: 'en_GB',
    htmlLang: 'en-GB',
    nativeName: 'English',
    flagLabel: 'British flag',
  },
};

export function isLang(value: string): value is Lang {
  return (LANGUAGES as readonly string[]).includes(value);
}
