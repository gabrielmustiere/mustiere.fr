import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseResume,
  parseFaq,
  parseSources,
  discoverSectionFiles,
} from '../src/content-loaders/seo-sections.ts';

function withTmpDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'seo-sections-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(dir, name, contents) {
  const p = join(dir, name);
  writeFileSync(p, contents, 'utf-8');
  return p;
}

test('parseResume — markdown valide rendu en HTML + plain', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'resume.mdx',
      "Premier paragraphe avec **du gras** et *de l'italique*.\n\nDeuxième paragraphe avec un [lien](https://example.com)."
    );
    const r = parseResume(file);
    assert.match(
      r.html,
      /<p>Premier paragraphe avec <strong>du gras<\/strong>/
    );
    assert.match(r.html, /<a href="https:\/\/example\.com">lien<\/a>/);
    assert.equal(
      r.plain,
      "Premier paragraphe avec du gras et de l'italique. Deuxième paragraphe avec un lien."
    );
    assert.match(r.markdown, /Premier paragraphe/);
  });
});

test('parseResume — fichier vide rejeté', () => {
  withTmpDir((dir) => {
    const file = writeFile(dir, 'resume.mdx', '\n\n');
    assert.throws(() => parseResume(file), /est vide/);
  });
});

test('parseResume — résumé trop court rejeté', () => {
  withTmpDir((dir) => {
    const file = writeFile(dir, 'resume.mdx', 'Trop court.');
    assert.throws(() => parseResume(file), /minimum 60/);
  });
});

test('parseResume — frontmatter optionnel toléré et ignoré', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'resume.mdx',
      '---\nfoo: bar\n---\nUn résumé qui dépasse les soixante caractères pour passer le seuil minimal sans souci.'
    );
    const r = parseResume(file);
    assert.match(r.markdown, /^Un résumé qui dépasse/);
  });
});

test('parseFaq — frontmatter valide mappé question/answer', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'faq.mdx',
      "---\nquestions:\n  - q: Pourquoi PHP en 2026 ?\n    r: |\n      Parce que l'écosystème est mature.\n      Et performant.\n  - q: Quels frameworks ?\n    r: Symfony et Laravel.\n---\n"
    );
    const items = parseFaq(file);
    assert.equal(items.length, 2);
    assert.equal(items[0].question, 'Pourquoi PHP en 2026 ?');
    assert.match(items[0].answer, /^Parce que/);
    assert.equal(items[1].question, 'Quels frameworks ?');
    assert.equal(items[1].answer, 'Symfony et Laravel.');
  });
});

test('parseFaq — sans frontmatter rejeté', () => {
  withTmpDir((dir) => {
    const file = writeFile(dir, 'faq.mdx', 'Une intro libre seulement.');
    assert.throws(() => parseFaq(file), /frontmatter YAML obligatoire/);
  });
});

test('parseFaq — liste vide rejetée', () => {
  withTmpDir((dir) => {
    const file = writeFile(dir, 'faq.mdx', '---\nquestions: []\n---\n');
    assert.throws(() => parseFaq(file), /liste non vide/);
  });
});

test('parseFaq — q manquante rejeté avec numéro de question', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'faq.mdx',
      '---\nquestions:\n  - q: OK\n    r: Réponse 1\n  - r: Réponse sans question\n---\n'
    );
    assert.throws(() => parseFaq(file), /question #2.*`q`/);
  });
});

test('parseFaq — YAML invalide produit une erreur claire avec chemin', () => {
  withTmpDir((dir) => {
    const file = writeFile(dir, 'faq.mdx', '---\nquestions:\n  - q: ":\n---\n');
    assert.throws(
      () => parseFaq(file),
      (err) =>
        err.message.includes('frontmatter YAML invalide') &&
        err.message.includes(file)
    );
  });
});

test('parseSources — frontmatter valide avec champs optionnels', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'sources.mdx',
      '---\nsources:\n  - titre: Source A\n    url: https://example.com/a\n  - titre: Source B\n    url: https://example.com/b\n    auteur: Jane Doe\n    date: 2025-06-15\n---\n'
    );
    const items = parseSources(file);
    assert.equal(items.length, 2);
    assert.deepEqual(items[0], {
      title: 'Source A',
      url: 'https://example.com/a',
    });
    assert.deepEqual(items[1], {
      title: 'Source B',
      url: 'https://example.com/b',
      author: 'Jane Doe',
      date: '2025-06-15',
    });
  });
});

test('parseSources — accepte aussi `title`/`author` en anglais', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'sources.mdx',
      '---\nsources:\n  - title: English source\n    url: https://example.com\n    author: J. Smith\n---\n'
    );
    const items = parseSources(file);
    assert.equal(items[0].title, 'English source');
    assert.equal(items[0].author, 'J. Smith');
  });
});

test('parseSources — URL invalide rejetée', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'sources.mdx',
      '---\nsources:\n  - titre: Mauvaise source\n    url: pas-une-url\n---\n'
    );
    assert.throws(() => parseSources(file), /URL invalide/);
  });
});

test('parseSources — date au mauvais format rejetée', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'sources.mdx',
      '---\nsources:\n  - titre: S\n    url: https://e.com\n    date: "15/06/2025"\n---\n'
    );
    assert.throws(() => parseSources(file), /YYYY-MM-DD/);
  });
});

test('parseSources — date YAML auto-coercée en Date acceptée', () => {
  withTmpDir((dir) => {
    const file = writeFile(
      dir,
      'sources.mdx',
      '---\nsources:\n  - titre: S\n    url: https://e.com\n    date: 2025-06-15\n---\n'
    );
    const items = parseSources(file);
    assert.equal(items[0].date, '2025-06-15');
  });
});

test('discoverSectionFiles — détecte uniquement les fichiers présents', () => {
  withTmpDir((dir) => {
    writeFile(
      dir,
      'resume.mdx',
      'Un résumé qui dépasse les soixante caractères pour passer le seuil minimal sans souci.'
    );
    writeFile(dir, 'faq.mdx', '---\nquestions:\n  - q: ?\n    r: !\n---\n');
    const found = discoverSectionFiles(dir);
    assert.ok(found.resume);
    assert.ok(found.faq);
    assert.equal(found.sources, undefined);
  });
});
