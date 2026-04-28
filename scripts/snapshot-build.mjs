#!/usr/bin/env node
// Archive byte-à-byte du `dist/` après deux builds : prod (sans drafts) et
// with-drafts (drafts visibles). Filet de non-régression pour le refacto
// 004-r-mdx-chapter-split — toute migration de contenu doit produire un
// `dist/` identique au snapshot de référence (au `<lastmod>` près).
//
// Usage : node scripts/snapshot-build.mjs <name>
// Sortie : tmp/snapshot/<name>/{prod,with-drafts}/

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const name = process.argv[2];
if (!name) {
  console.error('Usage : node scripts/snapshot-build.mjs <name>');
  process.exit(1);
}

const root = process.cwd();
const distPath = join(root, 'dist');
const targetBase = join(root, 'tmp', 'snapshot', name);

if (existsSync(targetBase)) {
  console.log(`[snapshot] Réinitialisation de ${targetBase}`);
  rmSync(targetBase, { recursive: true });
}
mkdirSync(targetBase, { recursive: true });

function build(env) {
  if (existsSync(distPath)) rmSync(distPath, { recursive: true });
  execSync('npm run build', {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

console.log(`[snapshot] Build prod (drafts exclus)`);
build({});
cpSync(distPath, join(targetBase, 'prod'), { recursive: true });

console.log(`[snapshot] Build with-drafts (SHOW_DRAFTS=1)`);
build({ SHOW_DRAFTS: '1' });
cpSync(distPath, join(targetBase, 'with-drafts'), { recursive: true });

console.log(`[snapshot] Snapshot prêt : ${targetBase}`);
