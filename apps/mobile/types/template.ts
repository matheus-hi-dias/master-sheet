export type FieldType =
  | 'number'
  | 'text'
  | 'textarea'
  | 'dots'
  | 'select'
  | 'checkbox'
  | 'formula'
  | 'repeater';

export interface SelectOption {
  label: string;
  value: string;
}

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

export interface TemplateTag {
  id: string;
  name: string;
}

export interface TemplateAuthor {
  id: string;
  name: string | null;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  structure: TemplateStructure;
  system: string;
  version: number;
  isPublic: boolean;
  isOfficial: boolean;
  createdAt: string;
  authorId: string;
  author: TemplateAuthor | null;
  tags: TemplateTag[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

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