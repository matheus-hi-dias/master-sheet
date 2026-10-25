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

export type FieldType = (typeof SUPPORTED_FIELD_TYPES)[number];

export interface SelectOption {
  label: string;
  value: string;
}

interface FieldDefinitionBase {
  id: string;
  label: string;
}

export interface NumberFieldDefinition extends FieldDefinitionBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface TextFieldDefinition extends FieldDefinitionBase {
  type: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
}

export interface DotsFieldDefinition extends FieldDefinitionBase {
  type: 'dots';
  maxDots: number;
  defaultValue?: number;
}

export interface SelectFieldDefinition extends FieldDefinitionBase {
  type: 'select';
  options: SelectOption[];
}

export interface CheckboxFieldDefinition extends FieldDefinitionBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface FormulaFieldDefinition extends FieldDefinitionBase {
  type: 'formula';
  expression: string;
  dependencies: string[];
}

export interface RepeaterFieldDefinition extends FieldDefinitionBase {
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

export interface SectionDefinition {
  id: string;
  title: string;
  columns?: number;
  fields: FieldDefinition[];
}

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  sections: SectionDefinition[];
}

export interface TemplateStructure {
  system: string;
  version: number;
  tabs: TabDefinition[];
}

export const DEFAULT_SYSTEMS = [
  'dnd5e',
  'vampire_v5',
  'tormenta20',
  'coc7e',
  'custom',
] as const;

export function isSupportedFieldType(type: string): type is FieldType {
  return (SUPPORTED_FIELD_TYPES as readonly string[]).includes(type);
}
