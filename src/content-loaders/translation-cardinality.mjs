// Refacto 010 étape 9 : invariant strict — chaque `translationKey` doit être
// porté par 0 (orphelin sans key) ou 2 (paire FR/EN) entrées d'une même
// collection. Tout autre cardinalité (1, 3+, ou 2 mais même lang) casse le
// build avec la liste des entrées fautives.
//
// Module standalone .mjs (sans TS) pour pouvoir être importé à la fois
// par astro.config.mjs (qui le consomme en production) et par un test Node
// natif (cf. tests/chaptered-glob.test.mjs) sans dépendance Astro.

/**
 * @typedef {{ lang: string, translationKey?: string, dirPath?: string|null }} EntryMeta
 */

/**
 * Valide la cardinalité de `translationKey` sur un set d'entrées.
 * Lève une Error explicite (chemins + langs) au premier invariant rompu.
 *
 * @param {Iterable<[string, EntryMeta]>} entries  paires (id Astro, meta)
 */
export function validateTranslationKeyCardinality(entries) {
  /** @type {Map<string, { key: string, meta: EntryMeta }[]>} */
  const byTranslationKey = new Map();
  for (const [key, meta] of entries) {
    if (!meta.translationKey) continue;
    // Le bucket est indexé par `${collection}/${translationKey}` côté
    // appelant ; ici on s'en remet à la convention : la "collection" est
    // dérivée de l'id (préfixe). Mais on garde l'API générique : l'appelant
    // doit grouper en amont. On regroupe par `translationKey` seul ici, et
    // l'appelant doit boucler par collection. Ici on reçoit déjà les
    // entrées filtrées par collection (cf. astro.config.mjs).
    let bucket = byTranslationKey.get(meta.translationKey);
    if (!bucket) {
      bucket = [];
      byTranslationKey.set(meta.translationKey, bucket);
    }
    bucket.push({ key, meta });
  }
  for (const [tk, bucket] of byTranslationKey) {
    if (bucket.length !== 2) {
      const list = bucket
        .map((b) => `  - ${b.meta.dirPath ?? b.key} (lang=${b.meta.lang})`)
        .join('\n');
      throw new Error(
        `[i18n] translationKey "${tk}" porté par ${bucket.length} ` +
          `entrée(s) — attendu 0 (orphelin sans key) ou 2 (paire FR/EN). ` +
          `Entrées concernées :\n${list}\n` +
          `Soit ajoute la paire manquante, soit retire le champ ` +
          `translationKey des entrées listées.`
      );
    }
    const langs = bucket.map((b) => b.meta.lang).sort();
    if (langs[0] === langs[1]) {
      const list = bucket
        .map((b) => `  - ${b.meta.dirPath ?? b.key}`)
        .join('\n');
      throw new Error(
        `[i18n] translationKey "${tk}" porté par 2 entrées de la ` +
          `même lang (${langs[0]}) — une paire doit avoir une entrée par ` +
          `langue (fr + en). Entrées concernées :\n${list}`
      );
    }
  }
}
