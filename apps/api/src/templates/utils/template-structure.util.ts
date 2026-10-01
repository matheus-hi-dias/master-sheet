import { BadRequestException } from '@nestjs/common';

interface FieldLike {
  id: string;
  type: string;
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

  const visit = (candidate: FieldLike) => {
    fields.push(candidate);

    if (candidate.type === 'repeater' && candidate.itemSchema) {
      for (const child of candidate.itemSchema) {
        visit(child);
      }
    }
  };

  for (const tab of structure.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        visit(field);
      }
    }
  }

  return fields;
}

/**
 * Validates formula fields in a template structure:
 * - rejects duplicate field ids (ambiguous references)
 * - rejects formula dependencies that do not resolve to an existing field
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
      }
    }
  }

  if (errors.length > 0) {
    throw new BadRequestException({ message: errors });
  }
}
