import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const testRoots = process.argv.slice(2);

if (testRoots.length === 0) {
  console.error('Usage: node run-node-tests.mjs <test-directory> [...]');
  process.exit(1);
}

const testFiles = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      collect(path);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      testFiles.push(path);
    }
  }
}

for (const root of testRoots) {
  collect(resolve(process.cwd(), root));
}

if (testFiles.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

testFiles.sort();

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
