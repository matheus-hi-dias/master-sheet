import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildArtifacts, checkArtifacts } from '../scripts/generate.mjs';

test('generation is deterministic and idempotent', () => {
  const first = buildArtifacts();
  const second = buildArtifacts();

  assert.deepEqual([...first.keys()], [...second.keys()]);

  for (const [path, content] of first) {
    assert.deepEqual(second.get(path), content, `artifact changed: ${path}`);
  }
});

test('committed generated artifacts match the token source', () => {
  assert.deepEqual(checkArtifacts(buildArtifacts()), []);
});

function artifactEndingWith(artifacts, suffix) {
  const entry = [...artifacts.entries()].find(([path]) =>
    path.endsWith(suffix),
  );

  assert.ok(entry, `missing generated artifact ${suffix}`);

  return entry[1];
}

test('generated CSS exposes dark defaults and light overrides', () => {
  const tokensCss = artifactEndingWith(buildArtifacts(), 'tokens.css');
  const webThemeCss = artifactEndingWith(buildArtifacts(), 'web-theme.css');

  assert.match(tokensCss, /:root \{/);
  assert.match(tokensCss, /--color-bg-app: #121212;/);
  assert.match(tokensCss, /\.light \{/);
  assert.match(tokensCss, /--color-bg-app: #faf9f6;/);
  assert.match(tokensCss, /--color-gold: #b8860b;/);

  assert.match(webThemeCss, /@theme static \{/);
  assert.match(webThemeCss, /--color-gold: #d4af37;/);
  assert.match(webThemeCss, /:root\.light \{/);
  assert.match(webThemeCss, /--color-gold: #b8860b;/);
});

test('web theme emits every token, even ones with no utility class', () => {
  const webThemeCss = artifactEndingWith(buildArtifacts(), 'web-theme.css');

  // Tailwind v4 prunes `@theme` variables that no utility references; `static`
  // keeps the full token surface available as CSS custom properties.
  assert.match(webThemeCss, /--color-success: #27ae60;/);
  assert.match(webThemeCss, /--color-link: #2e78b7;/);
  assert.match(webThemeCss, /--background-image-aura:/);
  assert.match(webThemeCss, /--radius-pill:/);
});

test('spacing tokens do not shadow Tailwind container utilities', () => {
  const webThemeCss = artifactEndingWith(buildArtifacts(), 'web-theme.css');

  // `--spacing-sm`/`md`/`lg`/`xl` would make Tailwind resolve `max-w-sm` and
  // friends against the spacing scale, collapsing layouts to a few pixels.
  assert.doesNotMatch(webThemeCss, /--spacing-(?:xs|sm|md|lg|xl):/);
  assert.match(webThemeCss, /--space-sm: 8px;/);
});

test('generated Tailwind preset consumes token custom properties', () => {
  const preset = artifactEndingWith(buildArtifacts(), 'tailwind-preset.cjs');

  assert.match(preset, /"DEFAULT": "var\(--color-gold\)"/);
  assert.match(preset, /"app": "var\(--color-bg-app\)"/);
  assert.match(preset, /"card": "8px"/);
  assert.match(preset, /"display": \[\n\s+"Cinzel"/);
});

test('generated font manifest lists every shared font asset', () => {
  const manifest = artifactEndingWith(buildArtifacts(), 'font-manifest.js');

  assert.match(manifest, /Cinzel-VariableFont_wght\.ttf/);
  assert.match(manifest, /Lato-Regular\.ttf/);
  assert.match(manifest, /SpaceMono-Regular\.ttf/);
  // The package is `"type": "module"`; `require()` would only work inside Metro.
  assert.match(manifest, /import font0 from '\.\.\/fonts\//);
  assert.doesNotMatch(manifest, /require\(/);
});

test('generated JSON snapshot matches the typed token source', () => {
  const snapshot = JSON.parse(
    artifactEndingWith(buildArtifacts(), 'tokens.json'),
  );

  assert.equal(snapshot.colors.dark.bgApp, '#121212');
  assert.equal(snapshot.colors.light.bgApp, '#faf9f6');
  assert.equal(snapshot.radii.card, '8px');
  assert.equal(snapshot.typography.display.family, 'Cinzel');
  assert.equal(snapshot.typography.body.family, 'Lato');
  assert.equal(snapshot.fonts.length, 3);
});
