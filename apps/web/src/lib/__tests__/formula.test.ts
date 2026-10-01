import {
  evaluateFormula,
  renderExpressionWithLabels,
  replaceIdentifier,
} from '../formula';

describe('evaluateFormula', () => {
  it('evaluates basic arithmetic respecting precedence', () => {
    expect(evaluateFormula('1 + 2 * 3')).toBe(7);
    expect(evaluateFormula('(1 + 2) * 3')).toBe(9);
    expect(evaluateFormula('10 - 4 / 2')).toBe(8);
    expect(evaluateFormula('10 % 4')).toBe(2);
  });

  it('supports unary operators', () => {
    expect(evaluateFormula('-2 + 5')).toBe(3);
    expect(evaluateFormula('-(3 * 2)')).toBe(-6);
  });

  it('supports exponentiation with right associativity', () => {
    expect(evaluateFormula('2 ^ 10')).toBe(1024);
    expect(evaluateFormula('2 ^ 3 ^ 2')).toBe(512);
  });

  it('supports variables from context', () => {
    expect(
      evaluateFormula('floor((str - 10) / 2)', { str: 15 }),
    ).toBe(2);
    expect(evaluateFormula('str + dex', { str: 12, dex: 14 })).toBe(26);
  });

  it('supports whitelisted math functions', () => {
    const context = { a: 3.7, b: 2.2 };
    expect(evaluateFormula('ceil(a)', context)).toBe(4);
    expect(evaluateFormula('abs(round(a) - a)', context)).toBeCloseTo(0.3, 5);
    expect(evaluateFormula('min(a, b)', context)).toBeCloseTo(2.2, 5);
    expect(evaluateFormula('max(a, b)', context)).toBeCloseTo(3.7, 5);
    expect(evaluateFormula('min(a, b, 1)', context)).toBe(1);
    expect(evaluateFormula('floor(min(a * 2, b + 3))', context)).toBe(5);
  });

  it('rejects unknown functions', () => {
    expect(() => evaluateFormula('evil(1)')).toThrow(
      'Unknown function "evil"',
    );
  });

  it('rejects unknown identifiers', () => {
    expect(() => evaluateFormula('str + 1')).toThrow(
      'Unknown identifier "str"',
    );
  });

  it('rejects invalid characters and injection attempts', () => {
    expect(() => evaluateFormula('1 + @')).toThrow();
    expect(() => evaluateFormula('1 + alert("x")')).toThrow();
    expect(() => evaluateFormula('globalThis')).toThrow(
      'Unknown identifier "globalThis"',
    );
    expect(() => evaluateFormula('a + "string"')).toThrow();
  });

  it('rejects malformed formulas', () => {
    expect(() => evaluateFormula('')).toThrow('empty');
    expect(() => evaluateFormula('(1 + 2')).toThrow();
    expect(() => evaluateFormula('1 + 2 )')).toThrow('trailing');
    expect(() => evaluateFormula('(1 2)')).toThrow();
  });

  it('rejects non-finite results (division by zero guarded)', () => {
    expect(() => evaluateFormula('1 / 0')).toThrow('non-finite');
  });
});

describe('replaceIdentifier', () => {
  it('replaces only whole-word identifier references', () => {
    expect(replaceIdentifier('str + strong + str_2', 'str', 'strength')).toBe(
      'strength + strong + str_2',
    );
  });

  it('leaves function names untouched', () => {
    expect(replaceIdentifier('floor(str)', 'floor', 'nivel')).toBe(
      'floor(str)',
    );
  });

  it('returns the expression unchanged when ids match', () => {
    expect(replaceIdentifier('a + b', 'a', 'a')).toBe('a + b');
  });
});

describe('renderExpressionWithLabels', () => {
  it('prints referenced labels in place of ids', () => {
    expect(
      renderExpressionWithLabels('floor((str - 10) / 2)', {
        str: 'Força',
      }),
    ).toBe('floor((⟨Força⟩ - 10) / 2)');
  });
});