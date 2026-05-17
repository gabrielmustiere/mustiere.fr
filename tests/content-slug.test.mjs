// Tests de `publicSlug` après bascule stricte (refacto 010 étape 10).
// `data.slug` est requis par Zod, donc publicSlug se contente de le lire —
// plus de fallback sur `entry.id`. Les tests historiques sur le fallback
// dossier ont été retirés en même temps que la branche de code qui les
// implémentait.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicSlug } from '../src/utils/content-pure.ts';

test('publicSlug — retourne data.slug (source de vérité unique)', () => {
  assert.equal(
    publicSlug({ data: { slug: 'symfony-template' } }),
    'symfony-template'
  );
  assert.equal(
    publicSlug({ data: { slug: 'building-this-site-with-claude-and-astro' } }),
    'building-this-site-with-claude-and-astro'
  );
});

test('publicSlug — data.slug est indépendant de tout id éventuel (le slug ne dérive plus du chemin disque)', () => {
  // L'absence de fallback est ce qui rend possible le renommage d'un dossier
  // d'entrée sans casser l'URL : `publicSlug` ne regarde plus l'`id` du tout.
  const entry = { data: { slug: 'mon-slug-stable' } };
  assert.equal(publicSlug(entry), 'mon-slug-stable');
});
