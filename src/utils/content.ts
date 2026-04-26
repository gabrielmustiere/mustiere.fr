import type { CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/config';

type PublishableEntry = CollectionEntry<'blog'> | CollectionEntry<'projects'>;

// Filtre unique pour les collections `blog` et `projects` :
// - en dev (`make serve`), les drafts sont visibles pour relecture locale ;
// - en build prod (`make build`), ils sont exclus de toutes les sorties
//   (pages, sitemap, RSS, llms.txt). Le mode est porté par `import.meta.env.DEV`.
// Toujours passer par ce helper plutôt que d'inliner `!data.draft && data.lang === ...`
// pour éviter le drift constaté historiquement (cf. plan t-001).
export function isPublished(entry: PublishableEntry, lang: Lang): boolean {
  const showDraft = import.meta.env.DEV || !entry.data.draft;
  const matchesLang = (entry.data.lang ?? 'fr') === lang;
  return showDraft && matchesLang;
}
