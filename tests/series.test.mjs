import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSeriesGraph,
  getSeriesContext,
  buildSeriesIndex,
  sortArchive,
} from '../src/utils/series.ts';

function blog(id, data) {
  return {
    id,
    data: {
      title: id,
      publishedAt: new Date('2025-01-01'),
      ...data,
    },
  };
}

function series(id, data = {}) {
  return {
    id,
    data: {
      title: id,
      description:
        'Description de série suffisamment longue pour passer le seuil minimal de validation.',
      ...data,
    },
  };
}

test('validateSeriesGraph — référence à une série inexistante (même lang) lance', () => {
  const articles = [
    blog('fr/foo', { lang: 'fr', series: 'inexistante', seriesOrder: 1 }),
  ];
  const seriesEntries = [series('fr/autre', { lang: 'fr' })];
  assert.throws(
    () => validateSeriesGraph(articles, seriesEntries),
    /référence la série "inexistante"/
  );
});

test('validateSeriesGraph — mismatch de langue entre article et série lance', () => {
  // L'article EN cite une série qui n'existe que côté FR : la clé
  // (en/symfony) n'est pas dans l'index, donc échec attendu.
  const articles = [
    blog('en/foo', { lang: 'en', series: 'symfony', seriesOrder: 1 }),
  ];
  const seriesEntries = [series('fr/symfony', { lang: 'fr' })];
  assert.throws(
    () => validateSeriesGraph(articles, seriesEntries),
    /n'existe pas dans la langue "en"/
  );
});

test('validateSeriesGraph — seriesOrder dupliqué entre deux publiés lance', () => {
  const articles = [
    blog('fr/a', { lang: 'fr', series: 'foo', seriesOrder: 2 }),
    blog('fr/b', { lang: 'fr', series: 'foo', seriesOrder: 2 }),
  ];
  const seriesEntries = [series('fr/foo', { lang: 'fr' })];
  assert.throws(
    () => validateSeriesGraph(articles, seriesEntries),
    /seriesOrder=2 dupliqué/
  );
});

test('validateSeriesGraph — draft avec ordre dupliqué passe (réserve sa position)', () => {
  const articles = [
    blog('fr/a', { lang: 'fr', series: 'foo', seriesOrder: 1 }),
    blog('fr/b', {
      lang: 'fr',
      series: 'foo',
      seriesOrder: 1,
      draft: true,
    }),
  ];
  const seriesEntries = [series('fr/foo', { lang: 'fr' })];
  assert.doesNotThrow(() => validateSeriesGraph(articles, seriesEntries));
});

test('validateSeriesGraph — cas valide ne lance pas', () => {
  const articles = [
    blog('fr/a', { lang: 'fr', series: 'foo', seriesOrder: 1 }),
    blog('fr/b', { lang: 'fr', series: 'foo', seriesOrder: 2 }),
    blog('fr/c', { lang: 'fr' }), // hors série
    blog('en/a', { lang: 'en', series: 'foo-en', seriesOrder: 1 }),
  ];
  const seriesEntries = [
    series('fr/foo', { lang: 'fr' }),
    series('en/foo-en', { lang: 'en' }),
  ];
  assert.doesNotThrow(() => validateSeriesGraph(articles, seriesEntries));
});

test('getSeriesContext — article hors série retourne null', () => {
  const a = blog('fr/foo', { lang: 'fr' });
  const ctx = getSeriesContext(a, [a], []);
  assert.equal(ctx, null);
});

test('getSeriesContext — article seul publié de sa série', () => {
  const a = blog('fr/a', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const s = series('fr/foo', { lang: 'fr' });
  const ctx = getSeriesContext(a, [a], [s]);
  assert.ok(ctx);
  assert.equal(ctx.position, 1);
  assert.equal(ctx.total, 1);
  assert.equal(ctx.isFirst, true);
  assert.equal(ctx.prev, null);
  assert.equal(ctx.next, null);
  assert.equal(ctx.firstEpisode.id, 'fr/a');
});

test('getSeriesContext — article au milieu, prev/next bons', () => {
  const a1 = blog('fr/a1', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const a2 = blog('fr/a2', { lang: 'fr', series: 'foo', seriesOrder: 2 });
  const a3 = blog('fr/a3', { lang: 'fr', series: 'foo', seriesOrder: 3 });
  const s = series('fr/foo', { lang: 'fr' });
  const ctx = getSeriesContext(a2, [a1, a2, a3], [s]);
  assert.ok(ctx);
  assert.equal(ctx.position, 2);
  assert.equal(ctx.total, 3);
  assert.equal(ctx.isFirst, false);
  assert.equal(ctx.prev?.id, 'fr/a1');
  assert.equal(ctx.next?.id, 'fr/a3');
});

test('getSeriesContext — saute les drafts dans next/prev', () => {
  const a1 = blog('fr/a1', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const a2 = blog('fr/a2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    draft: true,
  });
  const a3 = blog('fr/a3', { lang: 'fr', series: 'foo', seriesOrder: 3 });
  const s = series('fr/foo', { lang: 'fr' });
  const ctx = getSeriesContext(a1, [a1, a2, a3], [s]);
  assert.ok(ctx);
  assert.equal(ctx.total, 2);
  assert.equal(ctx.next?.id, 'fr/a3'); // saute a2 draft
});

test("getSeriesContext — la page d'un draft inclut le draft courant", () => {
  // Quand on rend la page draft preview (URL hashée), getSeriesContext est
  // appelé avec un article draft : il doit figurer dans episodes pour que
  // le bandeau s'affiche correctement.
  const a1 = blog('fr/a1', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const a2 = blog('fr/a2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    draft: true,
  });
  const s = series('fr/foo', { lang: 'fr' });
  const ctx = getSeriesContext(a2, [a1, a2], [s]);
  assert.ok(ctx);
  assert.equal(ctx.position, 2);
  // total inclut le courant (visible sur sa propre page) + a1 (publié) = 2
  assert.equal(ctx.total, 2);
});

test('getSeriesContext — série déclarée mais aucun épisode visible retourne null', () => {
  // Cas pathologique : article référencé mais série inexistante côté entries.
  const a = blog('fr/a', { lang: 'fr', series: 'absente', seriesOrder: 1 });
  const ctx = getSeriesContext(a, [a], []);
  assert.equal(ctx, null);
});

test('buildSeriesIndex — valide le graphe avant de calculer', () => {
  const articles = [
    blog('fr/a', { lang: 'fr', series: 'inexistante', seriesOrder: 1 }),
  ];
  const seriesEntries = [series('fr/autre', { lang: 'fr' })];
  assert.throws(
    () => buildSeriesIndex(articles, seriesEntries),
    /référence la série "inexistante"/
  );
});

test('buildSeriesIndex — lookup O(1) par article id', () => {
  const a1 = blog('fr/a1', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const a2 = blog('fr/a2', { lang: 'fr', series: 'foo', seriesOrder: 2 });
  const a3 = blog('fr/a3', { lang: 'fr' }); // hors série
  const s = series('fr/foo', { lang: 'fr' });
  const index = buildSeriesIndex([a1, a2, a3], [s]);

  const ctx2 = index.get('fr/a2');
  assert.ok(ctx2);
  assert.equal(ctx2.position, 2);
  assert.equal(ctx2.total, 2);
  assert.equal(ctx2.prev?.id, 'fr/a1');
  assert.equal(ctx2.next, null);

  assert.equal(index.get('fr/a3'), null);
  assert.equal(index.get('fr/inexistant'), null);
});

test('sortArchive — orphelins triés par publishedAt DESC', () => {
  const a = blog('fr/a', {
    lang: 'fr',
    publishedAt: new Date('2026-05-01'),
  });
  const b = blog('fr/b', {
    lang: 'fr',
    publishedAt: new Date('2026-05-03'),
  });
  const c = blog('fr/c', {
    lang: 'fr',
    publishedAt: new Date('2026-05-02'),
  });
  const index = buildSeriesIndex([a, b, c], []);
  const sorted = sortArchive([a, b, c], index);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['fr/b', 'fr/c', 'fr/a']
  );
});

test('sortArchive — épisodes de série regroupés, dernier en haut', () => {
  // Une série de 3 épisodes aux dates mélangées : ils doivent tous être
  // contigus, ordonnés par seriesOrder DESC dans le bloc, et le bloc daté
  // sur la date la plus récente du groupe.
  const e1 = blog('fr/e1', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 1,
    publishedAt: new Date('2026-05-07'),
  });
  const e2 = blog('fr/e2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    publishedAt: new Date('2026-05-12'),
  });
  const e3 = blog('fr/e3', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 3,
    publishedAt: new Date('2026-05-09'),
  });
  const s = series('fr/foo', { lang: 'fr' });
  const index = buildSeriesIndex([e1, e2, e3], [s]);
  const sorted = sortArchive([e1, e2, e3], index);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['fr/e3', 'fr/e2', 'fr/e1']
  );
});

test('sortArchive — orphelin avec date intermédiaire ne casse pas le bloc', () => {
  // Le bloc série a un bucketDate = 2026-05-12 (max du groupe). L'orphelin
  // au 2026-05-10 doit passer APRÈS tout le bloc, pas s'intercaler entre
  // les épisodes.
  const e1 = blog('fr/e1', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 1,
    publishedAt: new Date('2026-05-07'),
  });
  const e2 = blog('fr/e2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    publishedAt: new Date('2026-05-12'),
  });
  const orphan = blog('fr/orphan', {
    lang: 'fr',
    publishedAt: new Date('2026-05-10'),
  });
  const s = series('fr/foo', { lang: 'fr' });
  const index = buildSeriesIndex([e1, e2, orphan], [s]);
  const sorted = sortArchive([e1, e2, orphan], index);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['fr/e2', 'fr/e1', 'fr/orphan']
  );
});

test('sortArchive — série plus ancienne passe sous un orphelin plus récent', () => {
  const e1 = blog('fr/e1', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 1,
    publishedAt: new Date('2026-04-01'),
  });
  const e2 = blog('fr/e2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    publishedAt: new Date('2026-04-05'),
  });
  const orphan = blog('fr/orphan', {
    lang: 'fr',
    publishedAt: new Date('2026-05-01'),
  });
  const s = series('fr/foo', { lang: 'fr' });
  const index = buildSeriesIndex([e1, e2, orphan], [s]);
  const sorted = sortArchive([e1, e2, orphan], index);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['fr/orphan', 'fr/e2', 'fr/e1']
  );
});

test('sortArchive — deux orphelins même date départagés par publishedAt (stable)', () => {
  // Tie-break exact : même publishedAt → l'ordre dépend de Array.sort, qui
  // est stable depuis ES2019. On vérifie juste qu'aucun n'écrase l'autre.
  const a = blog('fr/a', {
    lang: 'fr',
    publishedAt: new Date('2026-05-07'),
  });
  const b = blog('fr/b', {
    lang: 'fr',
    publishedAt: new Date('2026-05-07'),
  });
  const index = buildSeriesIndex([a, b], []);
  const sorted = sortArchive([a, b], index);
  assert.equal(sorted.length, 2);
  assert.ok(sorted.find((x) => x.id === 'fr/a'));
  assert.ok(sorted.find((x) => x.id === 'fr/b'));
});

test('sortArchive — isVisible filtre amont aligné avec index (drafts cachés)', () => {
  // Si le filtre amont retire un draft mais que l'index considère ce draft
  // comme visible, le bucketDate inclurait sa publishedAt et fausserait le
  // tri. On vérifie que le contrat tient quand les deux sont alignés.
  const e1 = blog('fr/e1', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 1,
    publishedAt: new Date('2026-05-01'),
  });
  const e2 = blog('fr/e2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    publishedAt: new Date('2026-05-20'),
    draft: true,
  });
  const s = series('fr/foo', { lang: 'fr' });
  const isVisible = (a) => !a.data.draft;
  const index = buildSeriesIndex([e1, e2], [s], { isVisible });
  const visible = [e1, e2].filter(isVisible);
  const sorted = sortArchive(visible, index);
  // e2 (draft) filtré → bucketDate = 2026-05-01 → seul e1 reste.
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['fr/e1']
  );
});

test('buildSeriesIndex — isVisible custom inclut les drafts (mode DEV/SHOW_DRAFTS)', () => {
  // Simule l'appel depuis une page Astro en `make serve` ou `SHOW_DRAFTS=1` :
  // l'isVisible custom traite tous les articles comme visibles. Le compteur
  // N/M doit alors refléter aussi les drafts, pour rester aligné avec
  // l'archive qui les affiche.
  const a1 = blog('fr/a1', { lang: 'fr', series: 'foo', seriesOrder: 1 });
  const a2 = blog('fr/a2', {
    lang: 'fr',
    series: 'foo',
    seriesOrder: 2,
    draft: true,
  });
  const a3 = blog('fr/a3', { lang: 'fr', series: 'foo', seriesOrder: 3 });
  const s = series('fr/foo', { lang: 'fr' });

  // Comportement par défaut : drafts cachés (mode prod), total = 2.
  const prodIndex = buildSeriesIndex([a1, a2, a3], [s]);
  assert.equal(prodIndex.get('fr/a1')?.total, 2);
  assert.equal(prodIndex.get('fr/a1')?.next?.id, 'fr/a3');

  // Mode DEV : drafts visibles, total = 3, next d'a1 = a2 (le draft).
  const devIndex = buildSeriesIndex([a1, a2, a3], [s], {
    isVisible: () => true,
  });
  assert.equal(devIndex.get('fr/a1')?.total, 3);
  assert.equal(devIndex.get('fr/a1')?.next?.id, 'fr/a2');
  assert.equal(devIndex.get('fr/a2')?.position, 2);
});
