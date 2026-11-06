import { MAX_FORMULA_LENGTH, MAX_NESTING_DEPTH } from '@master-sheet/contracts';

export type FormulaValues = Record<string, unknown>;

export type FormulaContext = FormulaValues;

export type FormulaErrorCode =
  | 'FORMULA_EMPTY'
  | 'FORMULA_TOO_LONG'
  | 'FORMULA_SYNTAX'
  | 'FORMULA_UNKNOWN_FUNCTION';

export class FormulaParseError extends Error {
  readonly code: FormulaErrorCode;

  constructor(code: FormulaErrorCode, message: string) {
    super(message);
    this.name = 'FormulaParseError';
    this.code = code;
  }
}

export type FormulaNode =
  | { type: 'number'; value: number }
  | { type: 'identifier'; name: string }
  | { type: 'unary'; operator: '+' | '-'; operand: FormulaNode }
  | {
      type: 'binary';
      operator: '+' | '-' | '*' | '/' | '%' | '^';
      left: FormulaNode;
      right: FormulaNode;
    }
  | { type: 'call'; name: FormulaFunctionName; arguments: FormulaNode[] };

export const FORMULA_FUNCTIONS = [
  'floor',
  'ceil',
  'round',
  'abs',
  'min',
  'max',
] as const;

export type FormulaFunctionName = (typeof FORMULA_FUNCTIONS)[number];

const FUNCTION_NAMES = new Set<string>(FORMULA_FUNCTIONS);
const OPERATORS = new Set(['+', '-', '*', '/', '%', '^']);
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const NAME_RE = /[a-zA-Z_][a-zA-Z0-9_]*/y;
const NUMBER_RE = /\d+(?:\.\d+)?/y;

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

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index] as string;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/\d/.test(char)) {
      NUMBER_RE.lastIndex = index;
      const match = NUMBER_RE.exec(expression);
      if (!match) {
        throw new FormulaParseError(
          'FORMULA_SYNTAX',
          'Invalid number literal in formula',
        );
      }
      tokens.push({ type: 'number', value: match[0] });
      index += match[0].length;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      NAME_RE.lastIndex = index;
      const match = NAME_RE.exec(expression);
      if (!match) {
        throw new FormulaParseError(
          'FORMULA_SYNTAX',
          'Invalid identifier in formula',
        );
      }
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

    throw new FormulaParseError(
      'FORMULA_SYNTAX',
      `Unexpected character "${char}" in formula`,
    );
  }

  return tokens;
}

class Parser {
  private position = 0;
  private depth = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): FormulaNode {
    const expression = this.parseExpression();

    if (this.position !== this.tokens.length) {
      throw new FormulaParseError(
        'FORMULA_SYNTAX',
        'Unexpected trailing tokens in formula',
      );
    }

    return expression;
  }

  private enter(): void {
    this.depth += 1;
    if (this.depth > MAX_NESTING_DEPTH) {
      throw new FormulaParseError(
        'FORMULA_SYNTAX',
        'Formula is nested too deeply',
      );
    }
  }

  private leave(): void {
    this.depth -= 1;
  }

  private parseExpression(): FormulaNode {
    this.enter();

    let left = this.parseTerm();

    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      const operator = this.consume().value as '+' | '-';
      const right = this.parseTerm();
      left = { type: 'binary', operator, left, right };
    }

    this.leave();
    return left;
  }

  private parseTerm(): FormulaNode {
    let left = this.parseFactor();

    while (
      this.peek()?.value === '*' ||
      this.peek()?.value === '/' ||
      this.peek()?.value === '%'
    ) {
      const operator = this.consume().value as '*' | '/' | '%';
      const right = this.parseFactor();
      left = { type: 'binary', operator, left, right };
    }

    return left;
  }

  private parseFactor(): FormulaNode {
    const left = this.parseUnary();

    if (this.peek()?.value === '^') {
      this.consume();
      const right = this.parseFactor();
      return { type: 'binary', operator: '^', left, right };
    }

    return left;
  }

  private parseUnary(): FormulaNode {
    const token = this.peek();

    if (token?.value === '+' || token?.value === '-') {
      this.consume();
      return {
        type: 'unary',
        operator: token.value,
        operand: this.parseUnary(),
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): FormulaNode {
    const token = this.peek();

    if (!token) {
      throw new FormulaParseError(
        'FORMULA_SYNTAX',
        'Unexpected end of formula',
      );
    }

    if (token.type === 'number') {
      this.consume();
      return { type: 'number', value: Number(token.value) };
    }

    if (token.type === 'lparen') {
      this.consume();
      const expression = this.parseExpression();
      const closing = this.consume();
      if (closing.type !== 'rparen') {
        throw new FormulaParseError(
          'FORMULA_SYNTAX',
          'Expected ")" in formula',
        );
      }
      return expression;
    }

    if (token.type === 'identifier') {
      this.consume();

      if (this.peek()?.type === 'lparen') {
        this.consume();
        return this.parseFunctionCall(token.value);
      }

      return { type: 'identifier', name: token.value };
    }

    throw new FormulaParseError(
      'FORMULA_SYNTAX',
      `Unexpected token "${token.value}" in formula`,
    );
  }

  private parseFunctionCall(name: string): FormulaNode {
    if (!FUNCTION_NAMES.has(name)) {
      throw new FormulaParseError(
        'FORMULA_UNKNOWN_FUNCTION',
        `Unknown function "${name}" in formula`,
      );
    }

    const args: FormulaNode[] = [];

    if (this.peek()?.type !== 'rparen') {
      args.push(this.parseExpression());
      while (this.peek()?.type === 'comma') {
        this.consume();
        args.push(this.parseExpression());
      }
    }

    const closing = this.consume();
    if (closing.type !== 'rparen') {
      throw new FormulaParseError(
        'FORMULA_SYNTAX',
        `Expected ")" to close function "${name}"`,
      );
    }

    return { type: 'call', name: name as FormulaFunctionName, arguments: args };
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(): Token {
    const token = this.tokens[this.position];
    if (!token) {
      throw new FormulaParseError(
        'FORMULA_SYNTAX',
        'Unexpected end of formula',
      );
    }
    this.position += 1;
    return token;
  }
}

export function parseFormula(expression: string): FormulaNode {
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new FormulaParseError('FORMULA_EMPTY', 'Formula is empty');
  }

  if (trimmed.length > MAX_FORMULA_LENGTH) {
    throw new FormulaParseError(
      'FORMULA_TOO_LONG',
      `Formula exceeds the maximum length of ${MAX_FORMULA_LENGTH} characters`,
    );
  }

  return new Parser(tokenize(trimmed)).parse();
}

function hasOwn(target: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(target, key);
}

class Evaluator {
  private nullValue = false;

  constructor(private readonly values: FormulaValues) {}

  evaluate(node: FormulaNode): number {
    switch (node.type) {
      case 'number':
        return node.value;
      case 'identifier':
        return this.resolveIdentifier(node.name);
      case 'unary': {
        const value = this.evaluate(node.operand);
        return node.operator === '-' ? -value : value;
      }
      case 'binary':
        return this.evaluateBinary(node);
      case 'call':
        return this.evaluateCall(node.name, node.arguments);
    }
  }

  producedNull(): boolean {
    return this.nullValue;
  }

  private resolveIdentifier(name: string): number {
    if (!hasOwn(this.values, name)) {
      this.nullValue = true;
      return 0;
    }

    const value = this.values[name];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      this.nullValue = true;
      return 0;
    }

    return value;
  }

  private evaluateBinary(
    node: Extract<FormulaNode, { type: 'binary' }>,
  ): number {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    if (this.nullValue) {
      return 0;
    }

    let result: number;

    switch (node.operator) {
      case '+':
        result = left + right;
        break;
      case '-':
        result = left - right;
        break;
      case '*':
        result = left * right;
        break;
      case '/':
      case '%':
        if (right === 0) {
          this.nullValue = true;
          return 0;
        }
        result = node.operator === '/' ? left / right : left % right;
        break;
      case '^':
        result = Math.pow(left, right);
        break;
    }

    if (!Number.isFinite(result)) {
      this.nullValue = true;
      return 0;
    }

    return result;
  }

  private evaluateCall(name: FormulaFunctionName, args: FormulaNode[]): number {
    const values = args.map((arg) => this.evaluate(arg));

    if (this.nullValue) {
      return 0;
    }

    let result: number;

    switch (name) {
      case 'floor':
        result = Math.floor(values[0] as number);
        break;
      case 'ceil':
        result = Math.ceil(values[0] as number);
        break;
      case 'round':
        result = Math.round(values[0] as number);
        break;
      case 'abs':
        result = Math.abs(values[0] as number);
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
    }

    if (!Number.isFinite(result)) {
      this.nullValue = true;
      return 0;
    }

    return result;
  }
}

export function evaluateFormula(
  expressionOrNode: string | FormulaNode,
  values: FormulaValues = {},
): number | null {
  const node =
    typeof expressionOrNode === 'string'
      ? parseFormula(expressionOrNode)
      : expressionOrNode;

  const evaluator = new Evaluator(values);
  const result = evaluator.evaluate(node);

  if (evaluator.producedNull() || !Number.isFinite(result)) {
    return null;
  }

  return result;
}

export function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}

export function extractIdentifiers(expression: string): string[] {
  let tokens: Token[];

  try {
    tokens = tokenize(expression.trim());
  } catch {
    return [];
  }

  const identifiers: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token || token.type !== 'identifier') continue;

    const next = tokens[index + 1];
    if (next?.type === 'lparen') continue;

    if (!identifiers.includes(token.value)) {
      identifiers.push(token.value);
    }
  }

  return identifiers;
}

export const collectDependencies = extractIdentifiers;

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

const IDENTIFIER_GLOBAL_RE = /[a-zA-Z_][a-zA-Z0-9_]*/g;

export function renderExpressionWithLabels(
  expression: string,
  labelById: Record<string, string> = {},
): string {
  return expression.replace(IDENTIFIER_GLOBAL_RE, (token) =>
    hasOwn(labelById, token) ? `⟨${labelById[token]}⟩` : token,
  );
}
