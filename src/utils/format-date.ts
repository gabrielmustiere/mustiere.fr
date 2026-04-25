import type { Lang } from '@/i18n/config';

const MONTHS_SHORT: Record<Lang, string[]> = {
  fr: [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ],
  en: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
};

export function formatDateShort(date: Date, lang: Lang = 'fr'): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = MONTHS_SHORT[lang][date.getMonth()];
  const y = String(date.getFullYear()).slice(-2);
  return `${d} ${m} ${y}`;
}

export function formatDateDotted(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d} · ${m} · ${y}`;
}

export function formatDateDottedFull(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d} · ${m} · ${date.getFullYear()}`;
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
