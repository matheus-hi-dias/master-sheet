import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clampDotValue,
  toggleDotValue,
} from '../dist/shared/dot.js';

test('clampDotValue normalises out-of-range input', () => {
  assert.equal(clampDotValue(-2, 5), 0);
  assert.equal(clampDotValue(3.4, 5), 3);
  assert.equal(clampDotValue(9, 5), 5);
  assert.equal(clampDotValue(Number.NaN, 5), 0);
});

test('toggleDotValue fills up to the pressed dot', () => {
  assert.equal(toggleDotValue(0, 0, 5), 1);
  assert.equal(toggleDotValue(1, 3, 5), 4);
});

test('toggleDotValue clears the last filled dot', () => {
  assert.equal(toggleDotValue(3, 2, 5), 2);
  assert.equal(toggleDotValue(5, 4, 5), 4);
});

test('toggleDotValue clamps the current value before toggling', () => {
  assert.equal(toggleDotValue(9, 4, 5), 4);
  assert.equal(toggleDotValue(-1, 0, 5), 1);
});
