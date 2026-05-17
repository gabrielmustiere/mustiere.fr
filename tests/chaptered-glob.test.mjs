import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripOrderPrefix } from '../src/content-loaders/order-prefix.ts';
import { assertLangMatchesParent } from '../src/content-loaders/lang-validation.ts';

test('stripOrderPrefix — retire un préfixe numérique suivi d’un tiret', () => {
  assert.equal(stripOrderPrefix('001-foo'), 'foo');
  assert.equal(stripOrderPrefix('01-twig-components'), 'twig-components');
  assert.equal(stripOrderPrefix('9-bar'), 'bar');
});

test('stripOrderPrefix — laisse un nom sans préfixe inchangé', () => {
  assert.equal(stripOrderPrefix('symfony-avant-ux-inventaire'), 'symfony-avant-ux-inventaire');
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
    () =>
      assertLangMatchesParent(
        { lang: 'fr' },
        'en',
        '/x/en/foo/index.mdx'
      ),
    /lang="fr".*"en\/"/s
  );
});
