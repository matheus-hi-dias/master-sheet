import { ArrowLeft, Download, Save, Upload, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { DEFAULT_SYSTEMS, SYSTEM_LABELS } from '../../templates/types/template-structure';
import type { Builder } from '../hooks/useBuilder';

interface BuilderHeaderProps {
  builder: Builder;
  isSaving: boolean;
  editMode: boolean;
  errors: string[];
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
}

const inputClass =
  'w-full bg-bg-panel border border-border rounded-card py-[9px] px-3 text-text-main font-body text-[13px] outline-none transition-all duration-200 placeholder:text-text-muted focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]';

export function BuilderHeader({
  builder,
  isSaving,
  editMode,
  errors,
  onImport,
  onExport,
  onSave,
}: BuilderHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border border-border rounded-card bg-bg-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="flex items-center gap-1.5 text-text-muted hover:text-gold transition-colors text-[12px] font-bold uppercase tracking-[0.08em] cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="font-display font-black text-[16px] text-gold tracking-[0.08em]">
          {editMode ? 'Edit template' : 'New template'}
        </h1>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onImport}>
            <Upload size={14} /> Import JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download size={14} /> Export JSON
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save size={14} />
            {isSaving ? 'Saving…' : editMode ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <label>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
            Template name
          </span>
          <input
            value={builder.draft.name}
            onChange={(e) => builder.updateMeta('name', e.target.value)}
            className={inputClass}
            placeholder="e.g. Vampire V5 Sheet"
          />
        </label>

        <label>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
            Description
          </span>
          <input
            value={builder.draft.description}
            onChange={(e) => builder.updateMeta('description', e.target.value)}
            className={inputClass}
            placeholder="Short description"
          />
        </label>

        <label>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
            System
          </span>
          <select
            value={builder.draft.system}
            onChange={(e) => {
              builder.updateMeta('system', e.target.value);
              builder.updateStructure({
                ...builder.draft.structure,
                system: e.target.value,
              });
            }}
            className={cn(inputClass, 'cursor-pointer')}
          >
            {DEFAULT_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {SYSTEM_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
            Tags (comma separated)
          </span>
          <input
            value={builder.draft.tags.join(', ')}
            onChange={(e) =>
              builder.updateMeta(
                'tags',
                e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
              )
            }
            className={inputClass}
            placeholder="fantasy, dark, 5e"
          />
        </label>

        <div className="flex items-end pb-1">
          <button
            type="button"
            onClick={() => builder.updateMeta('isPublic', !builder.draft.isPublic)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span
              className={cn(
                'w-10 h-[22px] rounded-full border transition-colors duration-200 flex items-center px-0.5',
                builder.draft.isPublic
                  ? 'bg-gold border-gold justify-end'
                  : 'bg-bg-panel border-border justify-start',
              )}
            >
              <span
                className={cn(
                  'w-[16px] h-[16px] rounded-full transition-colors duration-200',
                  builder.draft.isPublic ? 'bg-[#121212]' : 'bg-text-muted',
                )}
              />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted group-hover:text-text-main">
              {builder.draft.isPublic ? 'Public' : 'Private'}
            </span>
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mx-4 mb-4 px-3 py-2 rounded-card border border-danger/50 bg-danger/5">
          {errors.map((error) => (
            <p
              key={error}
              className="flex items-start gap-2 text-[12px] text-danger"
            >
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}
    </header>
  );
}