import assert from 'node:assert/strict';
import test from 'node:test';
import structureCorpus from './fixtures/structure-corpus.json';
import {
  evaluateStructure,
  validateSheetData,
  validateTemplateStructure,
} from '../src';
import type { SheetData, TemplateStructure } from '@master-sheet/contracts';

interface EvaluateStructureCase {
  name: string;
  structure: TemplateStructure;
  data: SheetData;
  expected: SheetData;
}

interface CycleCase {
  name: string;
  structure: TemplateStructure;
  expectedCycle: string[];
}

interface ValidCase {
  name: string;
  structure: TemplateStructure;
}

interface InvalidCase {
  name: string;
  input: unknown;
  codes: string[];
}

test('evaluateStructure corpus', () => {
  for (const entry of structureCorpus.evaluateStructure as EvaluateStructureCase[]) {
    assert.deepEqual(
      evaluateStructure(entry.structure, entry.data),
      entry.expected,
      entry.name,
    );
  }
});

test('detects declared cycles', () => {
  for (const entry of structureCorpus.cycles as CycleCase[]) {
    const result = validateTemplateStructure(entry.structure);

    assert.equal(result.ok, false, entry.name);
    if (result.ok) continue;

    const cycle = result.issues.find((item) => item.code === 'FORMULA_CYCLE');
    assert.ok(cycle, entry.name);
    for (const id of entry.expectedCycle) {
      assert.match(cycle.message, new RegExp(id), entry.name);
    }
  }
});

test('accepts valid structures', () => {
  for (const entry of structureCorpus.valid as ValidCase[]) {
    const result = validateTemplateStructure(entry.structure);

    assert.equal(result.ok, true, entry.name);
  }
});

test('reports normalized issues for invalid structures', () => {
  for (const entry of structureCorpus.invalid as InvalidCase[]) {
    const result = validateTemplateStructure(entry.input);

    assert.equal(result.ok, false, entry.name);
    if (result.ok) continue;

    const codes = new Set(result.issues.map((item) => item.code));
    for (const code of entry.codes) {
      assert.ok(codes.has(code as never), `${entry.name}: expected ${code}`);
    }
  }
});

test('validateSheetData accepts compatible values', () => {
  const result = validateTemplateStructure(
    (structureCorpus.valid[0] as ValidCase).structure,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const data = validateSheetData(result.data, {
    str: 12,
    notes: 'hello',
    hp_dots: 3,
    align: 'lawful',
    hero: true,
    mod_str: 1,
    spells: [{ name: 'Fireball' }],
  });

  assert.equal(data.ok, true);
});

test('validateSheetData rejects incompatible values with paths', () => {
  const result = validateTemplateStructure(
    (structureCorpus.valid[0] as ValidCase).structure,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const data = validateSheetData(result.data, {
    str: 99,
    notes: 12,
    hp_dots: 20,
    align: 'chaotic',
    hero: 'yes',
    mod_str: 'high',
    spells: [{ name: 5 }],
  });

  assert.equal(data.ok, false);
  if (data.ok) return;

  const paths = data.issues.map((item) => item.path.join('.'));
  assert.ok(paths.includes('str'));
  assert.ok(paths.includes('notes'));
  assert.ok(paths.includes('spells.0.name'));
  assert.ok(
    data.issues.some((item) => item.code === 'SHEET_MAX_DOTS_EXCEEDED'),
  );
  assert.ok(
    data.issues.some((item) => item.code === 'SHEET_VALUE_NOT_IN_OPTIONS'),
  );
});

test('validateSheetData tolerates missing and null values', () => {
  const result = validateTemplateStructure(
    (structureCorpus.valid[0] as ValidCase).structure,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const data = validateSheetData(result.data, { str: null });

  assert.equal(data.ok, true);
});
