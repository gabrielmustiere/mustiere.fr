import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/config';
import { localizedPath } from '@/i18n/utils';
import { routePath } from '@/i18n/routes';
import {
  publicSlug,
  pickTranslationByKey,
  pickTranslationLegacy,
} from './content-pure';

export { publicSlug } from './content-pure';

type PublishableEntry =
  | CollectionEntry<'blog'>
  | CollectionEntry<'projects'>
  | CollectionEntry<'series'>;

type TranslatableCollection = 'blog' | 'projects' | 'series';

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
  // `draft` n'existe que sur `blog` et `projects` ; `series` n'a pas la
  // notion de draft et passe donc toujours le filtre côté visibilité.
  const draft = 'draft' in entry.data ? entry.data.draft : false;
  const showDraft =
    import.meta.env.DEV || process.env.SHOW_DRAFTS === '1' || !draft;
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
  // Logique pure dans content-pure.ts pour testabilité (le module ne peut pas
  // être importé en test Node car `astro:content` est un module virtuel Astro).
  //
  // Cascade : `translationKey` prioritaire (refacto 010 étape 4), fallback
  // sur la logique legacy `translationOf` (qui disparaîtra à l'étape 10).
  // Tant qu'aucune entrée ne porte `translationKey` (migration étape 6),
  // le résultat est identique au comportement historique.
  const typedCandidates = candidates as unknown as {
    id: string;
    data: { translationOf?: string; translationKey?: string; slug?: string };
  }[];
  const typedEntry = entry as unknown as {
    id: string;
    data: { translationOf?: string; translationKey?: string; slug?: string };
  };
  const byKey = pickTranslationByKey(typedCandidates, typedEntry);
  if (byKey) return byKey as CollectionEntry<C> | undefined;
  return pickTranslationLegacy(typedCandidates, typedEntry) as
    | CollectionEntry<C>
    | undefined;
}

export function getDraftPreviewEntries<T extends PublishableEntry>(
  entries: T[],
  lang: Lang
): T[] {
  if (import.meta.env.DEV) return [];
  return entries.filter((entry) => {
    const draft = 'draft' in entry.data ? entry.data.draft : false;
    return Boolean(draft) && (entry.data.lang ?? 'fr') === lang;
  });
}
