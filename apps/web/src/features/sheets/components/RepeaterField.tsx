import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { evaluateFormula } from '../../../lib/formula';
import { cn } from '../../../lib/utils';
import type { FieldDefinition, RepeaterFieldDefinition } from '../../templates/types/template-structure';
import { buildItemDefaults } from '../lib/defaults';
import { DotTracker } from './DotTracker';

interface RepeaterFieldProps {
  field: RepeaterFieldDefinition;
  initialItems: Record<string, unknown>[];
  onItemsChange: (items: Record<string, unknown>[]) => void;
}

const inputClass =
  'w-full bg-bg-panel border border-border rounded-card py-[10px] px-3 text-text-main font-body text-[13px] outline-none transition-all duration-200 placeholder:text-text-muted focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]';

function evaluateInItem(
  expression: string,
  dependencies: string[],
  item: Record<string, unknown>,
): number | null {
  try {
    const context: Record<string, number> = {};
    for (const dep of dependencies) {
      const value = item[dep];
      context[dep] = typeof value === 'number' ? value : Number(value ?? 0) || 0;
    }
    return evaluateFormula(expression, context);
  } catch {
    return null;
  }
}

function ItemFieldInput({
  field,
  item,
  onChange,
}: {
  field: FieldDefinition;
  item: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case 'number':
      return (
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={(item[field.id] as number | undefined) ?? 0}
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
          className={inputClass}
        />
      );
    case 'text':
      return (
        <input
          type="text"
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={(item[field.id] as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    case 'textarea':
      return (
        <textarea
          rows={2}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={(item[field.id] as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'resize-y')}
        />
      );
    case 'dots':
      return (
        <DotTracker
          initial={(item[field.id] as number | undefined) ?? 0}
          maxDots={field.maxDots ?? 5}
          onValue={onChange}
        />
      );
    case 'select':
      return (
        <select
          value={(item[field.id] as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'cursor-pointer')}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(item[field.id])}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-gold)] cursor-pointer mt-2"
        />
      );
    case 'formula': {
      const result = evaluateInItem(field.expression, field.dependencies, item);
      return (
        <span className="block py-2 font-display text-[15px] font-bold text-text-main tabular-nums">
          {result === null ? '—' : result}
        </span>
      );
    }
    case 'repeater':
      return null;
  }
}

export function RepeaterField({
  field,
  initialItems,
  onItemsChange,
}: RepeaterFieldProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>(
    initialItems.length > 0
      ? initialItems
      : [buildItemDefaults(field.itemSchema)],
  );

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  const updateItem = (index: number, key: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, buildItemDefaults(field.itemSchema)]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="relative border border-border rounded-card bg-bg-panel/50 p-3"
        >
          <button
            type="button"
            aria-label={`Remove item ${index + 1}`}
            onClick={() => removeItem(index)}
            className="absolute top-2 right-2 p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>

          <div className="grid gap-2.5 mt-1 pr-8">
            {field.itemSchema.map((itemField) => (
              <label key={itemField.id} className="block">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  {itemField.label}
                </span>
                <ItemFieldInput
                  field={itemField}
                  item={item}
                  onChange={(v) => updateItem(index, itemField.id, v)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-card text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted hover:text-gold hover:border-gold transition-colors cursor-pointer"
      >
        <Plus size={14} /> Add item
      </button>
    </div>
  );
}