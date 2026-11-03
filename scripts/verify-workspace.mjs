import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceFile = join(root, 'pnpm-workspace.yaml');
const errors = [];

const APP_TASKS = ['lint', 'check-types', 'test'];
const MOBILE_APP = 'apps/mobile';

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

    const match = trimmed.match(/^-\s*(?:"([^"]+)"|'([^']+)'|([^#]+?))\s*(?:#.*)?$/);

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

  const excludedPaths = new Set(excluded.map((dir) => resolve(dir).toLowerCase()));
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
    addError(`${workspacePath}: package.json is not valid JSON (${error.message}).`);
    return;
  }

  if (!workspacePath.startsWith('apps/')) {
    return;
  }

  const requiredTasks = workspacePath === MOBILE_APP ? APP_TASKS : [...APP_TASKS, 'build'];
  const scripts = manifest.scripts ?? {};

  for (const task of requiredTasks) {
    if (typeof scripts[task] !== 'string' || scripts[task].trim() === '') {
      addError(`${workspacePath}: missing required "${task}" script.`);
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
  }

  if (errors.length === 0) {
    console.log(`Workspace task contract OK (${workspaces.length} workspace(s) checked).`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  process.exitCode = 1;
}
