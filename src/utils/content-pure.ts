// Helpers purs sur les entrées de collection — sans dépendance `astro:content`
// pour rester importables en contexte de test (node --test --strip-types).
// `content.ts` les re-exporte pour conserver la surface publique. Extrait du
// fichier original par le refacto 010-r-decouple-dossiers-frontmatter (verrou
// caractérisation : ces helpers sont la cible du refacto et doivent être
// testables unitairement avant qu'on touche au code).

// Slug public d'une entrée. Source de vérité : `entry.data.slug` (champ
// introduit à l'étape 2 du refacto 010, optionnel pendant la phase Strangler).
// Fallback : la dernière section de `entry.id` (= nom de dossier, ou nom de
// fichier pour la forme plate). Le fallback disparaîtra à l'étape 10 quand
// `slug` deviendra obligatoire dans le schéma Zod.
//
// `nestedByLang` actif sur blog/projects/series : l'`id` porte le préfixe
// `fr/` ou `en/`, le slug public est la dernière section sans préfixe.
export function publicSlug(entry: {
  id: string;
  data?: { slug?: string };
}): string {
  const explicit = entry.data?.slug;
  if (explicit) return explicit;
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
// Matching par `translationKey` (refacto 010, étape 4). Une paire FR/EN est
// formée par deux entrées qui portent le même `translationKey` dans la même
// collection. Logique pure : prend la liste de candidats (déjà filtrée par
// la lang cible) et retourne celui qui matche, ou undefined si pas de key
// ou pas de candidat compatible. Ne fait PAS le fallback legacy — l'appelant
// (findTranslation) cascade lui-même.
export function pickTranslationByKey<
  E extends { id: string; data: { translationKey?: string } },
>(candidates: E[], entry: E): E | undefined {
  const key = entry.data.translationKey;
  if (!key) return undefined;
  return candidates.find((c) => c.data.translationKey === key);
}

export function pickTranslationLegacy<
  E extends {
    id: string;
    data: { translationOf?: string; slug?: string };
  },
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
