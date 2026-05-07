import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/config';
import { localizedPath } from '@/i18n/utils';
import { routePath } from '@/i18n/routes';

type PublishableEntry = CollectionEntry<'blog'> | CollectionEntry<'projects'>;

type TranslatableCollection = 'blog' | 'projects';

// Les collections `blog` et `projects` utilisent `nestedByLang` : l'`id`
// d'entrée porte un préfixe `fr/` ou `en/` (ex. `fr/symfony-template`). Le slug
// public est la dernière section, sans préfixe.
export function publicSlug(entry: { id: string }): string {
  const parts = entry.id.split('/');
  return parts[parts.length - 1];
}

// URL canonique d'un projet pour la langue donnée. Combine `routePath`
// (segment localisé `/projets` vs `/projects`) et `localizedPath` (préfixe lang
// pour l'EN).
export function projectPath(entry: { id: string }, lang: Lang): string {
  return localizedPath(
    lang,
    `${routePath('projects', lang)}/${publicSlug(entry)}`
  );
}

// URL canonique d'un article de blog. Le segment `/blog` est identique en FR
// et en EN ; seule la lang change le préfixe global.
export function blogPath(entry: { id: string }, lang: Lang): string {
  return localizedPath(lang, `${routePath('blog', lang)}/${publicSlug(entry)}`);
}

// Filtre unique pour les collections `blog` et `projects` :
// - en dev (`make serve`), les drafts sont visibles pour relecture locale ;
// - en build prod (`make build`), ils sont exclus de toutes les sorties
//   (pages, sitemap, RSS, llms.txt). Le mode est porté par `import.meta.env.DEV`.
// - `SHOW_DRAFTS=1 npm run build` force la visibilité des drafts en build, utilisé
//   par `scripts/snapshot-build.mjs` pour verrouiller aussi le rendu des drafts.
// Toujours passer par ce helper plutôt que d'inliner `!data.draft && data.lang === ...`
// pour éviter le drift constaté historiquement (cf. plan t-001).
export function isPublished(entry: PublishableEntry, lang: Lang): boolean {
  const showDraft =
    import.meta.env.DEV || process.env.SHOW_DRAFTS === '1' || !entry.data.draft;
  const matchesLang = (entry.data.lang ?? 'fr') === lang;
  return showDraft && matchesLang;
}

// Génération des URLs de prévisualisation des drafts en prod (cf. plan
// 008-t-draft-preview-urls). Le hash est dérivé du slug + DRAFT_HASH_SEED
// pour rendre l'URL non-devinable depuis le slug seul.
//
// Ce n'est PAS un secret de sécurité : la seed est hardcodée et donc visible
// par quiconque a accès au repo. Si le repo est public, les URLs draft sont
// reconstructibles. C'est accepté — l'objectif est juste d'éviter qu'elles
// soient triviales depuis le slug et qu'elles fuitent dans les listings/sitemap.
//
// Le CLI `scripts/draft-url.mjs` et `tests/draft-isolation.test.mjs` lisent
// la seed via regex sur ce fichier (recherche `DRAFT_HASH_SEED = '...'`) —
// si tu modifies le nom ou la forme, mets-les à jour aussi.
export const DRAFT_HASH_SEED = 'mustiere-drafts-relecture-2026';
const DRAFT_HASH_LENGTH = 10;
const DRAFT_PATH_SEGMENT = '_drafts';

// Renvoie le hash court à insérer dans l'URL d'un draft, ou null en dev (les
// drafts sont alors servis à leur URL canonique via `isPublished()`).
export function getDraftHash(slug: string): string | null {
  if (import.meta.env.DEV) return null;
  return createHash('sha256')
    .update(slug + DRAFT_HASH_SEED)
    .digest('hex')
    .slice(0, DRAFT_HASH_LENGTH);
}

// Renvoie le segment passé à `params.slug` d'une route `[...slug].astro` pour
// générer la page sous `/<collection>/_drafts/<hash>/<slug>/`, ou null en dev.
export function getDraftSlugParam(slug: string): string | null {
  const hash = getDraftHash(slug);
  if (!hash) return null;
  return `${DRAFT_PATH_SEGMENT}/${hash}/${slug}`;
}

// Filtre les entrées d'une collection à exposer en mode preview draft. Renvoie
// un tableau vide en dev (les drafts sont déjà à leur URL canonique via
// `isPublished()`).
// Résout l'entrée traduite d'un article ou projet, en regardant des deux côtés
// de la relation `translationOf`. C'est défensif : historiquement, la déclaration
// n'était faite que d'un côté, ce qui cassait silencieusement le lien EN/FR
// quand on était sur la version « non-déclarante ». En cherchant aussi par
// reverse-lookup (entrée de l'autre langue qui pointe vers `entry`), une seule
// déclaration suffit.
export async function findTranslation<C extends TranslatableCollection>(
  collection: C,
  entry: CollectionEntry<C>,
  otherLang: Lang
): Promise<CollectionEntry<C> | undefined> {
  const candidates = await getCollection(collection, (e) =>
    isPublished(e as PublishableEntry, otherLang)
  );
  // `translationOf` peut référencer soit l'id complet (forme historique :
  // `symfony-template-en` quand la collection était plate), soit le slug public
  // pur (`symfony-template` avec le layout nestedByLang). On compare sur les
  // deux formes pour rester compatible avec les deux conventions.
  const forwardRef = (entry.data as { translationOf?: string }).translationOf;
  if (forwardRef) {
    const forward = candidates.find(
      (c) => c.id === forwardRef || publicSlug(c) === forwardRef
    );
    if (forward) return forward;
  }
  const entrySlug = publicSlug(entry);
  return candidates.find((c) => {
    const ref = (c.data as { translationOf?: string }).translationOf;
    return ref === entry.id || ref === entrySlug;
  });
}

export function getDraftPreviewEntries<T extends PublishableEntry>(
  entries: T[],
  lang: Lang
): T[] {
  if (import.meta.env.DEV) return [];
  return entries.filter(
    (entry) => Boolean(entry.data.draft) && (entry.data.lang ?? 'fr') === lang
  );
}
