const FUNCTION_NAMES = new Set(['floor', 'ceil', 'round', 'abs', 'min', 'max']);

const MAX_FORMULA_LENGTH = 500;
const MAX_NESTING_DEPTH = 50;

type TokenType =
  | 'number'
  | 'identifier'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'comma';

interface Token {
  type: TokenType;
  value: string;
}

const OPERATORS = new Set(['+', '-', '*', '/', '%', '^']);
const NUMBER_RE = /\d+(?:\.\d+)?/y;
const NAME_RE = /[a-zA-Z_][a-zA-Z0-9_]*/y;

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

    if (char === '(' || char === ')' || char === ',') {
      tokens.push({
        type: char === '(' ? 'lparen' : char === ')' ? 'rparen' : 'comma',
        value: char,
      });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character "${char}" in formula`);
  }

  return tokens;
}

/**
 * Validates the grammar of a formula expression without evaluating it.
 * Mirrors the client parser so a structure accepted by the API is renderable.
 */
class Parser {
  private position = 0;
  private depth = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): void {
    this.parseExpression();
    if (this.position !== this.tokens.length) {
      throw new Error('Unexpected trailing tokens in formula');
    }
  }

  private enter(): void {
    this.depth += 1;
    if (this.depth > MAX_NESTING_DEPTH) {
      throw new Error('Formula is nested too deeply');
    }
  }

  private leave(): void {
    this.depth -= 1;
  }

  private parseExpression(): void {
    this.enter();
    this.parseTerm();
    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      this.consume();
      this.parseTerm();
    }
    this.leave();
  }

  private parseTerm(): void {
    this.parseFactor();
    while (
      this.peek()?.value === '*' ||
      this.peek()?.value === '/' ||
      this.peek()?.value === '%'
    ) {
      this.consume();
      this.parseFactor();
    }
  }

  private parseFactor(): void {
    this.parseUnary();
    if (this.peek()?.value === '^') {
      this.consume();
      this.parseFactor();
    }
  }

  private parseUnary(): void {
    const token = this.peek();
    if (token?.value === '+' || token?.value === '-') {
      this.consume();
      this.parseUnary();
      return;
    }
    this.parsePrimary();
  }

  private parsePrimary(): void {
    const token = this.peek();

    if (!token) {
      throw new Error('Unexpected end of formula');
    }

    if (token.type === 'number') {
      this.consume();
      return;
    }

    if (token.type === 'lparen') {
      this.consume();
      this.parseExpression();
      const closing = this.consume();
      if (closing.type !== 'rparen') {
        throw new Error('Expected ")" in formula');
      }
      return;
    }

    if (token.type === 'identifier') {
      this.consume();

      if (this.peek()?.type === 'lparen') {
        this.consume();
        this.parseFunctionCall(token.value);
        return;
      }

      return;
    }

    throw new Error(`Unexpected token "${token.value}" in formula`);
  }

  private parseFunctionCall(name: string): void {
    if (!FUNCTION_NAMES.has(name)) {
      throw new Error(`Unknown function "${name}" in formula`);
    }

    if (this.peek()?.type !== 'rparen') {
      this.parseExpression();
      while (this.peek()?.type === 'comma') {
        this.consume();
        this.parseExpression();
      }
    }

    const closing = this.consume();
    if (closing.type !== 'rparen') {
      throw new Error(`Expected ")" to close function "${name}"`);
    }
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

export function assertValidFormula(expression: string): void {
  const trimmed = expression.trim();
  if (!trimmed) throw new Error('Formula is empty');
  if (trimmed.length > MAX_FORMULA_LENGTH) {
    throw new Error(
      `Formula exceeds the maximum length of ${MAX_FORMULA_LENGTH} characters`,
    );
  }

  new Parser(tokenize(trimmed)).parse();
}

export function extractIdentifiers(expression: string): string[] {
  const tokens = tokenize(expression.trim());
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
