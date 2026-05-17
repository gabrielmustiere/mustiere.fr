import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripOrderPrefix } from '../src/content-loaders/order-prefix.ts';

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
