import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const FORBIDDEN_SPECIFIERS = ['fs', 'path', 'os', 'crypto', 'react-native'];

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = join(directory, entry);
    return statSync(absolute).isDirectory()
      ? sourceFiles(absolute)
      : absolute.endsWith('.ts')
        ? [absolute]
        : [];
  });
}

function isForbidden(specifier: string): boolean {
  return (
    specifier.startsWith('node:') ||
    specifier.startsWith('@nestjs/') ||
    specifier === 'react-native' ||
    FORBIDDEN_SPECIFIERS.includes(specifier)
  );
}

test('shared package source has no platform-specific imports', () => {
  const root = process.cwd();
  const files = sourceFiles(join(root, 'src'));
  const violations: string[] = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const display = relative(root, file);

    for (const match of source.matchAll(IMPORT_RE)) {
      const specifier = match[1] as string;
      if (isForbidden(specifier)) {
        violations.push(`${display}: ${specifier}`);
      }
    }

    if (/\b(?:window|document)\b/.test(source)) {
      violations.push(`${display}: DOM global reference`);
    }
  }

  assert.deepEqual(violations, []);
});
