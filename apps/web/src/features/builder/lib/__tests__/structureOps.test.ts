import type { TemplateStructure } from '../../../templates/types/template-structure';
import {
  addField,
  createField,
  dependencyCandidates,
  fieldLabelMap,
  isAutoId,
  removeField,
  rewireFieldId,
  slugify,
  uniqueId,
  validateStructure,
} from '../structureOps';
import { parseTemplateStructure } from '../structureImport';

function baseStructure(): TemplateStructure {
  return {
    system: 'dnd5e',
    version: 1,
    tabs: [
      {
        id: 't_1',
        label: 'Core',
        sections: [
          {
            id: 's_1',
            title: 'Attributes',
            columns: 2,
            fields: [
              { type: 'number', id: 'str', label: 'Strength', defaultValue: 10 },
              { type: 'number', id: 'dex', label: 'Dexterity', defaultValue: 10 },
              {
                type: 'formula',
                id: 'initiative',
                label: 'Initiative',
                expression: '(str + dex) / 2',
                dependencies: ['str', 'dex'],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('structureOps', () => {
  it('validates a well-formed structure without errors', () => {
    expect(validateStructure(baseStructure())).toEqual([]);
  });

  it('rejects duplicate field ids', () => {
    const structure = baseStructure();
    structure.tabs[0].sections[0].fields.push({
      type: 'number',
      id: 'str',
      label: 'Duplicate',
    });
    expect(validateStructure(structure)).toHaveLength(1);
  });

  it('rejects formulas referencing other formula or repeater fields', () => {
    const structure = baseStructure();
    structure.tabs[0].sections[0].fields.push({
      type: 'formula',
      id: 'other_formula',
      label: 'Other',
      expression: 'str + 1',
      dependencies: ['str'],
    });
    structure.tabs[0].sections[0].fields.push({
      type: 'formula',
      id: 'bad',
      label: 'Bad',
      expression: 'other_formula + 1',
      dependencies: ['other_formula'],
    });
    const errors = validateStructure(structure);
    expect(errors.some((error) => error.includes('other_formula'))).toBe(true);
  });

  it('creates fields with readable, label-derived ids', () => {
    const field = createField('number');
    expect(field.type).toBe('number');
    expect(field.id).toBe('number');
  });

  it('deduplicates generated field ids against existing ids', () => {
    const field = createField('number', ['number', 'number_2']);
    expect(field.id).toBe('number_3');
  });

  it('exposes only numeric top-level fields as dependency candidates', () => {
    const structure = baseStructure();
    structure.tabs[0].sections[0].fields.push({
      type: 'text',
      id: 'name',
      label: 'Name',
    });
    structure.tabs[0].sections[0].fields.push({
      type: 'checkbox',
      id: 'proficient',
      label: 'Proficient',
      defaultValue: false,
    });
    structure.tabs[0].sections[0].fields.push({
      type: 'repeater',
      id: 'spells',
      label: 'Spells',
      itemSchema: [{ type: 'text', id: 'inner', label: 'Inner' }],
    });
    const candidates = dependencyCandidates(structure, 'initiative');
    const ids = candidates.map((c) => c.id);
    expect(ids).toEqual(['str', 'dex', 'proficient']);
    expect(ids).not.toContain('name');
    expect(ids).not.toContain('initiative');
    expect(ids).not.toContain('spells');
    expect(ids).not.toContain('inner');
  });

  it('adds and removes fields immutably', () => {
    const structure = baseStructure();
    const field = createField('checkbox');
    const withField = addField(structure, 't_1', 's_1', field);
    expect(withField.tabs[0].sections[0].fields).toHaveLength(4);
    expect(structure.tabs[0].sections[0].fields).toHaveLength(3);

    const withoutField = removeField(withField, 't_1', 's_1', field.id);
    expect(withoutField.tabs[0].sections[0].fields).toHaveLength(3);
  });
});

describe('slugify and id helpers', () => {
  it('slugifies labels with accents and spacing', () => {
    expect(slugify('Força')).toBe('forca');
    expect(slugify('Força de Vontade')).toBe('forca_de_vontade');
    expect(slugify('  Hit Points (Max) ')).toBe('hit_points_max');
  });

  it('prefixes slugs that would start with a digit', () => {
    expect(slugify('2d6')).toBe('f_2d6');
  });

  it('falls back when the label has no usable characters', () => {
    expect(slugify('@#$')).toBe('field');
  });

  it('deduplicates ids with numeric suffixes', () => {
    expect(uniqueId('str', ['str'])).toBe('str_2');
    expect(uniqueId('str', ['str', 'str_2'])).toBe('str_3');
    expect(uniqueId('str', ['dex'])).toBe('str');
  });

  it('detects auto-derived ids including deduplicated variants', () => {
    expect(isAutoId('forca', 'Força')).toBe(true);
    expect(isAutoId('forca_2', 'Força')).toBe(true);
    expect(isAutoId('f_x7k9qm', 'Força')).toBe(false);
  });
});

describe('rewireFieldId', () => {
  it('rewrites references in formula dependencies and expressions', () => {
    const structure = baseStructure();
    const rewired = rewireFieldId(structure, 'str', 'strength');
    const fields = rewired.tabs[0].sections[0].fields;
    const formula = fields.find((field) => field.type === 'formula');
    expect(fields[0].id).toBe('strength');
    expect(formula && formula.type === 'formula' ? formula.expression : '').toBe(
      '(strength + dex) / 2',
    );
    expect(
      formula && formula.type === 'formula' ? formula.dependencies : [],
    ).toEqual(['strength', 'dex']);
    expect(fieldLabelMap(rewired)).toEqual({
      strength: 'Strength',
      dex: 'Dexterity',
      initiative: 'Initiative',
    });
  });

  it('rewires field ids inside repeater item schemas', () => {
    const structure = baseStructure();
    structure.tabs[0].sections[0].fields.push({
      type: 'repeater',
      id: 'attacks',
      label: 'Attacks',
      itemSchema: [
        { type: 'number', id: 'bonus', label: 'Bonus', defaultValue: 0 },
        {
          type: 'formula',
          id: 'total',
          label: 'Total',
          expression: 'bonus + 1',
          dependencies: ['bonus'],
        },
      ],
    });
    const rewired = rewireFieldId(structure, 'bonus', 'attack_bonus');
    const repeater = rewired.tabs[0].sections[0].fields[3];
    expect(repeater.type).toBe('repeater');
    if (repeater.type === 'repeater') {
      expect(repeater.itemSchema[0].id).toBe('attack_bonus');
      const total = repeater.itemSchema[1];
      expect(total.type === 'formula' ? total.expression : '').toBe(
        'attack_bonus + 1',
      );
      expect(total.type === 'formula' ? total.dependencies : []).toEqual([
        'attack_bonus',
      ]);
    }
  });
});

describe('parseTemplateStructure', () => {
  it('imports a well-formed DSL', () => {
    const result = parseTemplateStructure(JSON.stringify(baseStructure()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tabs[0].sections[0].fields).toHaveLength(3);
    }
  });

  it('rejects invalid JSON', () => {
    const result = parseTemplateStructure('{not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JSON/i);
  });

  it('rejects a payload without tabs', () => {
    const result = parseTemplateStructure('{"system":"dnd5e","version":1}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/tabs/i);
  });

  it('parses nested repeater item schemas', () => {
    const structure = baseStructure();
    structure.tabs[0].sections[0].fields.push({
      type: 'repeater',
      id: 'spells',
      label: 'Spells',
      itemSchema: [
        { type: 'text', id: 'name', label: 'Name' },
        { type: 'number', id: 'level', label: 'Level', defaultValue: 1 },
      ],
    });
    const result = parseTemplateStructure(JSON.stringify(structure));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const repeater = result.value.tabs[0].sections[0]
        .fields[3] as Extract<typeof structure['tabs'][number]['sections'][number]['fields'][number], { type: 'repeater' }>;
      expect(repeater.itemSchema).toHaveLength(2);
      expect(repeater.itemSchema[1]).toMatchObject({ type: 'number', id: 'level' });
    }
  });
});