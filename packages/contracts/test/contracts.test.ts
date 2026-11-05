import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultValues,
  buildItemDefaults,
  templateStructureSchema,
  toNumber,
  toStringValue,
  type FieldDefinition,
  type TemplateStructure,
} from '../src/index';

const numberField: FieldDefinition = {
  id: 'str',
  label: 'Strength',
  type: 'number',
  min: 0,
  max: 30,
};

test('parses a minimal template structure', () => {
  const structure: TemplateStructure = {
    system: 'dnd5e',
    version: 1,
    tabs: [
      {
        id: 'main',
        label: 'Main',
        sections: [{ id: 'core', title: 'Core', fields: [numberField] }],
      },
    ],
  };

  const parsed = templateStructureSchema.parse(structure);

  assert.equal(parsed.tabs[0]?.sections[0]?.fields[0]?.id, 'str');
});

test('rejects unknown properties on fields', () => {
  const result = templateStructureSchema.safeParse({
    system: 'custom',
    version: 1,
    tabs: [
      {
        id: 'main',
        label: 'Main',
        sections: [
          {
            id: 'core',
            title: 'Core',
            fields: [
              { id: 'str', label: 'Strength', type: 'number', bogus: true },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(result.success, false);
});

test('parses nested repeater fields recursively', () => {
  const result = templateStructureSchema.safeParse({
    system: 'custom',
    version: 1,
    tabs: [
      {
        id: 'main',
        label: 'Main',
        sections: [
          {
            id: 'inventory',
            title: 'Inventory',
            fields: [
              {
                id: 'items',
                label: 'Items',
                type: 'repeater',
                itemSchema: [
                  { id: 'name', label: 'Name', type: 'text' },
                  {
                    id: 'nested',
                    label: 'Nested',
                    type: 'repeater',
                    itemSchema: [
                      { id: 'count', label: 'Count', type: 'number' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(result.success, true);
});

test('rejects unknown field types', () => {
  const result = templateStructureSchema.safeParse({
    system: 'custom',
    version: 1,
    tabs: [
      {
        id: 'main',
        label: 'Main',
        sections: [
          {
            id: 'core',
            title: 'Core',
            fields: [{ id: 'x', label: 'X', type: 'mystery' }],
          },
        ],
      },
    ],
  });

  assert.equal(result.success, false);
});

test('buildDefaultValues applies field defaults and seeds values', () => {
  const fields: FieldDefinition[] = [
    { id: 'str', label: 'Strength', type: 'number', defaultValue: 10 },
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'dots', label: 'Dots', type: 'dots', maxDots: 5 },
    { id: 'flag', label: 'Flag', type: 'checkbox', defaultValue: true },
    {
      id: 'choice',
      label: 'Choice',
      type: 'select',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ],
    },
    {
      id: 'total',
      label: 'Total',
      type: 'formula',
      expression: 'str + 1',
      dependencies: ['str'],
    },
  ];

  const values = buildDefaultValues(fields, { str: 14, name: 'Aria' });

  assert.deepEqual(values, {
    str: 14,
    name: 'Aria',
    dots: 0,
    flag: true,
    choice: 'a',
    total: undefined,
  });
});

test('buildItemDefaults uses the repeater schema', () => {
  const defaults = buildItemDefaults([
    { id: 'name', label: 'Name', type: 'text' },
  ]);

  assert.deepEqual(defaults, { name: '' });
});

test('toNumber matches legacy frontend coercion', () => {
  assert.equal(toNumber(3), 3);
  assert.equal(toNumber('4'), 4);
  assert.equal(toNumber(null), 0);
  assert.equal(toNumber(undefined), 0);
  assert.equal(toNumber('not a number'), 0);
  assert.equal(toNumber(false), 0);
});

test('toStringValue matches legacy frontend coercion', () => {
  assert.equal(toStringValue('Aria'), 'Aria');
  assert.equal(toStringValue(12), '12');
  assert.equal(toStringValue(null), '');
  assert.equal(toStringValue(undefined), '');
  assert.equal(toStringValue(false), 'false');
});
