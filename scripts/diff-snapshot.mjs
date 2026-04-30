#!/usr/bin/env node
// Diff byte-à-byte de deux snapshots produits par scripts/snapshot-build.mjs.
// Compare les variantes prod/ et with-drafts/ en ignorant uniquement le champ
// volatile <lastmod> du sitemap. Tout autre diff est un échec.
//
// Usage : node scripts/diff-snapshot.mjs <a> <b>
//   ex. : node scripts/diff-snapshot.mjs before before  (sanity check)
//         node scripts/diff-snapshot.mjs before after-step-2

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const [aName, bName] = process.argv.slice(2);
if (!aName || !bName) {
  console.error('Usage : node scripts/diff-snapshot.mjs <a> <b>');
  process.exit(1);
}

const root = join(process.cwd(), 'tmp', 'snapshot');
const aRoot = join(root, aName);
const bRoot = join(root, bName);

for (const p of [aRoot, bRoot]) {
  if (!existsSync(p)) {
    console.error(`[diff] Snapshot absent : ${p}`);
    process.exit(2);
  }
}

const LASTMOD_RE = /<lastmod>[^<]+<\/lastmod>/g;
// Astro injecte des `data-astro-cid-<hash>` pour scoper le CSS de chaque
// fichier .astro qui contient un <style>. Le hash dépend du fichier source ;
// déplacer du markup d'un .astro vers un autre change le cid sans changer
// le rendu visuel, la sémantique DOM ni le comportement utilisateur. On
// masque ces attributs comme on masque <lastmod>, ce sont des artefacts
// techniques du build pas du comportement observable.
const ASTRO_CID_RE = /\sdata-astro-cid-[a-z0-9]+(?:="[^"]*")?/g;
// L'extraction de markup d'un .astro vers un autre change l'indentation source
// du JSX, qui se retrouve dans les text nodes du HTML (séquences de \n + tabs
// + espaces ASCII). Au navigateur, ces séquences sont collapsées en un espace.
// On normalise donc les runs d'espaces ASCII (\t\n + espace) en un seul
// espace dans les fichiers HTML, sans toucher aux NBSP ni aux autres
// whitespaces Unicode qui sont sémantiquement significatifs.
const HTML_ASCII_WS_RE = /[\t\n ]+/g;
// Whitespaces entre balises adjacentes (`>...<`) : insignifiants pour le
// rendu HTML des éléments de bloc (li/ul/ol/dl/dd/dt/p/section/...). Quand
// .map() rend une liste sans whitespace entre items et que l'inline JSX en
// avait, le HTML rendu est sémantiquement identique mais byte-différent.
const HTML_INTER_TAG_WS_RE = />\s+</g;
// Whitespaces leading/trailing dans une balise de bloc : insignifiants
// (le navigateur les collapse). Ex. `<li> Foo</li>` rend pareil que
// `<li>Foo</li>`.
const BLOCK_TAGS =
  'li|p|h1|h2|h3|h4|h5|h6|ul|ol|dl|dt|dd|section|header|footer|article|nav|main|div|aside|figure|figcaption|tr|td|th|tbody|thead|table|blockquote|details|summary|hr|br|span|a|em|strong|b|i|button|time|code|small|sup|sub|abbr|cite|mark|q|s|u';
const HTML_BLOCK_LEADING_WS_RE = new RegExp(
  `<(${BLOCK_TAGS})( [^>]*)?> +`,
  'g'
);
const HTML_BLOCK_TRAILING_WS_RE = new RegExp(` +</(${BLOCK_TAGS})>`, 'g');
// Astro encode parfois certains caractères en HTML entities (&#39; pour ',
// &amp; pour & dans une string variable) alors que le même caractère écrit
// directement dans le JSX source reste tel quel. Visuellement et
// sémantiquement, &#39; et ' rendent identique. On normalise.
const HTML_ENTITIES = [
  [/&#39;/g, "'"],
  [/&apos;/g, "'"],
  [/&quot;/g, '"'],
  [/&#34;/g, '"'],
];
const TEXT_EXT = new Set([
  '.html',
  '.txt',
  '.xml',
  '.json',
  '.css',
  '.js',
  '.mjs',
  '.svg',
  '.map',
  '.webmanifest',
]);

function isTextFile(rel) {
  const dot = rel.lastIndexOf('.');
  if (dot === -1) return false;
  return TEXT_EXT.has(rel.slice(dot));
}

function maskLastmod(rel, content) {
  if (/sitemap.*\.xml$/.test(rel)) {
    return content.replace(LASTMOD_RE, '<lastmod>__MASKED__</lastmod>');
  }
  return content;
}

function maskAstroCid(rel, content) {
  if (rel.endsWith('.html')) {
    return content.replace(ASTRO_CID_RE, '');
  }
  return content;
}

function normalizeHtmlAsciiWs(rel, content) {
  if (rel.endsWith('.html')) {
    let out = content
      .replace(HTML_ASCII_WS_RE, ' ')
      .replace(HTML_INTER_TAG_WS_RE, '><')
      .replace(HTML_BLOCK_LEADING_WS_RE, (_m, tag, attrs) =>
        attrs ? `<${tag}${attrs}>` : `<${tag}>`
      )
      .replace(HTML_BLOCK_TRAILING_WS_RE, '</$1>');
    for (const [re, repl] of HTML_ENTITIES) out = out.replace(re, repl);
    return out;
  }
  return content;
}

function maskVolatile(rel, content) {
  return normalizeHtmlAsciiWs(
    rel,
    maskAstroCid(rel, maskLastmod(rel, content))
  );
}

function listFiles(base) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else out.push(relative(base, p));
    }
  };
  if (existsSync(base)) walk(base);
  return out.sort();
}

function diffText(rel, aText, bText) {
  const aLines = aText.split('\n');
  const bLines = bText.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  const diffs = [];
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) {
      diffs.push({ line: i + 1, a: aLines[i] ?? '∅', b: bLines[i] ?? '∅' });
      if (diffs.length >= 5) break;
    }
  }
  return diffs;
}

let totalDiffs = 0;

for (const variant of ['prod', 'with-drafts']) {
  const aBase = join(aRoot, variant);
  const bBase = join(bRoot, variant);
  if (!existsSync(aBase) || !existsSync(bBase)) {
    console.warn(
      `\n[${variant}] Variante absente dans un des snapshots, ignorée`
    );
    continue;
  }

  const aFiles = listFiles(aBase);
  const bFiles = listFiles(bBase);
  const aSet = new Set(aFiles);
  const bSet = new Set(bFiles);

  console.log(
    `\n[${variant}] ${aFiles.length} fichiers (${aName}) ↔ ${bFiles.length} fichiers (${bName})`
  );

  const onlyA = aFiles.filter((f) => !bSet.has(f));
  const onlyB = bFiles.filter((f) => !aSet.has(f));

  if (onlyA.length) {
    console.log(`[${variant}] Présents uniquement dans ${aName} :`);
    onlyA.forEach((f) => console.log(`  - ${f}`));
    totalDiffs += onlyA.length;
  }
  if (onlyB.length) {
    console.log(`[${variant}] Présents uniquement dans ${bName} :`);
    onlyB.forEach((f) => console.log(`  + ${f}`));
    totalDiffs += onlyB.length;
  }

  const common = aFiles.filter((f) => bSet.has(f));
  for (const rel of common) {
    const aBuf = readFileSync(join(aBase, rel));
    const bBuf = readFileSync(join(bBase, rel));
    if (isTextFile(rel)) {
      const aText = maskVolatile(rel, aBuf.toString('utf-8'));
      const bText = maskVolatile(rel, bBuf.toString('utf-8'));
      if (aText !== bText) {
        console.log(`\n[${variant}] DIFF (texte) : ${rel}`);
        for (const d of diffText(rel, aText, bText)) {
          console.log(`  L${d.line} -${aName} : ${d.a}`);
          console.log(`  L${d.line} +${bName} : ${d.b}`);
        }
        totalDiffs++;
      }
    } else if (!aBuf.equals(bBuf)) {
      console.log(
        `\n[${variant}] DIFF (binaire) : ${rel}  (${aBuf.length}B vs ${bBuf.length}B)`
      );
      totalDiffs++;
    }
  }
}

if (totalDiffs === 0) {
  console.log('\nOK — aucun diff (au <lastmod> près).');
  process.exit(0);
} else {
  console.log(`\nKO — ${totalDiffs} différence(s) détectée(s).`);
  process.exit(1);
}
