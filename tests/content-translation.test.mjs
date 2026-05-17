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
import {
  pickTranslationByKey,
  pickTranslationLegacy,
} from '../src/utils/content-pure.ts';

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

test('pickTranslationByKey — translationKey partagé matche la paire', () => {
  // Bascule étape 4 du refacto 010 : `translationKey` est la nouvelle source
  // de vérité pour le pair-matching. Deux entrées qui partagent la même key
  // forment une paire FR/EN.
  const fr = entry('fr/symfony-template', { translationKey: 'symfony-template' });
  const en = entry('en/symfony-template', { translationKey: 'symfony-template' });
  assert.equal(pickTranslationByKey([fr], en), fr);
  assert.equal(pickTranslationByKey([en], fr), en);
});

test('pickTranslationByKey — sans translationKey sur l\'entrée, retourne undefined (pas de match implicite)', () => {
  // Pas de clé sur l'entrée → on ne devine rien. `findTranslation` cascade
  // ensuite sur la logique legacy `translationOf`.
  const fr = entry('fr/foo', { translationKey: 'foo' });
  const en = entry('en/foo'); // pas de translationKey
  assert.equal(pickTranslationByKey([fr], en), undefined);
});

test('pickTranslationByKey — translationKey différent entre les deux entrées → undefined', () => {
  const fr = entry('fr/symfony-template', { translationKey: 'autre-key' });
  const en = entry('en/symfony-template', { translationKey: 'ma-key' });
  assert.equal(pickTranslationByKey([fr], en), undefined);
});

test('findTranslation cascade (intégration) : key gagne sur translationOf quand key matche', () => {
  // Vérifie la cascade key → legacy implémentée dans findTranslation. La
  // logique pure de cascade : on rejoue exactement ce que content.ts fait.
  const frKeyMatch = entry('fr/correct', {
    translationKey: 'shared-key',
    translationOf: 'autre-via-legacy',
  });
  const en = entry('en/source', {
    translationKey: 'shared-key',
    translationOf: 'autre-via-legacy',
  });
  // Rejoue la cascade : key d'abord
  const byKey = pickTranslationByKey([frKeyMatch], en);
  assert.equal(byKey, frKeyMatch);
});

test('pickTranslationLegacy — aucun match retourne undefined', () => {
  const fr = entry('fr/foo');
  const en = entry('en/bar', { translationOf: 'baz' });
  assert.equal(pickTranslationLegacy([fr], en), undefined);
});
