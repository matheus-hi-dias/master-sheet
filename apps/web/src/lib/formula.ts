export type FormulaContext = Record<string, number>;

const FUNCTION_WHITELIST: Record<string, (...args: number[]) => number> = {
  floor: (a) => Math.floor(a),
  ceil: (a) => Math.ceil(a),
  round: (a) => Math.round(a),
  abs: (a) => Math.abs(a),
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
};

type TokenType = 'number' | 'identifier' | 'operator' | 'lparen' | 'rparen' | 'comma';

interface Token {
  type: TokenType;
  value: string;
}

const OPERATORS = new Set(['+', '-', '*', '/', '%', '^']);
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const NAME_RE = /[a-zA-Z_][a-zA-Z0-9_]*/y;
const NUMBER_RE = /\d+(?:\.\d+)?/y;

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/\d/.test(char)) {
      NUMBER_RE.lastIndex = index;
      const match = NUMBER_RE.exec(expression);
      if (!match) throw new Error('Invalid number literal');
      tokens.push({ type: 'number', value: match[0] });
      index += match[0].length;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      NAME_RE.lastIndex = index;
      const match = NAME_RE.exec(expression);
      if (!match) throw new Error('Invalid identifier');
      tokens.push({ type: 'identifier', value: match[0] });
      index += match[0].length;
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen', value: char });
      index += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: char });
      index += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'comma', value: char });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character "${char}" in formula`);
  }

  return tokens;
}

class Parser {
  private readonly tokens: Token[];
  private readonly context: FormulaContext;
  private position = 0;

  constructor(tokens: Token[], context: FormulaContext) {
    this.tokens = tokens;
    this.context = context;
  }

  parseExpression(): number {
    let left = this.parseTerm();

    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      const operator = this.consume().value;
      const right = this.parseTerm();
      left = operator === '+' ? left + right : left - right;
    }

    return left;
  }

  completed(): boolean {
    return this.position === this.tokens.length;
  }

  private parseTerm(): number {
    let left = this.parseFactor();

    while (
      this.peek()?.value === '*' ||
      this.peek()?.value === '/' ||
      this.peek()?.value === '%'
    ) {
      const operator = this.consume().value;
      const right = this.parseFactor();

      if (operator === '*') {
        left *= right;
      } else if (operator === '/') {
        left /= right;
      } else {
        left %= right;
      }
    }

    return left;
  }

  private parseFactor(): number {
    const left = this.parseUnary();

    if (this.peek()?.value === '^') {
      this.consume();
      const right = this.parseFactor();
      return Math.pow(left, right);
    }

    return left;
  }

  private parseUnary(): number {
    const token = this.peek();

    if (token?.value === '+' || token?.value === '-') {
      this.consume();
      const value = this.parseUnary();
      return token.value === '-' ? -value : value;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (!token) {
      throw new Error('Unexpected end of formula');
    }

    if (token.type === 'number') {
      this.consume();
      return Number(token.value);
    }

    if (token.type === 'lparen') {
      this.consume();
      const value = this.parseExpression();
      const closing = this.consume();
      if (closing.type !== 'rparen') {
        throw new Error('Expected ")" in formula');
      }
      return value;
    }

    if (token.type === 'identifier') {
      this.consume();

      if (this.peek()?.type === 'lparen') {
        this.consume();
        return this.parseFunctionCall(token.value);
      }

      if (!(token.value in this.context)) {
        throw new Error(`Unknown identifier "${token.value}" in formula`);
      }

      return this.context[token.value];
    }

    throw new Error(`Unexpected token "${token.value}" in formula`);
  }

  private parseFunctionCall(name: string): number {
    const fn = FUNCTION_WHITELIST[name];
    if (!fn) {
      throw new Error(`Unknown function "${name}" in formula`);
    }

    const args: number[] = [];

    if (this.peek()?.type !== 'rparen') {
      args.push(this.parseExpression());
      while (this.peek()?.type === 'comma') {
        this.consume();
        args.push(this.parseExpression());
      }
    }

    const closing = this.consume();
    if (closing.type !== 'rparen') {
      throw new Error(`Expected ")" to close function "${name}"`);
    }

    return fn(...args);
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(): Token {
    const token = this.tokens[this.position];
    if (!token) {
      throw new Error('Unexpected end of formula');
    }
    this.position += 1;
    return token;
  }
}

export function evaluateFormula(
  expression: string,
  context: FormulaContext = {},
): number {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('Formula is empty');
  }

  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens, context);
  const result = parser.parseExpression();

  if (!parser.completed()) {
    throw new Error('Unexpected trailing tokens in formula');
  }

  if (!Number.isFinite(result)) {
    throw new Error('Formula evaluation produced a non-finite value');
  }

  return result;
}

export function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}

export function extractIdentifiers(expression: string): string[] {
  const tokens = tokenize(expression);
  const identifiers: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'identifier') continue;

    const next = tokens[index + 1];
    if (next?.type === 'lparen') continue;

    if (!identifiers.includes(token.value)) {
      identifiers.push(token.value);
    }
  }

  return identifiers;
}

const IDENTIFIER_GLOBAL_RE = /[a-zA-Z_][a-zA-Z0-9_]*/g;

export function replaceIdentifier(
  expression: string,
  oldId: string,
  newId: string,
): string {
  if (!oldId || oldId === newId) return expression;

  const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(
    `(?<![a-zA-Z0-9_])${escaped}(?![a-zA-Z0-9_])(?!\\s*\\()`,
    'g',
  );

  return expression.replace(matcher, newId);
}

export function renderExpressionWithLabels(
  expression: string,
  labelById: Record<string, string> = {},
): string {
  return expression.replace(IDENTIFIER_GLOBAL_RE, (token) =>
    token in labelById ? `⟨${labelById[token]}⟩` : token,
  );
}