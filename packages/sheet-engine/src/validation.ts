import {
  MAX_REPEATER_DEPTH,
  collectFields,
  issue,
  templateStructureSchema,
  type FieldDefinition,
  type SheetData,
  type TemplateStructure,
  type ValidationIssue,
  type ValidationResult,
} from '@master-sheet/contracts';
import {
  collectDependencies,
  FormulaParseError,
  parseFormula,
} from './formula';
import { detectCycles } from './graph';

const NUMERIC_FIELD_TYPES = new Set(['number', 'dots', 'checkbox']);

interface LocatedField {
  field: FieldDefinition;
  path: Array<string | number>;
  depth: number;
}

interface ZodIssueLike {
  code: string;
  path?: PropertyKey[];
  message: string;
  keys?: string[];
}

function toPath(path: PropertyKey[] | undefined): Array<string | number> {
  return (path ?? []).map((part) =>
    typeof part === 'number' ? part : String(part),
  );
}

function mapZodIssues(issues: ZodIssueLike[]): ValidationIssue[] {
  const mapped: ValidationIssue[] = [];

  for (const zodIssue of issues) {
    const path = toPath(zodIssue.path);

    if (zodIssue.code === 'unrecognized_keys') {
      for (const key of zodIssue.keys ?? []) {
        mapped.push(
          issue(
            'UNKNOWN_PROPERTY',
            [...path, key],
            `Unrecognized property "${key}"`,
          ),
        );
      }
      continue;
    }

    if (zodIssue.code === 'invalid_type') {
      mapped.push(issue('INVALID_TYPE', path, zodIssue.message));
      continue;
    }

    mapped.push(issue('INVALID_VALUE', path, zodIssue.message));
  }

  return mapped;
}

function locateFields(structure: TemplateStructure): {
  fields: LocatedField[];
  issues: ValidationIssue[];
} {
  const fields: LocatedField[] = [];
  const issues: ValidationIssue[] = [];

  const visit = (
    field: FieldDefinition,
    path: Array<string | number>,
    depth: number,
  ): void => {
    fields.push({ field, path, depth });

    if (field.type !== 'repeater') {
      return;
    }

    if (depth + 1 > MAX_REPEATER_DEPTH) {
      issues.push(
        issue(
          'REPEATER_DEPTH_EXCEEDED',
          path,
          `Template DSL is nested too deeply (max ${MAX_REPEATER_DEPTH} repeater levels)`,
        ),
      );
      return;
    }

    field.itemSchema.forEach((child, index) => {
      visit(child, [...path, 'itemSchema', index], depth + 1);
    });
  };

  structure.tabs.forEach((tab, tabIndex) => {
    tab.sections.forEach((section, sectionIndex) => {
      section.fields.forEach((field, fieldIndex) => {
        visit(
          field,
          ['tabs', tabIndex, 'sections', sectionIndex, 'fields', fieldIndex],
          0,
        );
      });
    });
  });

  return { fields, issues };
}

export function validateTemplateStructure(
  input: unknown,
): ValidationResult<TemplateStructure> {
  const parsed = templateStructureSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      issues: mapZodIssues(parsed.error.issues as ZodIssueLike[]),
    };
  }

  const structure = parsed.data;
  const located = locateFields(structure);
  const issues: ValidationIssue[] = [...located.issues];
  const byId = new Map<string, FieldDefinition>();

  for (const { field, path } of located.fields) {
    if (byId.has(field.id)) {
      issues.push(
        issue('DUPLICATE_FIELD_ID', path, `Duplicate field id "${field.id}"`),
      );
    } else {
      byId.set(field.id, field);
    }
  }

  const formulaFields = located.fields.filter(
    (
      entry,
    ): entry is LocatedField & {
      field: Extract<FieldDefinition, { type: 'formula' }>;
    } => entry.field.type === 'formula',
  );

  for (const { field, path } of formulaFields) {
    const expression = field.expression;

    try {
      parseFormula(expression);
    } catch (error) {
      if (error instanceof FormulaParseError) {
        issues.push(
          issue(
            error.code,
            path,
            `Formula field "${field.id}" has an invalid expression: ${error.message}`,
          ),
        );
        continue;
      }
      throw error;
    }

    const declared = new Set(field.dependencies);
    const used = collectDependencies(expression);

    for (const identifier of used) {
      if (!declared.has(identifier)) {
        issues.push(
          issue(
            'FORMULA_UNDECLARED_DEPENDENCY',
            path,
            `Formula field "${field.id}" uses "${identifier}" but does not declare it as a dependency`,
          ),
        );
      }
    }

    for (const dependency of field.dependencies) {
      const target = byId.get(dependency);

      if (!target) {
        issues.push(
          issue(
            'FORMULA_MISSING_DEPENDENCY',
            path,
            `Formula field "${field.id}" references missing dependency "${dependency}"`,
          ),
        );
        continue;
      }

      if (target.type === 'formula') {
        issues.push(
          issue(
            'FORMULA_DEPENDENCY_ON_FORMULA',
            path,
            `Formula field "${field.id}" cannot depend on another formula field "${dependency}" (formula depth is limited to 1)`,
          ),
        );
        continue;
      }

      if (!NUMERIC_FIELD_TYPES.has(target.type)) {
        issues.push(
          issue(
            'FORMULA_NON_NUMERIC_DEPENDENCY',
            path,
            `Formula field "${field.id}" depends on non-numeric field "${dependency}"`,
          ),
        );
      }
    }
  }

  const formulaIds = new Set(formulaFields.map((entry) => entry.field.id));
  const graph = new Map<string, string[]>();

  for (const { field } of formulaFields) {
    graph.set(
      field.id,
      field.dependencies.filter((dependency) => formulaIds.has(dependency)),
    );
  }

  for (const cycle of detectCycles(graph)) {
    const first = cycle[0];
    const locatedField = formulaFields.find(
      (entry) => entry.field.id === first,
    );

    issues.push(
      issue(
        'FORMULA_CYCLE',
        locatedField?.path ?? [],
        `Circular formula dependency detected: ${cycle.join(' → ')}`,
      ),
    );
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, data: structure };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateFieldValue(
  field: FieldDefinition,
  value: unknown,
  path: Array<string | number>,
): ValidationIssue[] {
  if (value === undefined || value === null) {
    return [];
  }

  switch (field.type) {
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects a number`,
          ),
        ];
      }

      if (
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      ) {
        return [
          issue(
            'SHEET_VALUE_RANGE',
            path,
            `Field "${field.id}" must be between ${field.min ?? '-∞'} and ${field.max ?? '∞'}`,
          ),
        ];
      }

      return [];
    }

    case 'dots': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects a number of dots`,
          ),
        ];
      }

      if (value < 0) {
        return [
          issue(
            'SHEET_VALUE_RANGE',
            path,
            `Field "${field.id}" cannot be negative`,
          ),
        ];
      }

      if (value > field.maxDots) {
        return [
          issue(
            'SHEET_MAX_DOTS_EXCEEDED',
            path,
            `Field "${field.id}" exceeds the maximum of ${field.maxDots} dots`,
          ),
        ];
      }

      return [];
    }

    case 'text':
    case 'textarea': {
      if (typeof value !== 'string') {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects text`,
          ),
        ];
      }

      if (field.maxLength !== undefined && value.length > field.maxLength) {
        return [
          issue(
            'SHEET_VALUE_TOO_LONG',
            path,
            `Field "${field.id}" exceeds ${field.maxLength} characters`,
          ),
        ];
      }

      return [];
    }

    case 'checkbox': {
      if (typeof value !== 'boolean') {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects a boolean`,
          ),
        ];
      }

      return [];
    }

    case 'select': {
      if (typeof value !== 'string') {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects a select option`,
          ),
        ];
      }

      if (!field.options.some((option) => option.value === value)) {
        return [
          issue(
            'SHEET_VALUE_NOT_IN_OPTIONS',
            path,
            `Field "${field.id}" value "${value}" is not a declared option`,
          ),
        ];
      }

      return [];
    }

    case 'formula': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return [
          issue(
            'SHEET_FIELD_TYPE_MISMATCH',
            path,
            `Field "${field.id}" expects a numeric formula result`,
          ),
        ];
      }

      return [];
    }

    case 'repeater': {
      if (!Array.isArray(value)) {
        return [
          issue(
            'SHEET_INVALID_PAYLOAD',
            path,
            `Field "${field.id}" expects an array of rows`,
          ),
        ];
      }

      const issues: ValidationIssue[] = [];

      value.forEach((row, rowIndex) => {
        if (!isRecord(row)) {
          issues.push(
            issue(
              'SHEET_INVALID_PAYLOAD',
              [...path, rowIndex],
              `Field "${field.id}" row ${rowIndex} must be an object`,
            ),
          );
          return;
        }

        validateFields(field.itemSchema, row, [...path, rowIndex], issues);
      });

      return issues;
    }
  }
}

function validateFields(
  fields: FieldDefinition[],
  data: Record<string, unknown>,
  basePath: Array<string | number>,
  issues: ValidationIssue[],
): void {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field.id)) {
      continue;
    }

    issues.push(
      ...validateFieldValue(field, data[field.id], [...basePath, field.id]),
    );
  }
}

export function validateSheetData(
  structure: TemplateStructure,
  input: unknown,
): ValidationResult<SheetData> {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [
        issue('SHEET_INVALID_PAYLOAD', [], 'Sheet data must be an object'),
      ],
    };
  }

  const fields = structure.tabs.flatMap((tab) =>
    tab.sections.flatMap((section) => section.fields),
  );
  const issues: ValidationIssue[] = [];

  validateFields(fields, input, [], issues);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, data: input };
}

export { collectFields };
