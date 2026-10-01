import { BadRequestException } from '@nestjs/common';
import {
  collectFields,
  validateFormulaDependencies,
} from './template-structure.util';
import {
  FieldDefinition,
  TemplateStructure,
} from '../types/template-structure.types';

function makeField(field: Partial<FieldDefinition> & { id: string; type: FieldDefinition['type'] }): FieldDefinition {
  return field as FieldDefinition;
}

function makeStructure(fields: FieldDefinition[]): TemplateStructure {
  return {
    system: 'dnd5e',
    version: 1,
    tabs: [
      {
        id: 'main',
        label: 'Main',
        sections: [
          {
            id: 'core',
            title: 'Core',
            fields,
          },
        ],
      },
    ],
  };
}

describe('template-structure.util', () => {
  describe('collectFields', () => {
    it('flattens fields and expands repeater item schemas recursively', () => {
      const structure = makeStructure([
        makeField({ id: 'str', type: 'number' }),
        makeField({
          id: 'reps',
          type: 'repeater',
          itemSchema: [
            makeField({ id: 'inner', type: 'dots' }),
            makeField({
              id: 'nested_formula',
              type: 'formula',
              expression: 'inner * 2',
              dependencies: ['inner'],
            }),
          ],
        }),
      ]);

      const ids = collectFields(structure).map((field) => field.id);
      expect(ids).toEqual(['str', 'reps', 'inner', 'nested_formula']);
    });
  });

  describe('validateFormulaDependencies', () => {
    it('accepts formulas that depend on base fields', () => {
      const structure = makeStructure([
        makeField({ id: 'str', type: 'number' }),
        makeField({
          id: 'mod',
          type: 'formula',
          expression: 'floor((str - 10) / 2)',
          dependencies: ['str'],
        }),
      ]);

      expect(() => validateFormulaDependencies(structure)).not.toThrow();
    });

    it('rejects formula dependencies missing field ids', () => {
      const structure = makeStructure([
        makeField({ id: 'str', type: 'number' }),
        makeField({
          id: 'mod',
          type: 'formula',
          expression: 'floor((dex - 10) / 2)',
          dependencies: ['dex'],
        }),
      ]);

      expect(() => validateFormulaDependencies(structure)).toThrow(
        BadRequestException,
      );
    });

    it('rejects formulas depending on other formulas (depth limit of 1)', () => {
      const structure = makeStructure([
        makeField({ id: 'str', type: 'number' }),
        makeField({
          id: 'mod',
          type: 'formula',
          expression: 'floor((str - 10) / 2)',
          dependencies: ['str'],
        }),
        makeField({
          id: 'double_mod',
          type: 'formula',
          expression: 'mod * 2',
          dependencies: ['mod'],
        }),
      ]);

      try {
        validateFormulaDependencies(structure);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: string[];
        };
        expect(response.message.join(', ')).toContain(
          'cannot depend on another formula field',
        );
      }
    });

    it('rejects duplicate field ids', () => {
      const structure = makeStructure([
        makeField({ id: 'str', type: 'number' }),
        makeField({ id: 'str', type: 'text' }),
      ]);

      expect(() => validateFormulaDependencies(structure)).toThrow(
        BadRequestException,
      );
    });

    it('resolves repeaters: formula inside repeater can depend on sibling fields', () => {
      const structure: TemplateStructure = {
        system: 'dnd5e',
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
                  makeField({
                    id: 'items',
                    type: 'repeater',
                    itemSchema: [
                      makeField({ id: 'count', type: 'number' }),
                      makeField({
                        id: 'total_weight',
                        type: 'formula',
                        expression: 'count * 2',
                        dependencies: ['count'],
                      }),
                    ],
                  }),
                ],
              },
            ],
          },
        ],
      };

      expect(() => validateFormulaDependencies(structure)).not.toThrow();
    });
  });
});