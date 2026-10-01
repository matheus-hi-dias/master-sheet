import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Copy,
  FilePlus2,
  Eye,
  Tag as TagIcon,
  User,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { Tag } from '../../../components/ui/Tag';
import { DynamicFormMapper } from '../../sheets/components/DynamicFormMapper';
import {
  buildItemDefaults,
  structureDefaultValues,
} from '../../sheets/lib/defaults';
import { fetchTemplateDetail } from '../services/templatesApi';
import { SYSTEM_LABELS } from '../types/template-structure';
import type { TemplateSummary } from '../types/templates';
import { useForkTemplate } from '../hooks/useForkTemplate';

interface TemplateDetailDrawerProps {
  template: TemplateSummary;
  onClose: () => void;
}

export function TemplateDetailDrawer({
  template,
  onClose,
}: TemplateDetailDrawerProps) {
  const forkMutation = useForkTemplate();

  const { data: detail } = useQuery({
    queryKey: ['template-detail', template.id],
    queryFn: () => fetchTemplateDetail(template.id),
    initialData: template,
  });

  const structure = detail?.structure;
  const systemLabel = SYSTEM_LABELS[template.system] ?? template.system;

  const previewInitialValues = useMemo(() => {
    if (!structure) return undefined;

    const defaults = structureDefaultValues(structure);
    for (const tab of structure.tabs) {
      for (const section of tab.sections) {
        for (const field of section.fields) {
          if (field.type === 'repeater') {
            defaults[field.id] =
              field.itemSchema.length > 0
                ? [buildItemDefaults(field.itemSchema)]
                : [];
          }
        }
      }
    }
    return defaults;
  }, [structure]);

  const handleCreateSheet = () => {
    toast.info('Sheet creation is coming soon');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-md bg-bg-card border-l border-border shadow-card overflow-y-auto animate-drawer-in">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-bg-card">
          <h2 className="font-display font-bold text-text-main tracking-wide">
            {template.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] text-gold text-[11px] font-bold uppercase tracking-[0.08em] px-2 py-1 rounded">
              {systemLabel}
            </span>
            <span className="inline-flex items-center bg-bg-panel border border-border text-text-muted text-[11px] font-bold uppercase tracking-[0.08em] px-2 py-1 rounded">
              v{template.version}
            </span>
            {template.isOfficial && (
              <span className="inline-flex items-center bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] text-gold text-[11px] font-bold uppercase tracking-[0.08em] px-2 py-1 rounded">
                ✦ Official
              </span>
            )}
            <span className="text-[12px] text-text-muted flex items-center gap-1.5 ml-auto">
              <User size={13} />
              {template.author?.name ?? 'Unknown'}
            </span>
          </div>

          {template.description && (
            <p className="text-[13px] text-text-muted leading-relaxed">
              {template.description}
            </p>
          )}

          {structure && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5 mb-2">
                <Eye size={13} /> Live preview
              </h3>
              <div className="border border-border rounded-card bg-bg-panel p-4">
                <DynamicFormMapper
                  structure={structure}
                  initialValues={previewInitialValues}
                />
              </div>
            </section>
          )}

          {template.tags.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5 mb-2">
                <TagIcon size={13} /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((t) => (
                  <Tag key={t.id} className="pointer-events-none">
                    {t.name}
                  </Tag>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              variant="gold"
              className="flex-1"
              onClick={handleCreateSheet}
            >
              <FilePlus2 size={14} /> Create Sheet
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => forkMutation.mutate(template.id)}
              disabled={forkMutation.isPending}
            >
              <Copy size={14} /> Fork Template
            </Button>
          </div>

          <p className="text-[11px] text-text-muted flex items-start gap-1.5">
            <Database size={12} className="mt-0.5 shrink-0" />
            ID: {template.id}
          </p>
        </div>
      </aside>
    </div>
  );
}