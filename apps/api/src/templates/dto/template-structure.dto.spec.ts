import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TemplateStructureDto } from './template-structure.dto';

const validStructure = {
  system: 'dnd5e',
  version: 1,
  tabs: [
    {
      id: 'main',
      label: 'Main',
      icon: 'swords',
      sections: [
        {
          id: 'abilities',
          title: 'Abilities',
          columns: 2,
          fields: [
            {
              id: 'str',
              label: 'Strength',
              type: 'number',
              defaultValue: 10,
              min: 0,
              max: 30,
            },
            {
              id: 'notes',
              label: 'Notes',
              type: 'textarea',
              placeholder: 'Enter notes…',
              maxLength: 500,
            },
            {
              id: 'hp_dots',
              label: 'Hit Dice',
              type: 'dots',
              maxDots: 10,
              defaultValue: 3,
            },
            {
              id: 'align',
              label: 'Alignment',
              type: 'select',
              options: [
                { label: 'Lawful', value: 'lawful' },
                { label: 'Chaotic', value: 'chaotic' },
              ],
            },
            { id: 'hero', label: 'Hero', type: 'checkbox', defaultValue: true },
            {
              id: 'mod_str',
              label: 'Modifier',
              type: 'formula',
              expression: 'floor((str - 10) / 2)',
              dependencies: ['str'],
            },
            {
              id: 'spells',
              label: 'Spells',
              type: 'repeater',
              itemSchema: [{ id: 'name', label: 'Spell name', type: 'text' }],
            },
          ],
        },
      ],
    },
  ],
};

const toDto = (payload: unknown): TemplateStructureDto =>
  plainToInstance(TemplateStructureDto, payload as object);

describe('TemplateStructureDto field type compatibility', () => {
  it('accepts a well-formed structure with every field type', async () => {
    const errors = await validate(toDto(validStructure));
    expect(errors).toHaveLength(0);
  });

  it('rejects a field carrying a key that its type does not allow', async () => {
    const invalid = structuredClone(validStructure);
    invalid.tabs[0].sections[0].fields[0] = {
      ...invalid.tabs[0].sections[0].fields[0],
      placeholder: 'nope',
    };

    const errors = await validate(toDto(invalid));
    expect(errors.length).toBeGreaterThan(0);
    expect(
      JSON.stringify(errors).includes(
        'Field definition is not compatible with its declared type',
      ),
    ).toBe(true);
  });

  it('rejects an entirely unknown key on a field', async () => {
    const invalid = structuredClone(validStructure);
    invalid.tabs[0].sections[0].fields[0] = {
      ...invalid.tabs[0].sections[0].fields[0],
      bogus: 'key',
    };

    const errors = await validate(toDto(invalid));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a dots field without a numeric maxDots', async () => {
    const invalid = structuredClone(validStructure);
    invalid.tabs[0].sections[0].fields[2] = {
      id: 'hp_dots',
      label: 'Hit Dice',
      type: 'dots',
    };

    const errors = await validate(toDto(invalid));
    expect(errors.length).toBeGreaterThan(0);
  });
});
