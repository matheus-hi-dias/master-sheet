import { useEffect, useState } from 'react';
import {
  useWatch,
  type Control,
  type UseFormSetValue,
} from 'react-hook-form';
import { evaluateFormula, type FormulaContext } from '../../../lib/formula';
import type { FormulaFieldDefinition } from '../../templates/types/template-structure';
import type { SheetFormValues } from '../types/sheet.types';

interface FormulaFieldProps {
  field: FormulaFieldDefinition;
  control: Control<SheetFormValues>;
  setValue: UseFormSetValue<SheetFormValues>;
}

export function FormulaField({ field, control, setValue }: FormulaFieldProps) {
  const raw = useWatch({ control, name: field.dependencies });
  const depKey = field.dependencies
    .map((dep, index) => `${dep}=${String(raw[index] ?? '')}`)
    .join('|');

  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    try {
      const context: FormulaContext = {};
      field.dependencies.forEach((dep, index) => {
        const value = raw[index];
        context[dep] = typeof value === 'number' ? value : Number(value ?? 0) || 0;
      });

      const value = evaluateFormula(field.expression, context);
      setResult(value);
      setValue(field.id, value, { shouldDirty: true });
    } catch {
      setResult(null);
    }
    // Targeted subscription: re-evaluate only when the explicit dependency values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.expression, depKey, field.id, setValue, field.dependencies]);

  return (
    <div className="flex items-center gap-2 bg-bg-panel border border-border rounded-card px-3 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
        =
      </span>
      <span className="font-display text-[15px] font-bold text-text-main tabular-nums">
        {result === null ? '—' : result}
      </span>
      <span className="ml-auto text-[10px] text-text-muted truncate max-w-[45%]">
        {field.expression}
      </span>
    </div>
  );
}