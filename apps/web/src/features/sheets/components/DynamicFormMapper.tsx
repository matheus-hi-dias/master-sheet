import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '../../../lib/utils';
import type { TemplateStructure } from '../../templates/types/template-structure';
import { structureDefaultValues } from '../lib/defaults';
import type { SheetForm, SheetFormValues } from '../types/sheet.types';
import { FieldInput } from './FieldInput';

interface DynamicFormMapperProps {
  structure: TemplateStructure;
  initialValues?: Record<string, unknown>;
  onChange?: (values: SheetFormValues) => void;
}

export function DynamicFormMapper({
  structure,
  initialValues,
  onChange,
}: DynamicFormMapperProps) {
  const defaultValues = useMemo(
    () => structureDefaultValues(structure, initialValues),
    // Structure is only expected to change when the component remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structure],
  );

  const form = useForm<SheetFormValues>({ defaultValues });
  const formRef = useRef<SheetForm>(form);
  formRef.current = form;

  const watchedValues = form.watch();

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(watchedValues);
  }, [watchedValues]);

  const [activeTabId, setActiveTabId] = useState(structure.tabs[0]?.id);

  const activeTab = structure.tabs.find((tab) => tab.id === activeTabId) ??
    structure.tabs[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      {structure.tabs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {structure.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-full border text-[11px] font-display font-semibold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer',
                tab.id === activeTab.id
                  ? 'text-gold border-gold bg-gold/10'
                  : 'text-text-muted border-border hover:text-text-main hover:border-gold/40',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab?.sections.map((section) => {
        const columns = Math.max(
          1,
          Math.min(section.columns ?? 1, section.fields.length),
        );

        return (
          <section key={section.id} className="w-full">
            <h3 className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full bg-gold shrink-0" />
              <span className="text-[12px] font-display font-semibold uppercase tracking-[0.16em] text-gold">
                {section.title}
              </span>
            </h3>

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {section.fields.map((field) => (
                <FieldInput key={field.id} field={field} form={formRef.current} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}