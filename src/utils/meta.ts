// Utilitaires pour les meta descriptions HTML.
// Cf. plan 005-f-sections-seo-articles : la meta description d'un article ou
// projet est dérivée de `data.resume.plain` (texte stripé), tronqué à ~160
// caractères au mot le plus proche, suivi d'une ellipse si coupé.

const DEFAULT_META_MAX_LEN = 160;
const ELLIPSIS = '…';

export function truncateForMeta(
  text: string,
  maxLen: number = DEFAULT_META_MAX_LEN
): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  // Garde de la place pour l'ellipse.
  const budget = maxLen - ELLIPSIS.length;
  const slice = t.slice(0, budget);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > budget * 0.5 ? slice.slice(0, lastSpace) : slice;
  // Nettoie les ponctuations qui collent mal à l'ellipse.
  return cut.replace(/[.,;:!?–—-]+$/, '').trimEnd() + ELLIPSIS;
}
