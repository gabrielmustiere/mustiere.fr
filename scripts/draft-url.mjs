#!/usr/bin/env node
// Imprime l'URL de prévisualisation d'un article draft (cf. plan
// 008-t-draft-preview-urls). Usage : `npm run draft:url <slug>`.
//
// Auto-détecte la collection (`blog` ou `projects`) et la langue depuis le
// frontmatter de l'entrée. Lit `DRAFT_HASH_SEED` via regex sur
// `src/utils/content.ts` pour rester aligné avec le code de build sans
// duplication de constante.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENT_ROOT = join(ROOT, 'src/content');
const COLLECTIONS = ['blog', 'projects'];
const HASH_LENGTH = 10;

function readDraftSeed() {
  const file = readFileSync(join(ROOT, 'src/utils/content.ts'), 'utf8');
  // Ancré sur `export const` pour ignorer les mentions du nom dans les
  // commentaires.
  const m = file.match(
    /export\s+const\s+DRAFT_HASH_SEED\s*=\s*['"]([^'"]+)['"]/
  );
  if (!m) {
    throw new Error(
      'DRAFT_HASH_SEED introuvable dans src/utils/content.ts (regex à mettre à jour ?)'
    );
  }
  return m[1];
}

function readSiteUrl() {
  const consts = readFileSync(join(ROOT, 'src/consts.ts'), 'utf8');
  const m = consts.match(/url:\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error('SITE.url introuvable dans src/consts.ts');
  return m[1].replace(/\/$/, '');
}

function parseFrontmatter(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const lang = fm.match(/^lang:\s*["']?([a-z-]+)["']?\s*$/m)?.[1] ?? 'fr';
  const draft = /^draft:\s*true\s*$/m.test(fm);
  return { lang, draft };
}

function findEntry(slug) {
  for (const collection of COLLECTIONS) {
    const dir = join(CONTENT_ROOT, collection);
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && e.name === slug) {
        const idxFile = ['index.mdx', 'index.md'].find((f) =>
          existsSync(join(dir, e.name, f))
        );
        if (!idxFile) continue;
        const raw = readFileSync(join(dir, e.name, idxFile), 'utf8');
        return { collection, slug: e.name, ...parseFrontmatter(raw) };
      }
      if (e.isFile() && /\.(md|mdx)$/.test(e.name)) {
        const fileSlug = e.name.replace(/\.(md|mdx)$/, '');
        if (fileSlug !== slug) continue;
        const raw = readFileSync(join(dir, e.name), 'utf8');
        return { collection, slug: fileSlug, ...parseFrontmatter(raw) };
      }
    }
  }
  return null;
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage : npm run draft:url <slug>');
    console.error('Exemple : npm run draft:url php-2026-cto-considerer');
    process.exit(1);
  }

  const entry = findEntry(slug);
  if (!entry) {
    console.error(`Article introuvable : ${slug}`);
    process.exit(1);
  }
  if (!entry.draft) {
    console.error(
      `L'article "${slug}" n'est pas en draft. Pas d'URL de prévisualisation.`
    );
    process.exit(1);
  }

  const seed = readDraftSeed();
  const hash = createHash('sha256')
    .update(slug + seed)
    .digest('hex')
    .slice(0, HASH_LENGTH);

  const baseUrl = readSiteUrl();
  const langPrefix = entry.lang === 'fr' ? '' : '/en';
  const url = `${baseUrl}${langPrefix}/${entry.collection}/_drafts/${hash}/${slug}/`;

  console.log(url);
}

main();
