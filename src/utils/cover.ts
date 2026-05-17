import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { type CollectionEntry } from 'astro:content';
import { SITE } from '@/consts';
import { findTranslation } from './content';

type CoverableCollection = 'blog' | 'projects';
type CoverableEntry = CollectionEntry<CoverableCollection>;

export interface ResolvedCover {
  cover: ImageMetadata;
  alt: string;
}

export interface ResolvedOgImage {
  url: string;
  width: number;
  height: number;
}

export async function getCover(entry: CoverableEntry): Promise<ResolvedCover> {
  let cover: ImageMetadata | undefined = entry.data.cover;
  // Refacto 010 étape 10 : héritage de cover via la paire FR/EN identifiée
  // par `translationKey` partagée. Quand l'entrée courante n'a pas de cover
  // locale, on cherche l'entrée pendante (autre lang) et on réutilise sa
  // cover. Typiquement une version EN sans cover hérite de la version FR.
  if (!cover && entry.data.translationKey) {
    const lang = entry.data.lang ?? 'fr';
    const otherLang = lang === 'fr' ? 'en' : 'fr';
    const target = await findTranslation(
      entry.collection as CoverableCollection,
      entry,
      otherLang
    );
    cover = target?.data.cover;
  }
  if (!cover) {
    throw new Error(
      `No cover resolvable for ${entry.collection} entry "${entry.id}"`
    );
  }
  // Fallback `''` (et non `data.title`) : les composants qui rendent la
  // <Picture> rendent aussi le titre en h1/h2/h3 juste à côté ; sans
  // coverAlt explicite, l'image est traitée comme décorative pour éviter
  // que les lecteurs d'écran annoncent deux fois le titre.
  return {
    cover,
    alt: entry.data.coverAlt ?? '',
  };
}

// Retourne l'URL absolue + les dimensions effectives de la variante OG.
// Aucun height forcé : `getImage` calcule la hauteur depuis le ratio source
// pour éviter toute distortion (cf. plan 007-f, source 16/9 → OG 1200×675).
export async function getOgImage(
  entry: CoverableEntry
): Promise<ResolvedOgImage> {
  const { cover } = await getCover(entry);
  const og = await getImage({
    src: cover,
    width: 1200,
    format: 'png',
  });
  const width = Number(og.attributes.width ?? 1200);
  const height = Number(
    og.attributes.height ?? Math.round((1200 * cover.height) / cover.width)
  );
  return {
    url: new URL(og.src, SITE.url).toString(),
    width,
    height,
  };
}
