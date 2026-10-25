import { useMemo, useState } from 'react';
import { Check, Plus, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  evaluateFormula,
  extractIdentifiers,
  renderExpressionWithLabels,
  type FormulaContext,
} from '../../../lib/formula';
import type {
  FieldDefinition,
  FieldType,
} from '../../templates/types/template-structure';
import { createField, slugify, type DepCandidate } from '../lib/structureOps';

interface FieldConfigFormProps {
  field: FieldDefinition;
  patch: (patch: Partial<FieldDefinition>) => void;
  candidates?: DepCandidate[];
  labelById?: Record<string, string>;
  previewContext?: FormulaContext;
}

const inputClass =
  'w-full bg-bg-panel border border-border rounded-card py-[8px] px-3 text-text-main font-body text-[13px] outline-none transition-all duration-200 placeholder:text-text-muted focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]';
const labelClass =
  'block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1';

const BROAD_TYPES: FieldType[] = [
  'number',
  'text',
  'textarea',
  'dots',
  'select',
  'checkbox',
  'formula',
  'repeater',
];

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? undefined : Number(e.target.value))
        }
        className={inputClass}
      />
    </label>
  );
}

export function FieldConfigForm({
  field,
  patch,
  candidates = [],
  labelById = {},
  previewContext = {},
}: FieldConfigFormProps) {
  const [newOption, setNewOption] = useState({ label: '', value: '' });
  const [newChildType, setNewChildType] = useState<FieldType>('text');

  const candidateIds = useMemo(
    () => new Set(candidates.map((candidate) => candidate.id)),
    [candidates],
  );

  const formulaDiagnostics = useMemo(() => {
    if (field.type !== 'formula') return null;

    const used = extractIdentifiers(field.expression);
    const unknown = used.filter((id) => !candidateIds.has(id));
    const deps = used
      .filter((id) => candidateIds.has(id))
      .filter((id, index, all) => all.indexOf(id) === index);

    let previewValue: string | null = null;
    try {
      previewValue = String(evaluateFormula(field.expression, previewContext));
    } catch (error) {
      previewValue = error instanceof Error ? error.message : 'Invalid formula';
    }

    return { unknown, deps, previewValue, blocked: unknown.length > 0 };
  }, [field, candidateIds, previewContext]);

  if (field.type === 'formula') {
    const diagnostics = formulaDiagnostics!;
    const readout = renderExpressionWithLabels(field.expression, labelById);

    return (
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className={labelClass}>Field ID</span>
            <input
              value={field.id}
              onChange={(e) => patch({ id: e.target.value })}
              className={cn(inputClass, 'font-mono text-[12px]')}
            />
          </label>
          <button
            type="button"
            title="Generate id from label"
            aria-label="Generate id from label"
            onClick={() => patch({ id: slugify(field.label) })}
            className="px-2.5 py-[9px] rounded-card border border-border text-text-muted hover:text-gold hover:border-gold transition-colors cursor-pointer"
          >
            <Sparkles size={14} />
          </button>
        </div>

        <label>
          <span className={labelClass}>Expression</span>
          <textarea
            rows={3}
            value={field.expression}
            placeholder="floor((forca + destreza) / 2)"
            onChange={(e) => {
              const used = extractIdentifiers(e.target.value);
              const deps = used.filter((id) => candidateIds.has(id));
              patch({
                expression: e.target.value,
                dependencies: deps.filter((id, index, all) => all.indexOf(id) === index),
              });
            }}
            className={cn(inputClass, 'font-mono text-[12px] resize-y')}
          />
        </label>

        {field.expression.trim() !== '' && (
          <p className="text-[10px] font-mono text-text-muted/80 break-words">
            {readout}
          </p>
        )}

        <div>
          <span className={labelClass}>Insert dependency</span>
          {candidates.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() =>
                    patch({
                      expression: `${field.expression}${field.expression ? ' + ' : ''}${candidate.id}`,
                      dependencies: [
                        ...field.dependencies.filter((d) => d !== candidate.id),
                        candidate.id,
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-bg-card text-[11px] text-text-muted hover:text-gold hover:border-gold transition-colors cursor-pointer"
                >
                  <span>{candidate.label}</span>
                  <span className="font-mono text-[10px] opacity-60">
                    {candidate.id}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-muted">
              Add numeric fields first to use them as dependencies.
            </p>
          )}
        </div>

        <div>
          <span className={labelClass}>Diagnostics</span>
          <div className="space-y-1 text-[11px]">
            {diagnostics.unknown.length > 0 && (
              <p className="flex items-center gap-1.5 text-danger">
                <TriangleAlert size={12} /> Unknown:{' '}
                {diagnostics.unknown
                  .map((id) => (labelById[id] ? `${id} (${labelById[id]})` : id))
                  .join(', ')}
              </p>
            )}
            <p className="text-text-muted">
              Dependencies:{' '}
              {diagnostics.deps.length > 0
                ? diagnostics.deps
                    .map((id) => labelById[id] ?? id)
                    .join(', ')
                : 'none'}
            </p>
            <p
              className={cn(
                'font-mono tabular-nums',
                diagnostics.blocked ? 'text-text-muted' : 'text-gold',
              )}
            >
              Preview: {diagnostics.previewValue}
            </p>
            {!diagnostics.blocked && diagnostics.deps.length > 0 && (
              <p className="font-mono text-[10px] text-text-muted/70">
                {diagnostics.deps
                  .map((id) => `${id} = ${previewContext[id] ?? 0}`)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (field.type === 'repeater') {
    const children = field.itemSchema ?? [];

    return (
      <div className="space-y-3">
        {children.length > 0 && (
          <div className="space-y-2">
            {children.map((child, index) => (
              <ChildEditor
                key={child.id}
                child={child}
                index={index}
                onChange={(next) => {
                  patch({
                    itemSchema: children.map((c, i) => (i === index ? next : c)),
                  });
                }}
                onRemove={() => {
                  patch({ itemSchema: children.filter((_, i) => i !== index) });
                }}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <select
            value={newChildType}
            onChange={(e) => setNewChildType(e.target.value as FieldType)}
            className={cn(inputClass, 'cursor-pointer flex-1')}
          >
            {BROAD_TYPES.filter((t) => t !== 'repeater').map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const child = createField(
                newChildType,
                children.map((c) => c.id),
              );
              patch({ itemSchema: [...children, child] });
            }}
            className="px-3 rounded-card border border-gold text-gold text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-gold/10 transition-colors cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="text-[11px] text-text-muted">
          Repeater items share a common sub-schema. Nested repeaters are not supported.
        </p>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-3">
        {(() => {
          const options = field.options ?? [];
          return (
            <>
              {options.map((option, index) => (
                <div key={`${option.value}-${index}`} className="flex gap-2">
                  <input
                    value={option.label}
                    onChange={(e) => {
                      const next = options.map((o, i) =>
                        i === index ? { label: e.target.value, value: o.value } : o,
                      );
                      patch({ options: next });
                    }}
                    className={inputClass}
                    placeholder="Label"
                  />
                  <input
                    value={option.value}
                    onChange={(e) => {
                      const next = options.map((o, i) =>
                        i === index ? { ...o, value: e.target.value } : o,
                      );
                      patch({ options: next });
                    }}
                    className={inputClass}
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patch({ options: options.filter((_, i) => i !== index) })
                    }
                    className="px-2.5 text-text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newOption.label}
                  placeholder="New label"
                  onChange={(e) =>
                    setNewOption((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className={inputClass}
                />
                <input
                  value={newOption.value}
                  placeholder="Value"
                  onChange={(e) =>
                    setNewOption((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newOption.label) return;
                    patch({ options: [...options, newOption] });
                    setNewOption({ label: '', value: '' });
                  }}
                  className="px-3 rounded-card border border-gold text-gold text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-gold/10 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {field.type === 'number' && (
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="Min"
            value={field.min}
            onChange={(min) => patch({ min })}
          />
          <NumberInput
            label="Max"
            value={field.max}
            onChange={(max) => patch({ max })}
          />
          <NumberInput
            label="Step"
            value={field.step}
            onChange={(step) => patch({ step })}
          />
        </div>
      )}

      {(field.type === 'text' || field.type === 'textarea') && (
        <label>
          <span className={labelClass}>Placeholder</span>
          <input
            value={field.placeholder ?? ''}
            onChange={(e) => patch({ placeholder: e.target.value })}
            className={inputClass}
          />
        </label>
      )}

      {field.type === 'dots' && (
        <NumberInput
          label="Max dots"
          value={field.maxDots}
          onChange={(maxDots) => patch({ maxDots })}
        />
      )}

      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(field.defaultValue)}
            onChange={(e) => patch({ defaultValue: e.target.checked })}
            className="w-4 h-4 accent-[var(--color-gold)]"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Checked by default
          </span>
        </label>
      )}
    </div>
  );
}

function TypeSelector({
  value,
  onChangeType,
}: {
  value: FieldType;
  onChangeType: (type: FieldType) => void;
}) {
  return (
    <label>
      <span className={labelClass}>Type</span>
      <select
        value={value}
        onChange={(e) => onChangeType(e.target.value as FieldType)}
        className={cn(inputClass, 'cursor-pointer')}
      >
        {BROAD_TYPES.filter((type) => type !== 'repeater').map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChildEditor({
  child,
  index,
  onChange,
  onRemove,
}: {
  child: FieldDefinition;
  index: number;
  onChange: (next: FieldDefinition) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border border-border rounded-card bg-bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-display font-bold uppercase tracking-[0.1em] text-text-muted">
            Item #{index + 1}
          </span>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 text-[11px] text-gold cursor-pointer"
          >
            <Check size={12} /> Done
          </button>
        </div>
        <FieldConfigForm
          field={child}
          candidates={[]}
          patch={(patchProps) =>
            onChange({ ...child, ...patchProps } as FieldDefinition)
          }
        />
        <TypeSelector
          value={child.type}
          onChangeType={(type) =>
            onChange({ ...createField(type), id: child.id, label: child.label })
          }
        />
      </div>
    );
  }

  const propExtra =
    child.type === 'number'
      ? ` · ${child.min ?? '−∞'}–${child.max ?? '∞'}`
      : child.type === 'dots'
        ? ` · ${child.maxDots ?? 5} dots`
        : child.type === 'select'
          ? ` · ${(child.options ?? []).length} options`
          : '';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded-card border text-left transition-colors cursor-pointer',
          'border-border bg-bg-card text-text-muted hover:text-gold hover:border-gold',
        )}
      >
        <span className="text-[11px] font-bold text-text-muted w-5 tabular-nums">
          {index + 1}.
        </span>
        <span className="text-[12px] font-bold text-text-main">
          {child.label || child.type}
        </span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gold">
          {child.type}
          {propExtra}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-text-muted hover:text-danger transition-colors cursor-pointer"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}