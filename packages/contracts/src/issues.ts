import { z } from 'zod';

export const ISSUE_CODES = [
  'INVALID_TYPE',
  'INVALID_VALUE',
  'UNKNOWN_PROPERTY',
  'DUPLICATE_FIELD_ID',
  'REPEATER_DEPTH_EXCEEDED',
  'FORMULA_EMPTY',
  'FORMULA_TOO_LONG',
  'FORMULA_SYNTAX',
  'FORMULA_UNKNOWN_FUNCTION',
  'FORMULA_UNDECLARED_DEPENDENCY',
  'FORMULA_MISSING_DEPENDENCY',
  'FORMULA_NON_NUMERIC_DEPENDENCY',
  'FORMULA_DEPENDENCY_ON_FORMULA',
  'FORMULA_CYCLE',
  'SHEET_INVALID_PAYLOAD',
  'SHEET_FIELD_TYPE_MISMATCH',
  'SHEET_VALUE_RANGE',
  'SHEET_VALUE_NOT_IN_OPTIONS',
  'SHEET_VALUE_TOO_LONG',
  'SHEET_MAX_DOTS_EXCEEDED',
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

export const issueCodeSchema = z.enum(ISSUE_CODES);

export interface ValidationIssue {
  code: IssueCode;
  path: Array<string | number>;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: ValidationIssue[] };

export function issue(
  code: IssueCode,
  path: Array<string | number>,
  message: string,
): ValidationIssue {
  return { code, path, message };
}
