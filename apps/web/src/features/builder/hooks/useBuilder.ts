import { useCallback, useState } from 'react';
import type {
  FieldDefinition,
  FieldType,
  SectionDefinition,
  TabDefinition,
  TemplateStructure,
} from '../../templates/types/template-structure';
import {
  addField,
  addSection,
  addTab,
  collectAllIds,
  createField,
  createSection,
  createTab,
  isAutoId,
  moveField,
  moveSection,
  moveTab,
  patchSection,
  removeField,
  removeSection,
  removeTab,
  renameTab,
  replaceField,
  rewireFieldId,
  slugify,
  uniqueId,
} from '../lib/structureOps';

export interface BuilderDraft {
  name: string;
  description: string;
  system: string;
  isPublic: boolean;
  tags: string[];
  structure: TemplateStructure;
}

interface Selection {
  tabId: string;
  sectionId: string;
  fieldId: string | null;
}

function blankDraft(): BuilderDraft {
  return {
    name: 'Untitled template',
    description: '',
    system: 'dnd5e',
    isPublic: false,
    tags: [],
    structure: { system: 'dnd5e', version: 1, tabs: [createTab()] },
  };
}

function resolveSelection(structure: TemplateStructure): Selection {
  const tab = structure.tabs[0];
  const section = tab?.sections[0];
  return {
    tabId: tab?.id ?? '',
    sectionId: section?.id ?? '',
    fieldId: null,
  };
}

function reconcileSelection(
  selection: Selection,
  structure: TemplateStructure,
): Selection {
  const tab = structure.tabs.find((candidate) => candidate.id === selection.tabId);
  if (!tab) return resolveSelection(structure);

  const section = tab.sections.find(
    (candidate) => candidate.id === selection.sectionId,
  );
  if (!section) {
    return {
      tabId: tab.id,
      sectionId: tab.sections[0]?.id ?? '',
      fieldId: null,
    };
  }

  const fieldExists = section.fields.some(
    (candidate) => candidate.id === selection.fieldId,
  );

  return {
    tabId: tab.id,
    sectionId: section.id,
    fieldId: fieldExists ? selection.fieldId : null,
  };
}

export function useBuilder(initial?: BuilderDraft | null) {
  const [draft, setDraft] = useState<BuilderDraft>(initial ?? blankDraft());
  const [selection, setSelection] = useState<Selection>(() =>
    resolveSelection(initial?.structure ?? blankDraft().structure),
  );

  const mutateStructure = useCallback(
    (next: TemplateStructure) => {
      setDraft((prev) => ({ ...prev, structure: next }));
      setSelection((prev) => reconcileSelection(prev, next));
    },
    [],
  );

  const updateStructure = useCallback(
    (next: TemplateStructure) => {
      setDraft((prev) => ({ ...prev, structure: next }));
    },
    [],
  );

  const load = useCallback((next: BuilderDraft) => {
    setDraft(next);
    setSelection(resolveSelection(next.structure));
  }, []);

  const updateMeta = useCallback(
    <K extends keyof Omit<BuilderDraft, 'structure'>>(
      key: K,
      value: BuilderDraft[K],
    ) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const selectTab = useCallback(
    (tabId: string) => {
      setSelection((prev) => {
        const tab = draft.structure.tabs.find((candidate) => candidate.id === tabId);
        if (!tab) return prev;
        return {
          tabId,
          sectionId: tab.sections[0]?.id ?? '',
          fieldId: null,
        };
      });
    },
    [draft.structure.tabs],
  );

  const selectSection = useCallback((sectionId: string) => {
    setSelection((prev) => ({ ...prev, sectionId, fieldId: null }));
  }, []);

  const selectField = useCallback(
    (fieldId: string | null) => {
      setSelection((prev) => ({ ...prev, fieldId }));
    },
    [],
  );

  const handleAddTab = useCallback(() => {
    const tab = createTab(collectAllIds(draft.structure));
    mutateStructure(addTab(draft.structure, tab));
    setSelection({
      tabId: tab.id,
      sectionId: tab.sections[0]?.id ?? '',
      fieldId: null,
    });
  }, [draft.structure, mutateStructure]);

  const handleRenameTab = useCallback(
    (tabId: string, label: string) => {
      mutateStructure(renameTab(draft.structure, tabId, label));
    },
    [draft.structure, mutateStructure],
  );

  const handleRemoveTab = useCallback(() => {
    if (draft.structure.tabs.length <= 1) return;
    mutateStructure(removeTab(draft.structure, selection.tabId));
  }, [draft.structure, selection.tabId, mutateStructure]);

  const handleMoveTab = useCallback(
    (direction: -1 | 1) => {
      mutateStructure(moveTab(draft.structure, selection.tabId, direction));
    },
    [draft.structure, selection.tabId, mutateStructure],
  );

  const handleAddSection = useCallback(() => {
    const section = createSection(collectAllIds(draft.structure));
    mutateStructure(addSection(draft.structure, selection.tabId, section));
    setSelection((prev) => ({ ...prev, sectionId: section.id, fieldId: null }));
  }, [draft.structure, selection.tabId, mutateStructure]);

  const handlePatchSection = useCallback(
    (patch: Partial<SectionDefinition>) => {
      mutateStructure(
        patchSection(
          draft.structure,
          selection.tabId,
          selection.sectionId,
          patch,
        ),
      );
    },
    [draft.structure, selection.tabId, selection.sectionId, mutateStructure],
  );

  const handleRemoveSection = useCallback(() => {
    const tab = draft.structure.tabs.find((t) => t.id === selection.tabId);
    if (!tab || tab.sections.length <= 1) return;
    mutateStructure(
      removeSection(draft.structure, selection.tabId, selection.sectionId),
    );
  }, [draft.structure, selection.tabId, selection.sectionId, mutateStructure]);

  const handleMoveSection = useCallback(
    (direction: -1 | 1) => {
      mutateStructure(
        moveSection(
          draft.structure,
          selection.tabId,
          selection.sectionId,
          direction,
        ),
      );
    },
    [draft.structure, selection.tabId, selection.sectionId, mutateStructure],
  );

  const handleAddField = useCallback(
    (type: FieldType) => {
      const field = createField(type, collectAllIds(draft.structure));
      mutateStructure(
        addField(draft.structure, selection.tabId, selection.sectionId, field),
      );
      setSelection((prev) => ({ ...prev, fieldId: field.id }));
    },
    [draft.structure, selection.tabId, selection.sectionId, mutateStructure],
  );

  const handleReplaceField = useCallback(
    (field: FieldDefinition) => {
      if (!selection.fieldId) return;

      const current = draft.structure.tabs
        .find((tab) => tab.id === selection.tabId)
        ?.sections.find((section) => section.id === selection.sectionId)
        ?.fields.find((candidate) => candidate.id === selection.fieldId);
      if (!current) return;

      const oldId = selection.fieldId;
      const taken = collectAllIds(draft.structure).filter((id) => id !== oldId);

      let nextId = oldId;
      if (field.id !== oldId) {
        const base = field.id.trim() ? field.id : oldId;
        nextId = uniqueId(slugify(base), taken);
      } else if (field.label !== current.label && isAutoId(oldId, current.label)) {
        nextId = uniqueId(slugify(field.label), taken);
      }

      const nextField: FieldDefinition = { ...field, id: nextId };
      let structure = draft.structure;

      if (nextId !== oldId) {
        structure = rewireFieldId(structure, oldId, nextId);
        structure = replaceField(
          structure,
          selection.tabId,
          selection.sectionId,
          nextId,
          nextField,
        );
        setSelection((prev) => ({ ...prev, fieldId: nextId }));
      } else {
        structure = replaceField(
          structure,
          selection.tabId,
          selection.sectionId,
          oldId,
          nextField,
        );
      }

      setDraft((prev) => ({ ...prev, structure }));
    },
    [draft.structure, selection.tabId, selection.sectionId, selection.fieldId],
  );

  const handleRemoveField = useCallback(() => {
    if (!selection.fieldId) return;
    mutateStructure(
      removeField(
        draft.structure,
        selection.tabId,
        selection.sectionId,
        selection.fieldId,
      ),
    );
  }, [draft.structure, selection.tabId, selection.sectionId, selection.fieldId, mutateStructure]);

  const handleMoveField = useCallback(
    (direction: -1 | 1) => {
      if (!selection.fieldId) return;
      mutateStructure(
        moveField(
          draft.structure,
          selection.tabId,
          selection.sectionId,
          selection.fieldId,
          direction,
        ),
      );
    },
    [draft.structure, selection.tabId, selection.sectionId, selection.fieldId, mutateStructure],
  );

  const selectedField = selection.fieldId
    ? draft.structure.tabs
        .find((tab) => tab.id === selection.tabId)
        ?.sections.find((section) => section.id === selection.sectionId)
        ?.fields.find((field) => field.id === selection.fieldId) ?? null
    : null;

  return {
    draft,
    selection,
    selectedField,
    load,
    updateMeta,
    updateStructure,
    selectTab,
    selectSection,
    selectField,
    handleAddTab,
    handleRenameTab,
    handleRemoveTab,
    handleMoveTab,
    handleAddSection,
    handlePatchSection,
    handleRemoveSection,
    handleMoveSection,
    handleAddField,
    handleReplaceField,
    handleRemoveField,
    handleMoveField,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
export type { Selection };
export type { TabDefinition, FieldType };