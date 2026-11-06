import assert from 'node:assert/strict';
import test from 'node:test';
import corpus from './fixtures/formula-corpus.json';
import {
  collectDependencies,
  evaluateFormula,
  FormulaParseError,
  parseFormula,
  type FormulaValues,
} from '../src/formula';

interface EvaluationCase {
  name: string;
  expression: string;
  values: FormulaValues;
  expected: number | null;
}

interface ParseErrorCase {
  name: string;
  expression: string;
  code: string;
}

interface DependencyCase {
  expression: string;
  expected: string[];
}

test('formula evaluation corpus', () => {
  for (const entry of corpus.evaluation as EvaluationCase[]) {
    assert.equal(
      evaluateFormula(entry.expression, entry.values),
      entry.expected,
      entry.name,
    );
  }
});

test('formula parse error corpus', () => {
  for (const entry of corpus.parseErrors as ParseErrorCase[]) {
    assert.throws(
      () => parseFormula(entry.expression),
      (error: unknown) =>
        error instanceof FormulaParseError && error.code === entry.code,
      entry.name,
    );
  }
});

test('formula dependency corpus', () => {
  for (const entry of corpus.dependencies as DependencyCase[]) {
    assert.deepEqual(
      collectDependencies(entry.expression),
      entry.expected,
      entry.expression,
    );
  }
});

test('evaluateFormula accepts a parsed AST', () => {
  const ast = parseFormula('str + dex');

  assert.equal(evaluateFormula(ast, { str: 2, dex: 3 }), 5);
});

test('evaluateFormula is deterministic across calls', () => {
  const expression = 'floor((str - 10) / 2) + dex';

  assert.equal(evaluateFormula(expression, { str: 15, dex: 2 }), 4);
  assert.equal(evaluateFormula(expression, { str: 15, dex: 2 }), 4);
});
