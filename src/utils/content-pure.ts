// Helpers purs sur les entrées de collection — sans dépendance `astro:content`
// pour rester importables en contexte de test (node --test --strip-types).
// `content.ts` les re-exporte pour conserver la surface publique. Extrait du
// fichier original par le refacto 010-r-decouple-dossiers-frontmatter (verrou
// caractérisation : ces helpers sont la cible du refacto et doivent être
// testables unitairement avant qu'on touche au code).

// Les collections `blog` et `projects` utilisent `nestedByLang` : l'`id`
// d'entrée porte un préfixe `fr/` ou `en/` (ex. `fr/symfony-template`). Le slug
// public est la dernière section, sans préfixe.
export function publicSlug(entry: { id: string }): string {
  const parts = entry.id.split('/');
  return parts[parts.length - 1];
}

// Logique pure de matching pour `findTranslation`. Prend la liste de
// candidats déjà filtrés (par l'autre langue) et retourne celui qui correspond
// à `entry`. Sans `await getCollection`, donc testable inline avec des
// fixtures `{ id, data: { translationOf? } }`.
//
// `translationOf` peut référencer soit l'id complet (forme historique :
// `symfony-template-en` quand la collection était plate), soit le slug public
// pur (`symfony-template` avec le layout nestedByLang). On compare sur les
// deux formes pour rester compatible avec les deux conventions.
//
// Le matching cherche d'abord en `forward` (entry → candidat ciblé via
// `entry.data.translationOf`), puis en `reverse` (candidat dont le
// `translationOf` pointe vers `entry`). Une seule déclaration suffit donc à
// lier la paire.
export function pickTranslationLegacy<
  E extends { id: string; data: { translationOf?: string } },
>(candidates: E[], entry: E): E | undefined {
  const forwardRef = entry.data.translationOf;
  if (forwardRef) {
    const forward = candidates.find(
      (c) => c.id === forwardRef || publicSlug(c) === forwardRef
    );
    if (forward) return forward;
  }
  const entrySlug = publicSlug(entry);
  return candidates.find((c) => {
    const ref = c.data.translationOf;
    return ref === entry.id || ref === entrySlug;
  });
}
