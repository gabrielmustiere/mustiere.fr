// Préfixe d'ordre éditeur sur le nom d'un dossier d'entrée de collection.
// Un dossier peut être nommé `NNN-<slug>/` pour faciliter le tri visuel dans
// l'arborescence (ex. `001-foo/`, `002-bar/`). Le préfixe vit uniquement sur
// disque : l'`id` Astro est calculé sans le préfixe. Depuis le refacto 010,
// le slug public et les hreflang viennent de `data.slug` / `data.translationKey`,
// indépendants du chemin disque — ce préfixe est purement décoratif.
//
// Limité à 1-3 chiffres pour ne pas confondre avec des slugs qui commencent
// par une année (`2026-bilan-…`).
const ORDER_PREFIX_RE = /^\d{1,3}-/;

export function stripOrderPrefix(name: string): string {
  return name.replace(ORDER_PREFIX_RE, '');
}
