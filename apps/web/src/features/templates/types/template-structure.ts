export type FieldType =
  | 'number'
  | 'text'
  | 'textarea'
  | 'dots'
  | 'select'
  | 'checkbox'
  | 'formula'
  | 'repeater';

export const DEFAULT_SYSTEMS = [
  'dnd5e',
  'vampire_v5',
  'tormenta20',
  'coc7e',
  'custom',
] as const;

export const SYSTEM_LABELS: Record<string, string> = {
  dnd5e: 'D&D 5e',
  vampire_v5: 'Vampire V5',
  tormenta20: 'Tormenta 20',
  coc7e: 'Call of Cthulhu 7e',
  custom: 'Custom',
};

interface FieldBase {
  id: string;
  label: string;
  type: FieldType;
}

export interface NumberFieldDefinition extends FieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface TextFieldDefinition extends FieldBase {
  type: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
}

export interface DotsFieldDefinition extends FieldBase {
  type: 'dots';
  maxDots?: number;
  defaultValue?: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldDefinition extends FieldBase {
  type: 'select';
  options?: SelectOption[];
}

export interface CheckboxFieldDefinition extends FieldBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface FormulaFieldDefinition extends FieldBase {
  type: 'formula';
  expression: string;
  dependencies: string[];
}

export interface RepeaterFieldDefinition extends FieldBase {
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