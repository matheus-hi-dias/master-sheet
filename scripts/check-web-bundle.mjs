import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'apps', 'web', 'dist');
const FORBIDDEN_PATTERNS = [
  /react-native-svg/,
  /react-native\b/,
  /NativeModules/,
  /requireNativeComponent/,
];

if (!existsSync(distDir)) {
  console.error('error: apps/web/dist is missing. Run `pnpm --filter @master-sheet/web build`.');
  process.exitCode = 1;
} else {
  const errors = [];
  const files = listFiles(distDir).filter(
    (file) => extname(file) === '.js',
  );

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const filePath = relative(root, file).split(sep).join('/');

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(source)) {
        errors.push(`${filePath}: matches forbidden React Native pattern ${pattern}.`);
      }
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`error: ${error}`);
    }

    process.exitCode = 1;
  } else {
    console.log(
      `Web bundle contains no React Native modules (${files.length} JS asset(s) checked).`,
    );
  }
}

function listFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(path));
    } else {
      files.push(path);
    }
  }

  return files;
}
