import { replaceIdentifier } from '../../../lib/formula';
import type {
  FieldDefinition,
  FieldType,
  SectionDefinition,
  TabDefinition,
  TemplateStructure,
} from '../../templates/types/template-structure';

export interface DepCandidate {
  id: string;
  label: string;
}

export const NUMERIC_FIELD_TYPES: readonly FieldType[] = [
  'number',
  'dots',
  'checkbox',
];

const DEFAULT_LABELS: Record<FieldType, string> = {
  number: 'Number',
  text: 'Text',
  textarea: 'Text area',
  dots: 'Dots',
  select: 'Select',
  checkbox: 'Checkbox',
  formula: 'Formula',
  repeater: 'Repeater',
};

export function slugify(value: string): string {
  const stripped = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!stripped) return 'field';

  const prefixed = /^[a-z]/.test(stripped) ? stripped : `f_${stripped}`;
  return prefixed.slice(0, 40).replace(/_+$/g, '');
}

export function uniqueId(base: string, taken: Iterable<string>): string {
  const set = taken instanceof Set ? taken : new Set(taken);
  if (!set.has(base)) return base;

  let suffix = 2;
  while (set.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

export function isAutoId(id: string, label: string): boolean {
  const base = slugify(label);
  if (id === base) return true;

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}_\\d+$`).test(id);
}

export function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createField(
  type: FieldType,
  taken: Iterable<string> = [],
): FieldDefinition {
  const label = DEFAULT_LABELS[type];
  const id = uniqueId(slugify(label), taken);

  switch (type) {
    case 'number':
      return { type, id, label, defaultValue: 0 };
    case 'text':
      return { type, id, label };
    case 'textarea':
      return { type, id, label };
    case 'dots':
      return { type, id, label, maxDots: 5, defaultValue: 0 };
    case 'select':
      return {
        type,
        id,
        label,
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      };
    case 'checkbox':
      return { type, id, label, defaultValue: false };
    case 'formula':
      return { type, id, label, expression: '0', dependencies: [] };
    case 'repeater':
      return { type, id, label, itemSchema: [] };
  }
}

export function createSection(taken: Iterable<string> = []): SectionDefinition {
  return {
    id: uniqueId(slugify('New section'), taken),
    title: 'New section',
    columns: 1,
    fields: [],
  };
}

export function createTab(taken: Iterable<string> = []): TabDefinition {
  const takenSet = new Set(taken);
  const id = uniqueId(slugify('New tab'), takenSet);
  return {
    id,
    label: 'New tab',
    sections: [createSection([...takenSet, id])],
  };
}

function updateTabs(
  structure: TemplateStructure,
  updater: (tabs: TabDefinition[]) => TabDefinition[],
): TemplateStructure {
  return { ...structure, tabs: updater(structure.tabs) };
}

export function addTab(
  structure: TemplateStructure,
  tab: TabDefinition,
): TemplateStructure {
  return updateTabs(structure, (tabs) => [...tabs, tab]);
}

export function renameTab(
  structure: TemplateStructure,
  tabId: string,
  label: string,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) => (tab.id === tabId ? { ...tab, label } : tab)),
  );
}

export function removeTab(
  structure: TemplateStructure,
  tabId: string,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.filter((tab) => tab.id !== tabId),
  );
}

export function moveTab(
  structure: TemplateStructure,
  tabId: string,
  direction: -1 | 1,
): TemplateStructure {
  return updateTabs(structure, (tabs) => {
    const index = tabs.findIndex((tab) => tab.id === tabId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= tabs.length) return tabs;
    const clone = [...tabs];
    const [moved] = clone.splice(index, 1);
    clone.splice(target, 0, moved);
    return clone;
  });
}

export function addSection(
  structure: TemplateStructure,
  tabId: string,
  section: SectionDefinition,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? { ...tab, sections: [...tab.sections, section] }
        : tab,
    ),
  );
}

export function patchSection(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  patch: Partial<SectionDefinition>,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.map((section) =>
              section.id === sectionId
                ? { ...section, ...patch }
                : section,
            ),
          }
        : tab,
    ),
  );
}

export function removeSection(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.filter((section) => section.id !== sectionId),
          }
        : tab,
    ),
  );
}

export function moveSection(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  direction: -1 | 1,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) => {
      if (tab.id !== tabId) return tab;
      const index = tab.sections.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= tab.sections.length) return tab;
      const clone = [...tab.sections];
      const [moved] = clone.splice(index, 1);
      clone.splice(target, 0, moved);
      return { ...tab, sections: clone };
    }),
  );
}

export function addField(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  field: FieldDefinition,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.map((section) =>
              section.id === sectionId
                ? { ...section, fields: [...section.fields, field] }
                : section,
            ),
          }
        : tab,
    ),
  );
}

export function replaceField(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  fieldId: string,
  field: FieldDefinition,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    fields: section.fields.map((candidate) =>
                      candidate.id === fieldId ? field : candidate,
                    ),
                  }
                : section,
            ),
          }
        : tab,
    ),
  );
}

export function removeField(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  fieldId: string,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    fields: section.fields.filter((field) => field.id !== fieldId),
                  }
                : section,
            ),
          }
        : tab,
    ),
  );
}

export function moveField(
  structure: TemplateStructure,
  tabId: string,
  sectionId: string,
  fieldId: string,
  direction: -1 | 1,
): TemplateStructure {
  return updateTabs(structure, (tabs) =>
    tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            sections: tab.sections.map((section) => {
              if (section.id !== sectionId) return section;
              const index = section.fields.findIndex(
                (field) => field.id === fieldId,
              );
              const target = index + direction;
              if (index < 0 || target < 0 || target >= section.fields.length) {
                return section;
              }
              const clone = [...section.fields];
              const [moved] = clone.splice(index, 1);
              clone.splice(target, 0, moved);
              return { ...section, fields: clone };
            }),
          }
        : tab,
    ),
  );
}

function collectTopLevelFields(
  structure: TemplateStructure,
): FieldDefinition[] {
  return structure.tabs.flatMap((tab) =>
    tab.sections.flatMap((section) => section.fields),
  );
}

export function collectAllFields(
  fields: FieldDefinition[],
): FieldDefinition[] {
  return fields.flatMap((field) =>
    field.type === 'repeater'
      ? [field, ...collectAllFields(field.itemSchema ?? [])]
      : [field],
  );
}

export function collectAllIds(structure: TemplateStructure): string[] {
  const ids: string[] = [];

  for (const tab of structure.tabs) {
    ids.push(tab.id);
    for (const section of tab.sections) {
      ids.push(section.id);
      for (const field of collectAllFields(section.fields)) {
        ids.push(field.id);
      }
    }
  }

  return ids;
}

export function fieldLabelMap(
  structure: TemplateStructure,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of collectAllFields(collectTopLevelFields(structure))) {
    map[field.id] = field.label;
  }
  return map;
}

function rewireField(
  field: FieldDefinition,
  oldId: string,
  newId: string,
): FieldDefinition {
  const id = field.id === oldId ? newId : field.id;

  if (field.type === 'formula') {
    const dependencies = Array.from(
      new Set(field.dependencies.map((dep) => (dep === oldId ? newId : dep))),
    );
    return {
      ...field,
      id,
      dependencies,
      expression: replaceIdentifier(field.expression, oldId, newId),
    };
  }

  if (field.type === 'repeater') {
    return {
      ...field,
      id,
      itemSchema: (field.itemSchema ?? []).map((child) =>
        rewireField(child, oldId, newId),
      ),
    };
  }

  return { ...field, id };
}

export function rewireFieldId(
  structure: TemplateStructure,
  oldId: string,
  newId: string,
): TemplateStructure {
  if (!oldId || oldId === newId) return structure;

  return updateTabs(structure, (tabs) =>
    tabs.map((tab) => ({
      ...tab,
      sections: tab.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => rewireField(field, oldId, newId)),
      })),
    })),
  );
}

export function dependencyCandidates(
  structure: TemplateStructure,
  excludeId?: string,
): DepCandidate[] {
  return collectTopLevelFields(structure)
    .filter(
      (field) =>
        field.id !== excludeId &&
        NUMERIC_FIELD_TYPES.includes(field.type),
    )
    .map((field) => ({ id: field.id, label: field.label }));
}

export function validateStructure(
  structure: TemplateStructure,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const numericLike = new Set<string>();

  for (const field of collectTopLevelFields(structure)) {
    if (NUMERIC_FIELD_TYPES.includes(field.type)) {
      numericLike.add(field.id);
    }
  }

  for (const field of collectTopLevelFields(structure)) {
    if (seen.has(field.id)) {
      errors.push(`Duplicate field id "${field.id}"`);
    }
    seen.add(field.id);

    if (field.type === 'formula') {
      for (const dep of field.dependencies) {
        if (!numericLike.has(dep)) {
          errors.push(
            `Formula "${field.label}" references "${dep}", which is not a numeric field`,
          );
        }
      }
    }
  }

  return errors;
}