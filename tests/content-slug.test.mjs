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

test('publicSlug — avec data.slug, retourne data.slug (prioritaire sur le nom de dossier)', () => {
  // Bascule étape 3 du refacto 010 : `data.slug` est désormais source de
  // vérité. Le nom de dossier n'est plus que fallback (et disparaîtra à
  // l'étape 10 quand le champ deviendra obligatoire).
  const entry = { id: 'fr/foo', data: { slug: 'bar-different' } };
  assert.equal(publicSlug(entry), 'bar-different');
});

test('publicSlug — data.slug vide ou absent → fallback dossier (étape 3, fallback temporaire jusqu\'à étape 10)', () => {
  // Le fallback reste actif tant que `slug` n'est pas requis dans Zod.
  // À l'étape 10 ce test sera supprimé (le champ devient obligatoire,
  // la branche du fallback disparaît).
  assert.equal(publicSlug({ id: 'fr/foo', data: {} }), 'foo');
  assert.equal(publicSlug({ id: 'fr/foo' }), 'foo');
});
