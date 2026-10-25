import type {
  FieldDefinition,
  TemplateStructure,
} from '../types/template';

export function defaultFieldValue(field: FieldDefinition): unknown {
  switch (field.type) {
    case 'number':
      return field.defaultValue ?? 0;
    case 'dots':
      return field.defaultValue ?? 0;
    case 'checkbox':
      return field.defaultValue ?? false;
    case 'text':
    case 'textarea':
      return '';
    case 'select':
      return field.options?.[0]?.value ?? '';
    case 'formula':
      return undefined;
    case 'repeater':
      return [];
  }
}

export function buildDefaultValues(
  fields: FieldDefinition[],
  seed?: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (seed && field.id in seed) {
      values[field.id] = seed[field.id];
    } else {
      values[field.id] = defaultFieldValue(field);
    }
  }

  return values;
}

export function buildItemDefaults(
  itemSchema: FieldDefinition[],
): Record<string, unknown> {
  return buildDefaultValues(itemSchema);
}

export function structureDefaultValues(
  structure: TemplateStructure,
  seed?: Record<string, unknown>,
): Record<string, unknown> {
  const fields = structure.tabs.flatMap(tab =>
    tab.sections.flatMap(section => section.fields),
  );

  return buildDefaultValues(fields, seed);
}

export function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0) || 0;
}

export function toStringValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}