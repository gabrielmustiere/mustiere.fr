// Refacto 010 étape 7 : validation lang ↔ dossier parent. Quand `nestedByLang`
// est actif (cf. chapteredGlob), le `lang` du frontmatter doit matcher le
// dossier parent (`fr/`/`en/`). Bloque les copy-paste où on déplace un fichier
// de l'arbre EN vers l'arbre FR (ou inversement) en oubliant de mettre à jour
// le frontmatter.
//
// Extrait en module standalone pour rester importable depuis un test Node
// natif (cf. tests/chaptered-glob.test.mjs) : chaptered-glob.ts importe
// `astro/loaders` au top-level, ce qui empêche son import en `node --test`.

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
