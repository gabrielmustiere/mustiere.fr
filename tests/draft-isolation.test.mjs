import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Test d'isolation des pages draft (cf. plan 008-t-draft-preview-urls).
// Vérifie que :
//   - chaque draft est généré sous /<collection>/_drafts/<hash>/<slug>/
//     en build prod (la seed est hardcodée dans src/utils/content.ts) ;
//   - le slug n'apparaît dans aucun listing public (sitemap, RSS, llms.txt,
//     index HTML des sections) ;
//   - le path canonique reste 404 ;
//   - la page draft contient `noindex,nofollow` ;
//   - robots.txt bloque /<collection>/_drafts/.

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

// Lit la seed via regex sur le code de build pour rester aligné sans
// duplication. Ancré sur `export const` pour ignorer les mentions du nom
// dans les commentaires.
function readDraftSeed() {
  const file = readFileSync(join(ROOT, 'src/utils/content.ts'), 'utf8');
  const m = file.match(
    /export\s+const\s+DRAFT_HASH_SEED\s*=\s*['"]([^'"]+)['"]/
  );
  assert.ok(
    m,
    'DRAFT_HASH_SEED introuvable dans src/utils/content.ts — regex à mettre à jour'
  );
  return m[1];
}

const SEED = readDraftSeed();

function hashFor(slug) {
  return createHash('sha256')
    .update(slug + SEED)
    .digest('hex')
    .slice(0, 10);
}

// Liste hardcodée des drafts à couvrir par les assertions par-slug. Vide
// quand aucun article n'est `draft: true` dans `src/content/` — seul le test
// robots.txt s'exécute alors. Mettre à jour quand un draft est ajouté ou
// publié (cf. report.md du plan 008-t-draft-preview-urls, point sur la
// fragilité de la liste hardcodée).
const DRAFTS = [];

function langPrefix(lang) {
  return lang === 'fr' ? '' : '/en';
}

function draftPath(d) {
  return join(
    DIST,
    langPrefix(d.lang),
    d.collection,
    '_drafts',
    hashFor(d.slug),
    d.slug,
    'index.html'
  );
}

function canonicalPath(d) {
  return join(DIST, langPrefix(d.lang), d.collection, d.slug, 'index.html');
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function build() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
}

before(build, { timeout: 180000 });

for (const d of DRAFTS) {
  test(`draft ${d.collection}/${d.slug} (${d.lang}) — page générée sous /_drafts/<hash>/`, () => {
    const path = draftPath(d);
    assert.ok(existsSync(path), `Page draft attendue absente : ${path}`);
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — path canonique reste 404`, () => {
    const path = canonicalPath(d);
    assert.ok(
      !existsSync(path),
      `Path canonique d'un draft ne doit pas exister : ${path}`
    );
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — slug absent des sitemap-*.xml`, () => {
    const sitemaps = readdirSync(DIST).filter(
      (f) => f.startsWith('sitemap-') && f.endsWith('.xml')
    );
    assert.ok(sitemaps.length > 0, 'aucun sitemap trouvé');
    const needle = `/${d.collection}/${d.slug}/`;
    for (const f of sitemaps) {
      const content = readFileSync(join(DIST, f), 'utf8');
      assert.ok(
        !content.includes(needle),
        `${f} contient le slug ${d.slug} (pattern ${needle})`
      );
    }
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — slug absent des RSS`, () => {
    const files = [join(DIST, 'rss.xml'), join(DIST, 'en', 'rss.xml')];
    const needle = `/${d.collection}/${d.slug}/`;
    for (const f of files) {
      const content = readIfExists(f);
      if (!content) continue;
      assert.ok(!content.includes(needle), `${f} contient ${needle}`);
    }
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — slug absent de llms.txt et llms-full.txt`, () => {
    const files = [
      join(DIST, 'llms.txt'),
      join(DIST, 'llms-full.txt'),
      join(DIST, 'en', 'llms.txt'),
      join(DIST, 'en', 'llms-full.txt'),
    ];
    const needle = `/${d.collection}/${d.slug}/`;
    for (const f of files) {
      const content = readIfExists(f);
      if (!content) continue;
      assert.ok(!content.includes(needle), `${f} contient ${needle}`);
    }
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — slug absent des listings HTML`, () => {
    const listings = [
      join(DIST, 'index.html'),
      join(DIST, 'blog', 'index.html'),
      join(DIST, 'projects', 'index.html'),
      join(DIST, 'en', 'index.html'),
      join(DIST, 'en', 'blog', 'index.html'),
      join(DIST, 'en', 'projects', 'index.html'),
    ];
    const needle = `/${d.collection}/${d.slug}/`;
    for (const f of listings) {
      const content = readIfExists(f);
      if (!content) continue;
      assert.ok(!content.includes(needle), `${f} contient ${needle}`);
    }
  });

  test(`draft ${d.collection}/${d.slug} (${d.lang}) — page draft contient noindex,nofollow`, () => {
    const path = draftPath(d);
    const content = readIfExists(path);
    if (!content) return; // l'absence de la page est déjà signalée par un autre test
    assert.match(
      content,
      /name="robots"\s+content="noindex,\s*nofollow"/i,
      `Meta robots noindex,nofollow attendue dans ${path}`
    );
  });
}

test('robots.txt — Disallow sur les préfixes _drafts/', () => {
  const content = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  for (const path of [
    '/blog/_drafts/',
    '/en/blog/_drafts/',
    '/projects/_drafts/',
    '/en/projects/_drafts/',
  ]) {
    assert.ok(
      content.includes(`Disallow: ${path}`),
      `robots.txt manque "Disallow: ${path}"`
    );
  }
});
