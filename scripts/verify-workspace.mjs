import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceFile = join(root, 'pnpm-workspace.yaml');
const errors = [];

const APP_TASKS = ['lint', 'check-types', 'test'];
const FULL_TASKS = [...APP_TASKS, 'build'];
const MOBILE_APP = 'apps/mobile';
const SHARED_PACKAGES = ['packages/contracts', 'packages/sheet-engine'];
const APP_PACKAGES = {
  'apps/api': '@master-sheet/api',
  'apps/mobile': '@master-sheet/mobile',
  'apps/web': '@master-sheet/web',
};
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'dist-test',
  'coverage',
  '.expo',
  '.turbo',
]);
const FORBIDDEN_SHARED_IMPORTS = ['fs', 'path', 'os', 'crypto', 'react-native'];
const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function addError(message) {
  errors.push(message);
}

function readWorkspacePatterns() {
  if (!existsSync(workspaceFile)) {
    addError('pnpm-workspace.yaml is missing at the repository root.');
    return [];
  }

  const patterns = [];
  let readingPackages = false;

  for (const line of readFileSync(workspaceFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (/^packages\s*:/.test(trimmed)) {
      readingPackages = true;
      continue;
    }

    if (!readingPackages) {
      continue;
    }

    const match = trimmed.match(
      /^-\s*(?:"([^"]+)"|'([^']+)'|([^#]+?))\s*(?:#.*)?$/,
    );

    if (match) {
      patterns.push((match[1] ?? match[2] ?? match[3]).trim());
      continue;
    }

    if (!trimmed.startsWith('-')) {
      readingPackages = false;
    }
  }

  if (patterns.length === 0) {
    addError('pnpm-workspace.yaml does not declare any workspace packages.');
  }

  return patterns;
}

function expandPattern(pattern) {
  const normalized = pattern.replace(/\\/g, '/').replace(/\/+$/, '');
  const segments = normalized.split('/').filter(Boolean);
  let current = [root];

  for (const segment of segments) {
    if (segment === '**') {
      addError(`Unsupported workspace glob segment "**" in "${pattern}".`);
      return [];
    }

    const next = [];

    for (const base of current) {
      if (!existsSync(base)) {
        continue;
      }

      if (segment === '*') {
        for (const entry of readdirSync(base, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            next.push(join(base, entry.name));
          }
        }
        continue;
      }

      const candidate = join(base, segment);

      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        next.push(candidate);
      }
    }

    current = next;
  }

  return current;
}

function collectWorkspaces(patterns) {
  const included = [];
  const excluded = [];

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      excluded.push(...expandPattern(pattern.slice(1)));
      continue;
    }

    included.push(...expandPattern(pattern));
  }

  const excludedPaths = new Set(
    excluded.map((dir) => resolve(dir).toLowerCase()),
  );
  const seen = new Set();
  const workspaces = [];

  for (const dir of included) {
    const key = resolve(dir).toLowerCase();

    if (excludedPaths.has(key) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    workspaces.push(dir);
  }

  return workspaces.sort((a, b) => a.localeCompare(b));
}

function relativeWorkspacePath(dir) {
  return relative(root, dir).split(sep).join('/');
}

function verifyWorkspace(dir) {
  const workspacePath = relativeWorkspacePath(dir);
  const manifestPath = join(dir, 'package.json');

  if (!existsSync(manifestPath)) {
    addError(`${workspacePath}: workspace directory has no package.json.`);
    return;
  }

  let manifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    addError(
      `${workspacePath}: package.json is not valid JSON (${error.message}).`,
    );
    return;
  }

  const isSharedPackage = SHARED_PACKAGES.includes(workspacePath);

  if (!isSharedPackage && !workspacePath.startsWith('apps/')) {
    return;
  }

  const requiredTasks = isSharedPackage
    ? FULL_TASKS
    : workspacePath === MOBILE_APP
      ? APP_TASKS
      : FULL_TASKS;
  const scripts = manifest.scripts ?? {};

  for (const task of requiredTasks) {
    if (typeof scripts[task] !== 'string' || scripts[task].trim() === '') {
      addError(`${workspacePath}: missing required "${task}" script.`);
    }
  }
}

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

function readImports(file) {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(IMPORT_RE)].map((match) => match[1]);
}

function isInside(parent, target) {
  const path = relative(parent, target);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
}

function isForbiddenSharedImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    specifier.startsWith('@nestjs/') ||
    FORBIDDEN_SHARED_IMPORTS.includes(specifier)
  );
}

function verifyBoundaries(dir) {
  const workspacePath = relativeWorkspacePath(dir);
  const manifestPath = join(dir, 'package.json');

  if (!existsSync(manifestPath)) {
    return;
  }

  let manifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return;
  }

  const sourceFiles = listSourceFiles(join(dir, 'src'));

  if (SHARED_PACKAGES.includes(workspacePath)) {
    const allowedWorkspacePackage =
      workspacePath === 'packages/sheet-engine'
        ? '@master-sheet/contracts'
        : null;
    const dependencies = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
    };

    if (
      workspacePath === 'packages/contracts' &&
      '@master-sheet/sheet-engine' in dependencies
    ) {
      addError(
        `${workspacePath}: contracts must not depend on the sheet engine.`,
      );
    }

    for (const file of sourceFiles) {
      const filePath = relativeWorkspacePath(file);
      const source = readFileSync(file, 'utf8');

      if (/\b(?:window|document)\s*\./.test(source)) {
        addError(
          `${filePath}: shared packages must not access DOM globals (window/document).`,
        );
      }

      for (const specifier of readImports(file)) {
        if (isForbiddenSharedImport(specifier)) {
          addError(
            `${filePath}: shared packages must not import platform module "${specifier}".`,
          );
          continue;
        }

        if (specifier.startsWith('@master-sheet/')) {
          const isAllowed =
            allowedWorkspacePackage !== null &&
            (specifier === allowedWorkspacePackage ||
              specifier.startsWith(`${allowedWorkspacePackage}/`));

          if (!isAllowed) {
            addError(
              `${filePath}: shared package must not import workspace package "${specifier}".`,
            );
          }
          continue;
        }

        if (specifier.startsWith('.')) {
          const target = resolve(dirname(file), specifier);

          if (!isInside(dir, target)) {
            addError(
              `${filePath}: shared package import "${specifier}" escapes its package.`,
            );
          }
        }
      }
    }

    return;
  }

  if (!(workspacePath in APP_PACKAGES)) {
    return;
  }

  for (const file of sourceFiles) {
    const filePath = relativeWorkspacePath(file);

    for (const specifier of readImports(file)) {
      const targetApp = Object.entries(APP_PACKAGES).find(
        ([, packageName]) =>
          specifier === packageName || specifier.startsWith(`${packageName}/`),
      );

      if (targetApp && targetApp[0] !== workspacePath) {
        addError(
          `${filePath}: application must not import from "${targetApp[1]}".`,
        );
        continue;
      }

      if (!specifier.startsWith('.')) {
        continue;
      }

      const target = resolve(dirname(file), specifier);
      const importedApp = Object.keys(APP_PACKAGES).find((appPath) =>
        isInside(join(root, appPath), target),
      );

      if (importedApp && importedApp !== workspacePath) {
        addError(
          `${filePath}: application must not import from "${importedApp}" via "${specifier}".`,
        );
      }
    }
  }
}

const patterns = readWorkspacePatterns();

if (patterns.length > 0) {
  const workspaces = collectWorkspaces(patterns);

  if (workspaces.length === 0) {
    addError('No workspace directories matched pnpm-workspace.yaml.');
  }

  for (const workspace of workspaces) {
    verifyWorkspace(workspace);
    verifyBoundaries(workspace);
  }

  if (errors.length === 0) {
    console.log(
      `Workspace task contract OK (${workspaces.length} workspace(s) checked).`,
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  process.exitCode = 1;
}
