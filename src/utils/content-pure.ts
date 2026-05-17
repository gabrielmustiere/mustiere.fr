// Helpers purs sur les entrées de collection — sans dépendance `astro:content`
// pour rester importables en contexte de test (node --test --strip-types).
// `content.ts` les re-exporte pour conserver la surface publique. Extrait du
// fichier original par le refacto 010-r-decouple-dossiers-frontmatter.

// Slug public d'une entrée. Source de vérité : `entry.data.slug` (requis
// dans les schémas Zod depuis l'étape 10 du refacto 010). L'`id` Astro
// peut être préfixé par la lang (nestedByLang) ou par un préfixe d'ordre
// éditeur (`NNN-`) — le slug d'URL ne dépend plus du tout du chemin
// disque.
export function publicSlug(entry: { data: { slug: string } }): string {
  return entry.data.slug;
}

// Matching par `translationKey` (refacto 010). Une paire FR/EN est formée
// par deux entrées qui portent la même `translationKey` dans la même
// collection. Logique pure : prend la liste de candidats (déjà filtrée par
// la lang cible) et retourne celui qui matche, ou undefined si pas de key
// ou pas de candidat compatible. La cardinalité (0 ou 2) est garantie au
// build par `validateTranslationKeyCardinality`, donc le find ci-dessous
// trouve au plus une entrée.
export function pickTranslationByKey<
  E extends { id: string; data: { translationKey?: string } },
>(candidates: E[], entry: E): E | undefined {
  const key = entry.data.translationKey;
  if (!key) return undefined;
  return candidates.find((c) => c.data.translationKey === key);
}
