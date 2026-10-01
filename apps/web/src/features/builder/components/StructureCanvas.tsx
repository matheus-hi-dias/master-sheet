import {
  ChevronUp,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FormulaContext } from '../../../lib/formula';
import type {
  FieldDefinition,
  FieldType,
} from '../../templates/types/template-structure';
import type { Builder } from '../hooks/useBuilder';
import type { DepCandidate } from '../lib/structureOps';
import { FieldConfigForm } from './FieldConfigForm';

interface StructureCanvasProps {
  builder: Builder;
  data: Builder['draft'];
  candidates: DepCandidate[];
  labelById?: Record<string, string>;
  previewContext?: FormulaContext;
}

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

function iconButton(
  title: string,
  onClick: () => void,
  icon: React.ReactNode,
  danger = false,
) {
  return (
    <button
      key={title}
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'p-1 rounded-md transition-colors cursor-pointer',
        danger
          ? 'text-text-muted hover:text-danger'
          : 'text-text-muted hover:text-gold',
      )}
    >
      {icon}
    </button>
  );
}

export function StructureCanvas({
  builder,
  data,
  candidates,
  labelById,
  previewContext,
}: StructureCanvasProps) {
  const { structure } = data;
  const activeTab = structure.tabs.find((t) => t.id === builder.selection.tabId);
  const activeSection =
    activeTab?.sections.find((s) => s.id === builder.selection.sectionId) ?? null;
  const selectedField = builder.selectedField;

  const onChangeType = (field: FieldDefinition, type: FieldType) => {
    if (field.type === type) return;
    const created = createFieldFor(field, type);
    builder.handleReplaceField(created);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <section className="border border-border rounded-card bg-bg-panel overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Layers size={14} className="text-gold" />
          <h2 className="text-[11px] font-display font-bold uppercase tracking-[0.16em] text-text-main">
            Tabs
          </h2>
          <button
            type="button"
            onClick={builder.handleAddTab}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded border border-gold/50 text-gold text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-gold/10 transition-colors cursor-pointer"
          >
            <Plus size={12} /> Add tab
          </button>
        </div>
        <div className="p-3 space-y-2">
          {structure.tabs.map((tab) => {
            const active = tab.id === builder.selection.tabId;
            return (
              <div
                key={tab.id}
                onClick={() => builder.selectTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-card border cursor-pointer transition-all duration-200',
                  active
                    ? 'border-gold/50 bg-gold/5'
                    : 'border-border hover:border-gold/30',
                )}
              >
                <input
                  value={tab.label}
                  onChange={(e) =>
                    builder.handleRenameTab(tab.id, e.target.value)
                  }
                  onFocus={() => builder.selectTab(tab.id)}
                  className="bg-transparent border-none outline-none text-[13px] font-bold text-text-main w-full"
                />
                <div className="flex items-center shrink-0">
                  {active &&
                    iconButton(
                      'Move up',
                      () => builder.handleMoveTab(-1),
                      <ChevronUp size={13} />,
                    )}
                  {active &&
                    iconButton(
                      'Move down',
                      () => builder.handleMoveTab(1),
                      <ChevronDown size={13} />,
                    )}
                  {active &&
                    iconButton(
                      'Remove tab',
                      builder.handleRemoveTab,
                      <Trash2 size={13} />,
                      true,
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sections + fields */}
      <section className="border border-border rounded-card bg-bg-panel overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <h2 className="text-[11px] font-display font-bold uppercase tracking-[0.16em] text-text-main">
            Sections
          </h2>
          <span className="text-[10px] text-text-muted">
            {activeSection ? `${activeSection.fields.length} fields` : '—'}
          </span>
          <button
            type="button"
            onClick={builder.handleAddSection}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded border border-gold/50 text-gold text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-gold/10 transition-colors cursor-pointer"
          >
            <Plus size={12} /> Add section
          </button>
        </div>

        <div className="p-3 space-y-4">
          {activeTab?.sections.map((section) => (
            <div key={section.id} className="space-y-1.5">
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-card border bg-bg-panel/60"
                style={
                  builder.selection.sectionId === section.id
                    ? { borderColor: 'var(--color-gold)', opacity: 0.85 }
                    : undefined
                }
              >
                <GripVertical
                  size={13}
                  className="text-text-muted opacity-50 shrink-0"
                />
                <input
                  value={section.title}
                  onChange={(e) =>
                    builder.handlePatchSection({ title: e.target.value })
                  }
                  onClick={() => builder.selectSection(section.id)}
                  className="flex-1 bg-transparent border-none outline-none text-[12px] font-bold text-text-main min-w-0"
                />
                <select
                  aria-label="Section columns"
                  value={section.columns ?? 1}
                  onChange={(e) =>
                    builder.handlePatchSection({ columns: Number(e.target.value) })
                  }
                  className="bg-bg-panel border border-border rounded px-1.5 py-0.5 text-[11px] text-text-muted outline-none cursor-pointer shrink-0"
                >
                  {[1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      {c} col{c > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {iconButton(
                  'Move up',
                  () => builder.handleMoveSection(-1),
                  <ChevronUp size={13} />,
                )}
                {iconButton(
                  'Move down',
                  () => builder.handleMoveSection(1),
                  <ChevronDown size={13} />,
                )}
                {iconButton(
                  'Remove section',
                  builder.handleRemoveSection,
                  <Trash2 size={13} />,
                  true,
                )}
              </div>

              {builder.selection.sectionId === section.id && (
                <div className="space-y-1.5 pl-2">
                  {section.fields.map((field) => (
                    <div
                      key={field.id}
                      onClick={() => builder.selectField(field.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200',
                        builder.selection.fieldId === field.id
                          ? 'border-gold/60 bg-gold/5'
                          : 'border-border hover:border-gold/30',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-widest w-20 shrink-0',
                          field.type === 'formula'
                            ? 'text-gold'
                            : field.type === 'repeater'
                              ? 'text-[#8e9cf0]'
                              : 'text-text-muted',
                        )}
                      >
                        {field.type}
                      </span>
                      <span className="text-[12px] text-text-main truncate flex-1">
                        {field.label || field.id}
                      </span>
                      {builder.selection.fieldId === field.id && (
                        <span className="flex items-center shrink-0">
                          {iconButton(
                            'Move up',
                            () => builder.handleMoveField(-1),
                            <ChevronUp size={12} />,
                          )}
                          {iconButton(
                            'Move down',
                            () => builder.handleMoveField(1),
                            <ChevronDown size={12} />,
                          )}
                          {iconButton(
                            'Remove field',
                            builder.handleRemoveField,
                            <Trash2 size={12} />,
                            true,
                          )}
                        </span>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <select
                      value="text"
                      onChange={(e) => builder.handleAddField(e.target.value as FieldType)}
                      className="flex-1 bg-bg-panel border border-border rounded-lg px-3 py-2 text-[12px] text-text-main outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="text" disabled>
                        Choose field type…
                      </option>
                      {FIELD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          Add {type} field
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}

          {(!activeTab || activeTab.sections.length === 0) && (
            <p className="text-center text-[12px] text-text-muted py-6">
              Add a section to start building.
            </p>
          )}
        </div>
      </section>

      {/* Field inspector */}
      <section className="border border-border rounded-card bg-bg-panel overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <h2 className="text-[11px] font-display font-bold uppercase tracking-[0.16em] text-text-main">
            Field inspector
          </h2>
          {selectedField && (
            <select
              aria-label="Change field type"
              value={selectedField.type}
              onChange={(e) => onChangeType(selectedField, e.target.value as FieldType)}
              className="ml-auto bg-bg-panel border border-border rounded px-2 py-1 text-[11px] text-gold outline-none cursor-pointer"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedField ? (
          <div className="p-4 space-y-3">
            <label>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                Label
              </span>
              <input
                value={selectedField.label}
                onChange={(e) =>
                  builder.handleReplaceField({
                    ...selectedField,
                    label: e.target.value,
                  })
                }
                className="w-full bg-bg-panel border border-border rounded-lg py-[8px] px-3 text-text-main text-[13px] outline-none focus:border-gold"
              />
            </label>

            <FieldConfigForm
              field={selectedField}
              candidates={candidates}
              labelById={labelById}
              previewContext={previewContext}
              patch={(patchProps) =>
                builder.handleReplaceField({
                  ...selectedField,
                  ...patchProps,
                } as FieldDefinition)
              }
            />
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-[12px] text-text-muted">
            Select a field to configure it.
          </p>
        )}
      </section>
    </div>
  );
}

function createFieldFor(source: FieldDefinition, type: FieldType): FieldDefinition {
  switch (type) {
    case 'number':
      return { type, id: source.id, label: source.label, defaultValue: 0 };
    case 'text':
    case 'textarea':
      return { type, id: source.id, label: source.label };
    case 'dots':
      return { type, id: source.id, label: source.label, maxDots: 5, defaultValue: 0 };
    case 'select':
      return {
        type,
        id: source.id,
        label: source.label,
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      };
    case 'checkbox':
      return { type, id: source.id, label: source.label, defaultValue: false };
    case 'formula':
      return { type, id: source.id, label: source.label, expression: '0', dependencies: [] };
    case 'repeater':
      return { type, id: source.id, label: source.label, itemSchema: [] };
  }
}