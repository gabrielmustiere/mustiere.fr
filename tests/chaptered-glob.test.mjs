import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripOrderPrefix } from '../src/content-loaders/order-prefix.ts';
import {
  assertLangMatchesParent,
  createPublicSlugClaimer,
} from '../src/content-loaders/lang-validation.ts';
import { validateTranslationKeyCardinality } from '../src/content-loaders/translation-cardinality.mjs';

test('stripOrderPrefix — retire un préfixe numérique suivi d’un tiret', () => {
  assert.equal(stripOrderPrefix('001-foo'), 'foo');
  assert.equal(stripOrderPrefix('01-twig-components'), 'twig-components');
  assert.equal(stripOrderPrefix('9-bar'), 'bar');
});

test('stripOrderPrefix — laisse un nom sans préfixe inchangé', () => {
  assert.equal(
    stripOrderPrefix('symfony-avant-ux-inventaire'),
    'symfony-avant-ux-inventaire'
  );
  assert.equal(stripOrderPrefix('foo-001-bar'), 'foo-001-bar');
});

test('stripOrderPrefix — ne touche pas un nom commençant par un chiffre sans tiret', () => {
  assert.equal(stripOrderPrefix('2026bilan'), '2026bilan');
});

test('stripOrderPrefix — préserve un slug commençant par une année (4+ chiffres)', () => {
  // Garde-fou : on ne veut pas que `2026-bilan/` devienne `/blog/bilan/`.
  assert.equal(stripOrderPrefix('2026-bilan'), '2026-bilan');
  assert.equal(stripOrderPrefix('1999-retrospective'), '1999-retrospective');
});

test('assertLangMatchesParent — match exact passe', () => {
  assert.doesNotThrow(() =>
    assertLangMatchesParent({ lang: 'fr' }, 'fr', '/x/fr/foo/index.mdx')
  );
  assert.doesNotThrow(() =>
    assertLangMatchesParent({ lang: 'en' }, 'en', '/x/en/foo/index.mdx')
  );
});

test('assertLangMatchesParent — sans expectedLang (forme plate), tout passe', () => {
  assert.doesNotThrow(() =>
    assertLangMatchesParent({ lang: 'en' }, null, '/x/foo.mdx')
  );
});

test('assertLangMatchesParent — absent sous fr/ tolère (défaut Zod fr)', () => {
  assert.doesNotThrow(() =>
    assertLangMatchesParent({}, 'fr', '/x/fr/foo/index.mdx')
  );
});

test('assertLangMatchesParent — absent sous en/ rejette (défault Zod ferait fr)', () => {
  assert.throws(
    () => assertLangMatchesParent({}, 'en', '/x/en/foo/index.mdx'),
    /mismatch lang ↔ dossier parent/
  );
});

test('assertLangMatchesParent — mismatch explicite rejette avec chemin et valeurs', () => {
  assert.throws(
    () => assertLangMatchesParent({ lang: 'fr' }, 'en', '/x/en/foo/index.mdx'),
    /lang="fr".*"en\/"/s
  );
});

test('createPublicSlugClaimer — claim unique par (lang, slug) passe', () => {
  const claim = createPublicSlugClaimer();
  assert.doesNotThrow(() => claim('fr', 'foo', '/x/fr/foo'));
  assert.doesNotThrow(() => claim('en', 'foo', '/x/en/foo')); // même slug, lang différente
  assert.doesNotThrow(() => claim('fr', 'bar', '/x/fr/bar'));
});

test('createPublicSlugClaimer — deux entrées même (lang, slug) lèvent avec les deux chemins', () => {
  const claim = createPublicSlugClaimer();
  claim('fr', 'foo', '/x/fr/001-foo/index.mdx');
  assert.throws(
    () => claim('fr', 'foo', '/x/fr/archive/legacy-foo/index.mdx'),
    /collision de slug public "fr\/foo".*001-foo.*legacy-foo/s
  );
});

test('validateTranslationKeyCardinality — 0 entrée avec key passe', () => {
  assert.doesNotThrow(() =>
    validateTranslationKeyCardinality([
      ['blog/fr/foo', { lang: 'fr', dirPath: '/x/fr/foo' }],
      ['blog/fr/bar', { lang: 'fr', dirPath: '/x/fr/bar' }],
    ])
  );
});

test('validateTranslationKeyCardinality — paire FR + EN passe', () => {
  assert.doesNotThrow(() =>
    validateTranslationKeyCardinality([
      [
        'blog/fr/foo',
        { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/foo' },
      ],
      [
        'blog/en/foo',
        { lang: 'en', translationKey: 'k1', dirPath: '/x/en/foo' },
      ],
    ])
  );
});

test('validateTranslationKeyCardinality — 1 seule entrée avec key (orphelin avec key) lève', () => {
  assert.throws(
    () =>
      validateTranslationKeyCardinality([
        [
          'blog/fr/foo',
          { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/foo' },
        ],
      ]),
    /porté par 1 entrée\(s\) — attendu 0.*ou 2/s
  );
});

test('validateTranslationKeyCardinality — 3 entrées avec même key lève', () => {
  assert.throws(
    () =>
      validateTranslationKeyCardinality([
        [
          'blog/fr/foo',
          { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/foo' },
        ],
        [
          'blog/en/foo',
          { lang: 'en', translationKey: 'k1', dirPath: '/x/en/foo' },
        ],
        [
          'blog/fr/bar',
          { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/bar' },
        ],
      ]),
    /porté par 3 entrée/
  );
});

test('validateTranslationKeyCardinality — 2 entrées même lang lève (pas une paire valide)', () => {
  assert.throws(
    () =>
      validateTranslationKeyCardinality([
        [
          'blog/fr/foo',
          { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/foo' },
        ],
        [
          'blog/fr/bar',
          { lang: 'fr', translationKey: 'k1', dirPath: '/x/fr/bar' },
        ],
      ]),
    /2 entrées de la même lang \(fr\)/
  );
});
