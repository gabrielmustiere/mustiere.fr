import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';

// Loader maison qui remplace `glob` pour les collections `blog` et `projects`
// du refacto 004-r-mdx-chapter-split. Supporte deux formes en parallèle :
//
// 1. Forme plate (héritée) : `<slug>.mdx` ou `<slug>.md` à la racine du dossier
//    de collection. Comportement identique à `glob({ pattern: '**/*.{md,mdx}' })` :
//    le fichier est inscrit en deferredRender, Vite le rend via le pipeline MDX.
//
// 2. Forme dossier (nouvelle) : `<slug>/index.{md,mdx}` portant le frontmatter,
//    accompagné de chapitres `NN-<slug>.{md,mdx}` (préfixe à 2 chiffres + tiret +
//    kebab-case) qui ne contiennent ni frontmatter ni `import`/`export` top-level.
//    Le loader matérialise un fichier agrégé sous `.astro/chaptered/<collection>/`
//    et l'inscrit en deferredRender, ce qui laisse Vite faire le rendu MDX
//    standard sans patch du pipeline.
//
// Les deux formes coexistent dans la même collection. L'`id` de l'entrée est le
// nom de fichier sans extension (forme plate) ou le nom du dossier (forme dossier),
// donc les URLs publiques restent identiques.

const CHAPTER_NAME_RE = /^\d{2}-[a-z0-9-]+\.(md|mdx)$/;
const FENCE_RE = /^([`~]{3,})/;
const TOPLEVEL_RE = /^\s*(import|export)\s/;

interface ChapteredGlobOptions {
  base: string;
  extensions: string[];
}

type EntryType = {
  extensions: string[];
  getEntryInfo: (params: {
    fileUrl: URL;
    contents: string;
  }) => Promise<{
    body: string;
    data: Record<string, unknown>;
    rawData: string;
    slug: string;
  }>;
  contentModuleTypes?: string;
};

type LoaderCtx = LoaderContext & { entryTypes: Map<string, EntryType> };

// Détecte un `import` ou `export` au top-level MDX (hors blocs de code fenced).
// Renvoie le numéro de la ligne incriminée (1-based) ou null.
function findTopLevelImportLine(source: string): number | null {
  const lines = source.split('\n');
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      const m = line.match(FENCE_RE);
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) {
        fence = null;
      }
      continue;
    }
    const open = line.match(FENCE_RE);
    if (open) {
      fence = open[1];
      continue;
    }
    if (TOPLEVEL_RE.test(line)) return i + 1;
  }
  return null;
}

function posixRelative(from: string, to: string): string {
  return relative(from, to).split(sep).join('/');
}

export function chapteredGlob(options: ChapteredGlobOptions): Loader {
  const { base, extensions } = options;

  return {
    name: 'chaptered-glob',
    load: async (context) => {
      const ctx = context as LoaderCtx;
      const { config, store, logger, watcher, collection } = ctx;

      const rootPath = fileURLToPath(config.root);
      const baseDir = new URL(
        base.endsWith('/') ? base : base + '/',
        config.root
      );
      const baseDirPath = fileURLToPath(baseDir);

      if (!existsSync(baseDirPath)) {
        logger.warn(`[chaptered-glob] base inexistante : ${baseDirPath}`);
        return;
      }

      const untouched = new Set(store.keys());

      const entries = readdirSync(baseDirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

        if (entry.isFile()) {
          const ext = pickExtension(entry.name, extensions);
          if (!ext) continue;
          const id = entry.name.slice(0, -ext.length);
          await loadFlat({ ctx, rootPath, baseDirPath, fileName: entry.name, ext, id });
          untouched.delete(id);
        } else if (entry.isDirectory()) {
          const id = entry.name;
          await loadFolder({
            ctx,
            rootPath,
            baseDirPath,
            dirName: entry.name,
            extensions,
            id,
            collection,
          });
          untouched.delete(id);
        }
      }

      for (const id of untouched) {
        store.delete(id);
      }

      if (watcher) {
        watcher.add(baseDirPath);
      }
    },
  };
}

function pickExtension(name: string, exts: string[]): string | null {
  for (const e of exts) if (name.endsWith(e)) return e;
  return null;
}

async function loadFlat(args: {
  ctx: LoaderCtx;
  rootPath: string;
  baseDirPath: string;
  fileName: string;
  ext: string;
  id: string;
}) {
  const { ctx, rootPath, baseDirPath, fileName, ext, id } = args;
  const filePath = join(baseDirPath, fileName);
  const fileUrl = pathToFileURL(filePath);
  const contents = readFileSync(filePath, 'utf-8');

  const entryType = ctx.entryTypes.get(ext);
  if (!entryType) {
    ctx.logger.warn(`[chaptered-glob] pas d'entryType pour ${ext}`);
    return;
  }

  const { body, data } = await entryType.getEntryInfo({ contents, fileUrl });
  const digest = ctx.generateDigest(contents);
  const relPath = posixRelative(rootPath, filePath);

  // Si l'entrée est déjà à jour (digest identique), `store.set` sort en early
  // return sans appeler `addModuleImport` ; sans cet appel manuel, le map
  // `astro:content-module-imports` se reconstruit vide et le rendu Vite n'a
  // plus de fichier à importer (idem à glob.js:91-99).
  const existing = ctx.store.get(id);
  if (existing && existing.digest === digest && existing.filePath) {
    if (existing.deferredRender) {
      ctx.store.addModuleImport(existing.filePath);
    }
    return;
  }

  const parsedData = await ctx.parseData({ id, data, filePath });
  ctx.store.set({
    id,
    data: parsedData,
    body,
    filePath: relPath,
    digest,
    deferredRender: true,
  });
}

async function loadFolder(args: {
  ctx: LoaderCtx;
  rootPath: string;
  baseDirPath: string;
  dirName: string;
  extensions: string[];
  id: string;
  collection: string;
}) {
  const { ctx, rootPath, baseDirPath, dirName, extensions, id, collection } = args;
  const dirPath = join(baseDirPath, dirName);
  const files = readdirSync(dirPath);

  let indexExt: string | null = null;
  for (const e of extensions) {
    if (files.includes(`index${e}`)) {
      indexExt = e;
      break;
    }
  }
  if (!indexExt) {
    throw new Error(
      `[chaptered-glob] dossier "${dirName}" sans index.{${extensions
        .map((e) => e.slice(1))
        .join(',')}} (attendu : index.mdx ou index.md à la racine du dossier).`
    );
  }

  const indexPath = join(dirPath, `index${indexExt}`);
  const indexUrl = pathToFileURL(indexPath);
  const indexContents = readFileSync(indexPath, 'utf-8');

  const entryType = ctx.entryTypes.get(indexExt);
  if (!entryType) {
    throw new Error(`[chaptered-glob] pas d'entryType pour ${indexExt}`);
  }

  const { body: indexBody, data, rawData } = await entryType.getEntryInfo({
    contents: indexContents,
    fileUrl: indexUrl,
  });

  const chapterFiles: string[] = [];
  for (const f of files) {
    if (f === `index${indexExt}`) continue;
    if (f.startsWith('.') || f.startsWith('_')) continue;
    if (CHAPTER_NAME_RE.test(f)) {
      chapterFiles.push(f);
      continue;
    }
    if (extensions.some((e) => f.endsWith(e))) {
      throw new Error(
        `[chaptered-glob] "${dirName}/${f}" non conforme. Attendu : ` +
          `"index.{md,mdx}" ou un chapitre "NN-slug.{md,mdx}" (NN sur 2 chiffres, ` +
          `slug en kebab-case).`
      );
    }
  }
  chapterFiles.sort();

  const chapterBodies: string[] = [];
  for (const cf of chapterFiles) {
    const cp = join(dirPath, cf);
    const cc = readFileSync(cp, 'utf-8');
    if (cc.startsWith('---\n') || cc.startsWith('---\r\n')) {
      throw new Error(
        `[chaptered-glob] "${dirName}/${cf}" : frontmatter interdit dans un ` +
          `chapitre (frontmatter va dans index${indexExt}).`
      );
    }
    const importLine = findTopLevelImportLine(cc);
    if (importLine !== null) {
      throw new Error(
        `[chaptered-glob] "${dirName}/${cf}":${importLine} : import/export top-level ` +
          `interdit dans un chapitre (cf. plan 004-r, option ii non implémentée). ` +
          `Place les imports dans index${indexExt}.`
      );
    }
    chapterBodies.push(cc);
  }

  if (chapterBodies.length === 0 && !indexBody.trim()) {
    throw new Error(
      `[chaptered-glob] dossier "${dirName}" : aucun chapitre et index sans corps. ` +
        `Soit ajouter des chapitres NN-*.{md,mdx}, soit écrire le contenu dans index${indexExt}.`
    );
  }

  // Le body agrégé suit la convention stricte : index body, puis chapitres triés
  // alphabétiquement, joints par '\n\n' pour un séparateur stable byte-à-byte.
  const parts: string[] = [];
  if (indexBody.trim().length > 0) parts.push(indexBody);
  for (const cb of chapterBodies) parts.push(cb);
  const aggregatedBody = parts.join('\n\n');

  const assembledRel = `.astro/chaptered/${collection}/${dirName}${indexExt}`;
  const assembledAbs = join(rootPath, assembledRel);
  const digestSource = indexContents + '\n' + chapterBodies.join('\n');
  const digest = ctx.generateDigest(digestSource);

  // Court-circuit no-change : conserve l'entrée existante et réinscrit le
  // fileName dans le map content-modules (cf. loadFlat).
  const existing = ctx.store.get(id);
  if (
    existing &&
    existing.digest === digest &&
    existing.filePath &&
    existsSync(assembledAbs)
  ) {
    if (existing.deferredRender) {
      ctx.store.addModuleImport(existing.filePath);
    }
    return;
  }

  // Matérialiser le fichier agrégé sous .astro/chaptered/<collection>/<dirname>.<ext>
  // pour que Vite puisse le rendre via le pipeline MDX standard.
  const frontmatterBlock = rawData.length > 0 ? `---\n${rawData}\n---\n` : '';
  const assembledContent = frontmatterBlock + aggregatedBody + '\n';
  mkdirSync(dirname(assembledAbs), { recursive: true });
  writeFileSync(assembledAbs, assembledContent, 'utf-8');

  const parsedData = await ctx.parseData({ id, data, filePath: indexPath });

  ctx.store.set({
    id,
    data: parsedData,
    body: aggregatedBody,
    filePath: assembledRel,
    digest,
    deferredRender: true,
  });
}
