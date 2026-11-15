import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(
  root,
  'packages',
  'design-tokens',
  'generated',
  'tokens.json',
);
const APP_DIRS = ['apps/web', 'apps/mobile'];
const STYLE_EXTENSIONS = new Set(['.css']);
const STYLE_FILE_RE = /^tailwind\.config\.(?:js|cjs|mjs|ts)$/;
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.expo',
  'dist',
  'dist-test',
  'coverage',
  '.turbo',
  'public',
]);
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA_RE = /rgba?\([^)]*\)/gi;

if (!existsSync(tokensPath)) {
  console.error(
    'error: packages/design-tokens/generated/tokens.json is missing. Run `pnpm tokens:generate`.',
  );
  process.exitCode = 1;
} else {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const tokenColors = new Set();

  for (const theme of Object.values(tokens.colors ?? {})) {
    for (const value of Object.values(theme)) {
      if (typeof value === 'string') {
        tokenColors.add(value.trim().toLowerCase().replace(/\s+/g, ''));
      }
    }
  }

  const errors = [];

  for (const appDir of APP_DIRS) {
    for (const file of listStyleFiles(join(root, appDir))) {
      const filePath = relative(root, file).split(sep).join('/');
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);

      lines.forEach((line, index) => {
        const literals = [
          ...(line.match(HEX_RE) ?? []),
          ...(line.match(RGBA_RE) ?? []),
        ];

        for (const literal of literals) {
          const normalized = literal.toLowerCase().replace(/\s+/g, '');

          if (tokenColors.has(normalized)) {
            errors.push(
              `${filePath}:${index + 1}: literal token color "${literal}" found; use the generated CSS variable instead.`,
            );
          }
        }
      });
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`error: ${error}`);
    }

    process.exitCode = 1;
  } else {
    console.log('App style files contain no literal design-token colors.');
  }
}

function listStyleFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...listStyleFiles(join(dir, entry.name)));
      }
      continue;
    }

    if (
      STYLE_EXTENSIONS.has(extname(entry.name)) ||
      STYLE_FILE_RE.test(entry.name)
    ) {
      files.push(join(dir, entry.name));
    }
  }

  return files;
}
