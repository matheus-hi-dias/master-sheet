import { BadRequestException } from '@nestjs/common';
import { assertValidFormula, extractIdentifiers } from './formula.util';

export const MAX_REPEATER_DEPTH = 6;

const NUMERIC_FIELD_TYPES = new Set(['number', 'dots', 'checkbox']);

interface FieldLike {
  id: string;
  type: string;
  expression?: string;
  dependencies?: string[];
  itemSchema?: FieldLike[];
}

interface StructureLike {
  system?: string;
  version?: number;
  tabs: {
    id: string;
    sections: {
      id: string;
      fields: FieldLike[];
    }[];
  }[];
}

export function collectFields(structure: StructureLike): FieldLike[] {
  const fields: FieldLike[] = [];

  const visit = (candidate: FieldLike, depth: number) => {
    if (depth > MAX_REPEATER_DEPTH) {
      throw new BadRequestException(
        `Template DSL is nested too deeply (max ${MAX_REPEATER_DEPTH} repeater levels)`,
      );
    }

    fields.push(candidate);

    if (Array.isArray(candidate.itemSchema)) {
      for (const child of candidate.itemSchema) {
        visit(child, depth + 1);
      }
    }
  };

  for (const tab of structure.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        visit(field, 0);
      }
    }
  }

  return fields;
}

/**
 * Validates formula fields in a template structure:
 * - rejects duplicate field ids (ambiguous references)
 * - rejects formulas with malformed expressions or unknown functions
 * - rejects identifiers used in an expression that are not declared as dependencies
 * - rejects formula dependencies that do not resolve to an existing numeric field
 * - rejects formula fields depending on other formula fields (depth = 1)
 *
 * Depth-1 enforcement makes cycles impossible: formula nodes only ever point
 * at base (non-formula) fields, so the dependency graph is guaranteed acyclic.
 */
export function validateFormulaDependencies(structure: StructureLike): void {
  const fields = collectFields(structure);
  const byId = new Map<string, FieldLike>();
  const errors: string[] = [];

  for (const field of fields) {
    if (byId.has(field.id)) {
      errors.push(`Duplicate field id "${field.id}"`);
    } else {
      byId.set(field.id, field);
    }
  }

  for (const field of fields) {
    if (field.type !== 'formula') {
      continue;
    }

    const expression = field.expression ?? '';
    let used: string[] = [];

    try {
      assertValidFormula(expression);
      used = extractIdentifiers(expression);
    } catch (error) {
      errors.push(
        `Formula field "${field.id}" has an invalid expression: ${
          (error as Error).message
        }`,
      );
      continue;
    }

    const declared = new Set(field.dependencies ?? []);

    for (const identifier of used) {
      if (!declared.has(identifier)) {
        errors.push(
          `Formula field "${field.id}" uses "${identifier}" but does not declare it as a dependency`,
        );
      }
    }

    for (const dep of field.dependencies ?? []) {
      const target = byId.get(dep);

      if (!target) {
        errors.push(
          `Formula field "${field.id}" references missing dependency "${dep}"`,
        );
        continue;
      }

      if (target.type === 'formula') {
        errors.push(
          `Formula field "${field.id}" cannot depend on another formula field "${dep}" (formula depth is limited to 1)`,
        );
        continue;
      }

      if (!NUMERIC_FIELD_TYPES.has(target.type)) {
        errors.push(
          `Formula field "${field.id}" depends on non-numeric field "${dep}"`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new BadRequestException({ message: errors });
  }
}
