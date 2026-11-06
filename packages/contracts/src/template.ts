import { z } from 'zod';

export const SUPPORTED_FIELD_TYPES = [
  'number',
  'text',
  'textarea',
  'dots',
  'select',
  'checkbox',
  'formula',
  'repeater',
] as const;

export const fieldTypeSchema = z.enum(SUPPORTED_FIELD_TYPES);
export type FieldType = z.infer<typeof fieldTypeSchema>;

export const DEFAULT_SYSTEMS = [
  'dnd5e',
  'vampire_v5',
  'tormenta20',
  'coc7e',
  'custom',
] as const;

export type SystemId = (typeof DEFAULT_SYSTEMS)[number];

export const SYSTEM_LABELS: Record<string, string> = {
  dnd5e: 'D&D 5e',
  vampire_v5: 'Vampire V5',
  tormenta20: 'Tormenta 20',
  coc7e: 'Call of Cthulhu 7e',
  custom: 'Custom',
};

export const MAX_FORMULA_LENGTH = 500;
export const MAX_NESTING_DEPTH = 50;
export const MAX_REPEATER_DEPTH = 6;

export const selectOptionSchema = z
  .strictObject({
    label: z.string(),
    value: z.string(),
  })
  .describe('A select field option');

export type SelectOption = z.infer<typeof selectOptionSchema>;

const fieldBase = {
  id: z.string().min(1).max(128),
  label: z.string().min(1).max(160),
};

export const numberFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('number'),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().finite().optional(),
  defaultValue: z.number().finite().optional(),
});

export type NumberFieldDefinition = z.infer<typeof numberFieldSchema>;

export const textFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.enum(['text', 'textarea']),
  placeholder: z.string().max(2000).optional(),
  maxLength: z.number().int().min(0).optional(),
});

export type TextFieldDefinition = z.infer<typeof textFieldSchema>;

export const dotsFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('dots'),
  maxDots: z.number().finite(),
  defaultValue: z.number().finite().optional(),
});

export type DotsFieldDefinition = z.infer<typeof dotsFieldSchema>;

export const selectFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('select'),
  options: z.array(selectOptionSchema).max(1000),
});

export type SelectFieldDefinition = z.infer<typeof selectFieldSchema>;

export const checkboxFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('checkbox'),
  defaultValue: z.boolean().optional(),
});

export type CheckboxFieldDefinition = z.infer<typeof checkboxFieldSchema>;

export const formulaFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('formula'),
  expression: z.string().max(MAX_FORMULA_LENGTH),
  dependencies: z.array(z.string().min(1).max(128)).max(500),
});

export type FormulaFieldDefinition = z.infer<typeof formulaFieldSchema>;

export interface RepeaterFieldDefinition {
  id: string;
  label: string;
  type: 'repeater';
  itemSchema: FieldDefinition[];
}

export type FieldDefinition =
  | NumberFieldDefinition
  | TextFieldDefinition
  | DotsFieldDefinition
  | SelectFieldDefinition
  | CheckboxFieldDefinition
  | FormulaFieldDefinition
  | RepeaterFieldDefinition;

const repeaterFieldSchema = z.strictObject({
  ...fieldBase,
  type: z.literal('repeater'),
  itemSchema: z.array(z.lazy(() => fieldDefinitionSchema)).max(50),
});

export const fieldDefinitionSchema: z.ZodType<FieldDefinition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    numberFieldSchema,
    textFieldSchema,
    dotsFieldSchema,
    selectFieldSchema,
    checkboxFieldSchema,
    formulaFieldSchema,
    repeaterFieldSchema,
  ]),
);

export const sectionDefinitionSchema = z.strictObject({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(160),
  columns: z.number().int().min(1).max(4).optional(),
  fields: z.array(fieldDefinitionSchema).max(100),
});

export type SectionDefinition = z.infer<typeof sectionDefinitionSchema>;

export const tabDefinitionSchema = z.strictObject({
  id: z.string().min(1).max(128),
  label: z.string().min(1).max(160),
  icon: z.string().max(64).optional(),
  sections: z.array(sectionDefinitionSchema).max(40),
});

export type TabDefinition = z.infer<typeof tabDefinitionSchema>;

export const templateStructureSchema = z.strictObject({
  system: z.string().min(1).max(64),
  version: z.number().int().min(1),
  tabs: z.array(tabDefinitionSchema).max(20),
});

export type TemplateStructure = z.infer<typeof templateStructureSchema>;

export function isSupportedFieldType(type: string): type is FieldType {
  return (SUPPORTED_FIELD_TYPES as readonly string[]).includes(type);
}

export function collectFields(structure: TemplateStructure): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  const visit = (candidate: FieldDefinition) => {
    fields.push(candidate);

    if (candidate.type === 'repeater') {
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
