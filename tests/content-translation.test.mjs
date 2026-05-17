// Tests de `pickTranslationByKey` après bascule stricte (refacto 010
// étape 10). `translationOf` a été retiré du schéma Zod et du code ;
// `pickTranslationLegacy` n'existe plus. Seul `translationKey` matche
// les paires.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickTranslationByKey } from '../src/utils/content-pure.ts';

function entry(id, data = {}) {
  return { id, data };
}

test('pickTranslationByKey — translationKey partagé matche la paire (forward + reverse)', () => {
  const fr = entry('fr/symfony-template', {
    translationKey: 'symfony-template',
  });
  const en = entry('en/symfony-template', {
    translationKey: 'symfony-template',
  });
  assert.equal(pickTranslationByKey([fr], en), fr);
  assert.equal(pickTranslationByKey([en], fr), en);
});

test("pickTranslationByKey — sans translationKey sur l'entrée → undefined", () => {
  // Orphelin sans key : pas de pair-matching automatique. L'invariant
  // de cardinalité strict (0 ou 2) validé au build garantit qu'aucune
  // entrée avec key n'est seule.
  const fr = entry('fr/foo', { translationKey: 'foo' });
  const en = entry('en/foo'); // pas de translationKey
  assert.equal(pickTranslationByKey([fr], en), undefined);
});

test('pickTranslationByKey — translationKey différent entre les deux entrées → undefined', () => {
  const fr = entry('fr/foo', { translationKey: 'autre-key' });
  const en = entry('en/foo', { translationKey: 'ma-key' });
  assert.equal(pickTranslationByKey([fr], en), undefined);
});

test('pickTranslationByKey — aucun candidat → undefined', () => {
  const en = entry('en/foo', { translationKey: 'k1' });
  assert.equal(pickTranslationByKey([], en), undefined);
});
