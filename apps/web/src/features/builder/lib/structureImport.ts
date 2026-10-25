import type {
  FieldDefinition,
  FieldType,
  TemplateStructure,
} from '../../templates/types/template-structure';

const FIELD_TYPES: FieldType[] = [
  'number',
  'text',
  'textarea',
  'dots',
  'select',
  'checkbox',
  'formula',
  'repeater',
];

export function parseTemplateStructure(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false as const, error: 'Invalid JSON document' };
  }
  return validateNode(parsed, 0);
}

function validateNode(
  node: unknown,
  depth: number,
):
  | { ok: true; value: TemplateStructure }
  | { ok: false; error: string } {
  if (depth > 6) {
    return { ok: false, error: 'Template DSL is nested too deeply' };
  }

  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return { ok: false, error: 'Root must be a JSON object with tabs' };
  }

  const value = node as Record<string, unknown>;

  if (typeof value.system !== 'string') {
    return { ok: false, error: 'Missing string field "system"' };
  }
  if (typeof value.version !== 'number') {
    return { ok: false, error: 'Missing number field "version"' };
  }
  if (!Array.isArray(value.tabs) || value.tabs.length === 0) {
    return { ok: false, error: 'Missing non-empty array field "tabs"' };
  }

  const tabs = value.tabs.map(
    (tabNode, tabIndex): { id: string; label: string; sections: unknown[] } => {
      const tab = tabNode as Record<string, unknown>;
      const sections = Array.isArray(tab.sections) ? tab.sections : [];
      return {
        id: typeof tab.id === 'string' ? tab.id : `t_${tabIndex}`,
        label: typeof tab.label === 'string' ? tab.label : `Tab ${tabIndex + 1}`,
        sections,
      };
    },
  );

  const tabsOut = tabs.map((tab) => {
    const sectionsOut = tab.sections.map((sectionNode, sectionIndex) => {
      const section = sectionNode as Record<string, unknown>;
      const fields = Array.isArray(section.fields) ? section.fields : [];
      const columns = Number(section.columns);
      return {
        id: typeof section.id === 'string' ? section.id : `s_${sectionIndex}`,
        title:
          typeof section.title === 'string'
            ? section.title
            : `Section ${sectionIndex + 1}`,
        columns:
          Number.isInteger(columns) ? Math.max(1, Math.min(4, columns)) : 1,
        fields: parseFields(fields, depth + 1),
      };
    });

    return { id: tab.id, label: tab.label, sections: sectionsOut };
  });

  return {
    ok: true,
    value: {
      system: value.system as string,
      version: value.version as number,
      tabs: tabsOut,
    },
  };
}

function parseFields(fields: unknown[], depth: number): FieldDefinition[] {
  return fields.map((fieldNode, index) => {
    const field = fieldNode as Record<string, unknown>;
    const type = FIELD_TYPES.includes(field.type as FieldType)
      ? (field.type as FieldType)
      : 'text';
    const id = typeof field.id === 'string' ? field.id : `f_${index}`;
    const label = typeof field.label === 'string' ? field.label : id;

    switch (type) {
      case 'number':
        return {
          type,
          id,
          label,
          min: typeof field.min === 'number' ? field.min : undefined,
          max: typeof field.max === 'number' ? field.max : undefined,
          step: typeof field.step === 'number' ? field.step : undefined,
          defaultValue:
            typeof field.defaultValue === 'number' ? field.defaultValue : 0,
        };
      case 'text':
      case 'textarea':
        return {
          type,
          id,
          label,
          placeholder:
            typeof field.placeholder === 'string' ? field.placeholder : undefined,
          maxLength: typeof field.maxLength === 'number' ? field.maxLength : undefined,
        };
      case 'dots':
        return {
          type,
          id,
          label,
          maxDots: typeof field.maxDots === 'number' ? field.maxDots : 5,
          defaultValue:
            typeof field.defaultValue === 'number' ? field.defaultValue : 0,
        };
      case 'select':
        return {
          type,
          id,
          label,
          options: Array.isArray(field.options)
            ? field.options.map((option) => {
                const o = option as Record<string, unknown>;
                return {
                  label: typeof o.label === 'string' ? o.label : String(o.value ?? ''),
                  value: typeof o.value === 'string' ? o.value : String(o.value ?? ''),
                };
              })
            : [],
        };
      case 'checkbox':
        return {
          type,
          id,
          label,
          defaultValue: Boolean(field.defaultValue),
        };
      case 'formula':
        return {
          type,
          id,
          label,
          expression: typeof field.expression === 'string' ? field.expression : '0',
          dependencies: Array.isArray(field.dependencies)
            ? field.dependencies.filter(
                (dep): dep is string => typeof dep === 'string',
              )
            : [],
        };
      case 'repeater':
        return {
          type,
          id,
          label,
          itemSchema: Array.isArray(field.itemSchema)
            ? parseFields(field.itemSchema as unknown[], depth + 1)
            : [],
        };
    }
  });
}