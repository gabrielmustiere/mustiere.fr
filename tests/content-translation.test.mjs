// Verrou caractérisation pour le refacto 010-r-decouple-dossiers-frontmatter.
// Ces tests capturent le comportement ACTUEL de `pickTranslationLegacy` (la
// logique pure derrière `findTranslation`) :
//   1. Avec `translationOf` seul, la paire est trouvée (forward + reverse).
//   2. Avec `translationKey` seul, le match échoue aujourd'hui (champ non lu).
//   3. Avec les deux, `translationOf` est ce qui décide aujourd'hui.
//
// Les assertions « ignoré aujourd'hui » seront inversées aux étapes 4 et 10
// du plan ; le diff documentera alors la bascule par champ.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickTranslationLegacy } from '../src/utils/content-pure.ts';

// Fabrique d'entrée minimale matchant la forme { id, data: { translationOf?, translationKey? } }
function entry(id, data = {}) {
  return { id, data };
}

test('pickTranslationLegacy — translationOf forward (slug nu) retrouve la paire', () => {
  const fr = entry('fr/symfony-template');
  const en = entry('en/symfony-template', { translationOf: 'symfony-template' });
  // Forward : on cherche depuis l'EN qui pointe vers FR
  assert.equal(pickTranslationLegacy([fr], en), fr);
});

test('pickTranslationLegacy — translationOf reverse (déclaration d\'un seul côté)', () => {
  // Seule l'entrée EN porte `translationOf` ; depuis FR on doit quand même
  // retrouver l'EN via reverse-lookup. C'est la garantie défensive
  // documentée dans content.ts (« une seule déclaration suffit »).
  const fr = entry('fr/symfony-template');
  const en = entry('en/symfony-template', { translationOf: 'symfony-template' });
  assert.equal(pickTranslationLegacy([en], fr), en);
});

test('pickTranslationLegacy — translationOf forme id complet (legacy plat) retrouve la paire', () => {
  // Forme historique avant nestedByLang : translationOf référençait l'id
  // entier (ex. `symfony-template-en`). Le code accepte les deux formes.
  const fr = entry('symfony-template-fr');
  const en = entry('symfony-template-en', { translationOf: 'symfony-template-fr' });
  assert.equal(pickTranslationLegacy([fr], en), fr);
});

test('pickTranslationLegacy — translationKey seul est IGNORÉ aujourd\'hui (verrou bascule étape 4)', () => {
  // Comportement ACTUEL : le champ `translationKey` n'est pas lu par la
  // logique legacy. Sans `translationOf`, aucun match. Cette assertion
  // sera inversée à l'étape 4 du plan.
  const fr = entry('fr/symfony-template', { translationKey: 'symfony-template' });
  const en = entry('en/symfony-template', { translationKey: 'symfony-template' });
  assert.equal(pickTranslationLegacy([fr], en), undefined);
});

test('pickTranslationLegacy — quand translationOf et translationKey coexistent, translationOf décide aujourd\'hui (verrou bascule étape 4)', () => {
  // Comportement ACTUEL : `translationKey` est ignoré ; seule la chaîne
  // legacy via `translationOf` produit un match. Vérifie que la coexistence
  // ne casse rien pendant la phase Strangler (étapes 2-5).
  const fr = entry('fr/symfony-template', { translationKey: 'autre-key' });
  const en = entry('en/symfony-template', {
    translationOf: 'symfony-template',
    translationKey: 'autre-key',
  });
  assert.equal(pickTranslationLegacy([fr], en), fr);
});

test('pickTranslationLegacy — aucun match retourne undefined', () => {
  const fr = entry('fr/foo');
  const en = entry('en/bar', { translationOf: 'baz' });
  assert.equal(pickTranslationLegacy([fr], en), undefined);
});
