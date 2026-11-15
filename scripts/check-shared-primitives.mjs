import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIRS = ['apps/web', 'apps/mobile'];
const PRIMITIVES = ['Button', 'Tag', 'GemLogo', 'DotTracker'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.expo',
  'dist',
  'dist-test',
  'coverage',
  '.turbo',
  'assets',
  'public',
]);
const LEGACY_PATHS = [
  'apps/web/src/components/ui/Button.tsx',
  'apps/web/src/components/ui/Tag.tsx',
  'apps/web/src/components/ui/GemLogo.tsx',
  'apps/web/src/features/sheets/components/DotTracker.tsx',
  'apps/mobile/components/Button.tsx',
  'apps/mobile/components/GemLogo.tsx',
  'apps/mobile/components/sheet/DotTracker.tsx',
];

const exportRe = new RegExp(
  `export\\s+(?:default\\s+)?(?:function|const|class)\\s+(${PRIMITIVES.join('|')})\\b`,
  'g',
);

const errors = [];

function listSourceFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...listSourceFiles(join(dir, entry.name)));
      }
      continue;
    }

    if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }

  return files;
}

for (const legacyPath of LEGACY_PATHS) {
  if (existsSync(join(root, legacyPath))) {
    errors.push(
      `${legacyPath}: local primitive still exists; delete it and import from @master-sheet/ui.`,
    );
  }
}

for (const appDir of APP_DIRS) {
  for (const file of listSourceFiles(join(root, appDir))) {
    const source = readFileSync(file, 'utf8');
    const matches = [...source.matchAll(exportRe)];

    if (matches.length === 0) {
      continue;
    }

    const filePath = relative(root, file).split(sep).join('/');

    for (const match of matches) {
      errors.push(
        `${filePath}: local export of shared primitive "${match[1]}" found; import it from @master-sheet/ui instead.`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log('Shared primitives have no duplicate app-local implementations.');
}
