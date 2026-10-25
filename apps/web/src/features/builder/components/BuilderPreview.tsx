import { Eye } from 'lucide-react';
import type { TemplateStructure } from '../../templates/types/template-structure';
import { DynamicFormMapper } from '../../sheets/components/DynamicFormMapper';

interface BuilderPreviewProps {
  structure: TemplateStructure;
  shapeKey: string;
}

export function BuilderPreview({ structure, shapeKey }: BuilderPreviewProps) {
  return (
    <div className="border border-border rounded-card bg-bg-panel overflow-hidden xl:sticky xl:top-6">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Eye size={14} className="text-gold" />
        <h2 className="text-[11px] font-display font-bold uppercase tracking-[0.16em] text-text-main">
          Live preview
        </h2>
        <span className="ml-auto text-[10px] text-text-muted">
          {structure.tabs.length} tab{structure.tabs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
        <DynamicFormMapper key={shapeKey} structure={structure} />
      </div>
    </div>
  );
}