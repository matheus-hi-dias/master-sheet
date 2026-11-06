import type { FieldErrors, Resolver } from 'react-hook-form';
import type { TemplateStructure } from '@master-sheet/contracts';
import { validateSheetData } from '@master-sheet/sheet-engine/validation';
import type { SheetFormValues } from '../types/sheet.types';

type ErrorTree = Record<string, unknown>;

export function createSheetResolver(
  structure: TemplateStructure,
): Resolver<SheetFormValues> {
  return (values) => {
    const result = validateSheetData(structure, values);

    if (result.ok) {
      return { values, errors: {} };
    }

    const errors: ErrorTree = {};

    for (const item of result.issues) {
      let node = errors;

      item.path.forEach((part, index) => {
        const key = String(part);
        const last = index === item.path.length - 1;

        if (last) {
          node[key] = { type: item.code, message: item.message };
          return;
        }

        node[key] ??= {};
        node = node[key] as ErrorTree;
      });
    }

    return {
      values: {},
      errors: errors as FieldErrors<SheetFormValues>,
    } as unknown as ReturnType<Resolver<SheetFormValues>>;
  };
}
