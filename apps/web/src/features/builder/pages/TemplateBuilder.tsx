import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import {
  createTemplate,
  fetchTemplateDetail,
  updateTemplate,
} from '../../templates/services/templatesApi';
import type { TemplateStructure } from '../../templates/types/template-structure';
import { BuilderHeader } from '../components/BuilderHeader';
import { BuilderPreview } from '../components/BuilderPreview';
import { JsonModal } from '../components/JsonModal';
import { StructureCanvas } from '../components/StructureCanvas';
import { useBuilder } from '../hooks/useBuilder';
import { fieldLabelMap, dependencyCandidates, validateStructure } from '../lib/structureOps';
import { structureDefaultValues } from '../../sheets/lib/defaults';

export function TemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editMode = Boolean(id);

  const detailQuery = useQuery({
    enabled: editMode,
    queryKey: ['template', id],
    queryFn: () => fetchTemplateDetail(id!),
  });

  const builder = useBuilder();

  useEffect(() => {
    if (!detailQuery.data) return;
    builder.load({
      name: detailQuery.data.name,
      description: detailQuery.data.description ?? '',
      system: detailQuery.data.system,
      isPublic: detailQuery.data.isPublic,
      tags: detailQuery.data.tags.map((tag) => tag.name),
      structure: detailQuery.data.structure,
    });
    // Initialize the draft only once the remote template finishes loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.data]);

  const [jsonModal, setJsonModal] = useState<'import' | 'export' | null>(null);

  const candidates = useMemo(
    () =>
      dependencyCandidates(builder.draft.structure, builder.selection.fieldId ?? undefined),
    [builder.draft.structure, builder.selection.fieldId],
  );

  const labelById = useMemo(
    () => fieldLabelMap(builder.draft.structure),
    [builder.draft.structure],
  );

  const previewContext = useMemo(() => {
    const defaults = structureDefaultValues(builder.draft.structure);
    const context: Record<string, number> = {};
    for (const candidate of candidates) {
      const numeric = Number(defaults[candidate.id]);
      context[candidate.id] = Number.isFinite(numeric) ? numeric : 0;
    }
    return context;
  }, [builder.draft.structure, candidates]);

  const errors = useMemo(
    () => validateStructure(builder.draft.structure),
    [builder.draft.structure],
  );

  const shapeKey = useMemo(() => {
    const shape = builder.draft.structure.tabs.map((tab) => ({
      id: tab.id,
      sections: tab.sections.map((section) => ({
        id: section.id,
        columns: section.columns ?? 1,
        fields: section.fields.map((field) => field.id),
      })),
    }));
    return JSON.stringify(shape);
  }, [builder.draft.structure.tabs]);

  const handleImport = (structure: TemplateStructure) => {
    builder.updateStructure(structure);
    setJsonModal(null);
    toast.success('Template structure imported');
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const { draft } = builder;
      const payload = {
        name: draft.name,
        description: draft.description || undefined,
        structure: draft.structure,
        system: draft.system,
        isPublic: draft.isPublic,
        tags: draft.tags.length > 0 ? draft.tags : undefined,
      };
      return editMode && id
        ? updateTemplate(id, payload)
        : createTemplate(payload);
    },
    onSuccess: () => {
      toast.success(editMode ? 'Template updated' : 'Template created');
      navigate('/templates');
    },
    onError: () => {
      toast.error('Could not save the template');
    },
  });

  if (editMode && detailQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-text-muted">
        <Loader2 size={32} className="animate-spin text-gold mb-4" />
        <p className="text-sm">Loading template…</p>
      </div>
    );
  }

  if (editMode && detailQuery.isError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={48} className="text-danger mx-auto mb-4" />
        <h2 className="font-display font-bold text-lg text-text-main mb-2">
          Could not load this template
        </h2>
        <p className="text-sm text-text-muted mb-6">
          It may have been deleted or you may not own it.
        </p>
        <Button variant="outline" size="md" onClick={() => navigate('/templates')}>
          Back to templates
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <BuilderHeader
        builder={builder}
        isSaving={saveMutation.isPending}
        editMode={editMode}
        errors={errors}
        onImport={() => setJsonModal('import')}
        onExport={() => setJsonModal('export')}
        onSave={() => saveMutation.mutate()}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,560px)_1fr] gap-5 items-start">
        <StructureCanvas
          builder={builder}
          data={builder.draft}
          candidates={candidates}
          labelById={labelById}
          previewContext={previewContext}
        />
        <BuilderPreview structure={builder.draft.structure} shapeKey={shapeKey} />
      </div>

      {jsonModal && (
        <JsonModal
          mode={jsonModal}
          structure={builder.draft.structure}
          onClose={() => setJsonModal(null)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}