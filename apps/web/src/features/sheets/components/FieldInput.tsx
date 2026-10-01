import { cn } from '../../../lib/utils';
import type { FieldDefinition } from '../../templates/types/template-structure';
import type { SheetForm } from '../types/sheet.types';
import { DotTracker } from './DotTracker';
import { FormulaField } from './FormulaField';
import { RepeaterField } from './RepeaterField';

interface FieldInputProps {
  field: FieldDefinition;
  form: SheetForm;
}

const inputClass =
  'w-full bg-bg-panel border border-border rounded-card py-[10px] px-3 text-text-main font-body text-[13px] outline-none transition-all duration-200 placeholder:text-text-muted focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]';

function renderInput(field: FieldDefinition, form: SheetForm) {
  const { register, setValue, getValues } = form;

  switch (field.type) {
    case 'number':
      return (
        <input
          key={field.id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          {...register(field.id)}
          className={inputClass}
        />
      );
    case 'text':
      return (
        <input
          key={field.id}
          type="text"
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          {...register(field.id)}
          className={inputClass}
        />
      );
    case 'textarea':
      return (
        <textarea
          key={field.id}
          rows={3}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          {...register(field.id)}
          className={cn(inputClass, 'resize-y')}
        />
      );
    case 'dots': {
      const initial = Number(getValues(field.id)) || 0;
      return (
        <DotTracker
          key={field.id}
          initial={initial}
          maxDots={field.maxDots ?? 5}
          onValue={(v) => setValue(field.id, v)}
        />
      );
    }
    case 'select':
      return (
        <select
          key={field.id}
          {...register(field.id)}
          className={cn(inputClass, 'cursor-pointer')}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'checkbox': {
      const defaultValue = Boolean(getValues(field.id));
      return (
        <input
          key={field.id}
          type="checkbox"
          defaultChecked={defaultValue}
          {...register(field.id)}
          className="w-4 h-4 accent-[var(--color-gold)] cursor-pointer mt-2"
        />
      );
    }
    case 'formula':
      return (
        <FormulaField
          key={field.id}
          field={field}
          control={form.control}
          setValue={setValue}
        />
      );
    case 'repeater': {
      const initialItems = (
        (getValues(field.id) as Record<string, unknown>[] | undefined) ?? []
      ).map((item) => ({ ...item }));
      return (
        <RepeaterField
          key={field.id}
          field={field}
          initialItems={initialItems}
          onItemsChange={(items) => setValue(field.id, items)}
        />
      );
    }
  }
}

export function FieldInput({ field, form }: FieldInputProps) {
  return (
    <label className="block min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-widest text-text-muted mb-1">
        {field.label}
      </span>
      {renderInput(field, form)}
    </label>
  );
}