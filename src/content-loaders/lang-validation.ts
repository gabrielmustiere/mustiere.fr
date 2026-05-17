// Validations utilisées par le loader chapteredGlob. Extraites en module
// standalone (sans dépendance Astro) pour rester importables depuis un test
// Node natif (cf. tests/chaptered-glob.test.mjs) : chaptered-glob.ts importe
// `astro/loaders` au top-level, ce qui empêche son import en `node --test`.

// Refacto 010 étape 7 : validation lang ↔ dossier parent. Quand `nestedByLang`
// est actif (cf. chapteredGlob), le `lang` du frontmatter doit matcher le
// dossier parent (`fr/`/`en/`). Bloque les copy-paste où on déplace un fichier
// de l'arbre EN vers l'arbre FR (ou inversement) en oubliant de mettre à jour
// le frontmatter.

export function assertLangMatchesParent(
  data: Record<string, unknown>,
  expectedLang: string | null,
  filePath: string
): void {
  if (!expectedLang) return;
  const actual = typeof data.lang === 'string' ? data.lang : undefined;
  // Tolère l'absence quand expectedLang === 'fr' : c'est la valeur par
  // défaut du schéma Zod, donc une entrée sans `lang:` sera bien traitée
  // comme FR au final. Refuser ici masquerait simplement un défaut de
  // documentation. En revanche, sous `en/`, l'absence aboutirait à un
  // mismatch silencieux (Zod défaulterait à 'fr') → on refuse.
  if (actual === undefined && expectedLang === 'fr') return;
  if (actual === expectedLang) return;
  throw new Error(
    `[chaptered-glob] mismatch lang ↔ dossier parent dans "${filePath}" : ` +
      `frontmatter lang="${actual ?? '(absent)'}" mais le fichier est sous ` +
      `"${expectedLang}/". Aligne le frontmatter ou déplace le fichier.`
  );
}

// Refacto 010 étape 8 : détecte les collisions de slug public dans un même
// (collection, lang) — deux entrées qui finiraient par exposer la même URL.
// Le check du nom de dossier (claimId dans chaptered-glob.ts) ne couvre pas
// le cas où deux dossiers distincts déclarent un `slug:` identique dans
// leur frontmatter. Factory pour pouvoir partager le `seenPublicSlugs` Map
// sur toute la durée d'un run du loader.
export function createPublicSlugClaimer(): (
  lang: string,
  slug: string,
  source: string
) => void {
  const seen = new Map<string, string>();
  return (lang, slug, source) => {
    const key = `${lang}/${slug}`;
    const prev = seen.get(key);
    if (prev) {
      throw new Error(
        `[chaptered-glob] collision de slug public "${key}" entre ` +
          `"${prev}" et "${source}". Deux entrées d'une même langue ne ` +
          `peuvent pas exposer le même slug (URL collisionnée). Modifie ` +
          `le champ "slug:" de l'une des deux.`
      );
    }
    seen.set(key, source);
  };
}
