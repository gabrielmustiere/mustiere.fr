// Verrou caractérisation pour le refacto 010-r-decouple-dossiers-frontmatter.
// Ces tests capturent le comportement ACTUEL de `publicSlug` afin de servir
// de filet pendant l'introduction de `data.slug` (Strangler Fig).
//
// Au moment où le code lit `entry.data.slug` (étape 3 du plan), les
// assertions « ignoré aujourd'hui » devront être inversées dans le même
// commit que le changement de comportement — le diff documentera alors
// précisément la bascule.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicSlug } from '../src/utils/content-pure.ts';

test('publicSlug — sans data.slug, retourne la dernière section de entry.id', () => {
  assert.equal(publicSlug({ id: 'fr/symfony-template' }), 'symfony-template');
  assert.equal(
    publicSlug({ id: 'en/building-this-site-with-claude-and-astro' }),
    'building-this-site-with-claude-and-astro'
  );
  // Cas plat (sans préfixe nestedByLang)
  assert.equal(publicSlug({ id: 'live-components-symfony' }), 'live-components-symfony');
});

test('publicSlug — avec data.slug différent, ignore data.slug aujourd\'hui (verrou bascule étape 3)', () => {
  // Comportement ACTUEL : `publicSlug` ne lit pas `data.slug`. Cette assertion
  // sera inversée à l'étape 3 du plan ; tant qu'elle est ici, on a la preuve
  // qu'aucun caller ne dérive vers le nouveau chemin avant l'heure.
  const entry = { id: 'fr/foo', data: { slug: 'bar-different' } };
  assert.equal(publicSlug(entry), 'foo');
});
