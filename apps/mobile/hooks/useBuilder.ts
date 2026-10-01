import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  FieldDefinition,
  FieldType,
  SectionDefinition,
  TabDefinition,
  TemplateStructure,
} from '../types/template';
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
  validateStructure,
} from '../lib/builder/structureOps';

export interface BuilderDraft {
  name: string;
  description: string;
  system: string;
  isPublic: boolean;
  tags: string[];
  structure: TemplateStructure;
}

export function blankDraft(): BuilderDraft {
  return {
    name: 'Modelo sem título',
    description: '',
    system: 'dnd5e',
    isPublic: false,
    tags: [],
    structure: { system: 'dnd5e', version: 1, tabs: [createTab()] },
  };
}

export function useBuilder(initial?: BuilderDraft | null) {
  const [draft, setDraft] = useState<BuilderDraft>(() => initial ?? blankDraft());

  useEffect(() => {
    if (initial) load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const setStructure = useCallback((next: TemplateStructure) => {
    setDraft(prev => ({ ...prev, structure: next }));
  }, []);

  const updateMeta = useCallback(
    <K extends keyof Omit<BuilderDraft, 'structure'>>(
      key: K,
      value: BuilderDraft[K],
    ) => {
      setDraft(prev => {
        if (key === 'system') {
          return {
            ...prev,
            system: value as string,
            structure: { ...prev.structure, system: value as string },
          };
        }
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const load = useCallback((next: BuilderDraft) => {
    setDraft(next);
  }, []);

  const handleAddTab = useCallback(() => {
    const tab = createTab(collectAllIds(draft.structure));
    setStructure(addTab(draft.structure, tab));
    return tab;
  }, [draft.structure, setStructure]);

  const handleRenameTab = useCallback(
    (tabId: string, label: string) => {
      setStructure(renameTab(draft.structure, tabId, label));
    },
    [draft.structure, setStructure],
  );

  const handleRemoveTab = useCallback(
    (tabId: string) => {
      if (draft.structure.tabs.length <= 1) return;
      setStructure(removeTab(draft.structure, tabId));
    },
    [draft.structure, setStructure],
  );

  const handleMoveTab = useCallback(
    (tabId: string, direction: -1 | 1) => {
      setStructure(moveTab(draft.structure, tabId, direction));
    },
    [draft.structure, setStructure],
  );

  const handleAddSection = useCallback(
    (tabId: string) => {
      const section = createSection(collectAllIds(draft.structure));
      setStructure(addSection(draft.structure, tabId, section));
      return section;
    },
    [draft.structure, setStructure],
  );

  const handlePatchSection = useCallback(
    (tabId: string, sectionId: string, patch: Partial<SectionDefinition>) => {
      setStructure(
        patchSection(draft.structure, tabId, sectionId, patch),
      );
    },
    [draft.structure, setStructure],
  );

  const handleRemoveSection = useCallback(
    (tabId: string, sectionId: string) => {
      const tab = draft.structure.tabs.find(t => t.id === tabId);
      if (!tab || tab.sections.length <= 1) return;
      setStructure(removeSection(draft.structure, tabId, sectionId));
    },
    [draft.structure, setStructure],
  );

  const handleMoveSection = useCallback(
    (tabId: string, sectionId: string, direction: -1 | 1) => {
      setStructure(moveSection(draft.structure, tabId, sectionId, direction));
    },
    [draft.structure, setStructure],
  );

  const handleAddField = useCallback(
    (tabId: string, sectionId: string, type: FieldType) => {
      const field = createField(type, collectAllIds(draft.structure));
      setStructure(addField(draft.structure, tabId, sectionId, field));
      return field;
    },
    [draft.structure, setStructure],
  );

  const handleReplaceField = useCallback(
    (
      tabId: string,
      sectionId: string,
      fieldId: string,
      field: FieldDefinition,
    ) => {
      const current = draft.structure.tabs
        .find(candidateTab => candidateTab.id === tabId)
        ?.sections.find(candidateSection => candidateSection.id === sectionId)
        ?.fields.find(candidateField => candidateField.id === fieldId);

      if (!current) return fieldId;

      const taken = collectAllIds(draft.structure).filter(id => id !== fieldId);

      let nextId = fieldId;
      if (field.id !== fieldId) {
        const base = field.id.trim() ? field.id : fieldId;
        nextId = uniqueId(slugify(base), taken);
      } else if (field.label !== current.label && isAutoId(fieldId, current.label)) {
        nextId = uniqueId(slugify(field.label), taken);
      }

      const nextField: FieldDefinition = { ...field, id: nextId };
      let structure = draft.structure;

      if (nextId !== fieldId) {
        structure = rewireFieldId(structure, fieldId, nextId);
        structure = replaceField(structure, tabId, sectionId, nextId, nextField);
      } else {
        structure = replaceField(structure, tabId, sectionId, fieldId, nextField);
      }

      setStructure(structure);
      return nextId;
    },
    [draft.structure, setStructure],
  );

  const handleRemoveField = useCallback(
    (tabId: string, sectionId: string, fieldId: string) => {
      setStructure(removeField(draft.structure, tabId, sectionId, fieldId));
    },
    [draft.structure, setStructure],
  );

  const handleMoveField = useCallback(
    (tabId: string, sectionId: string, fieldId: string, direction: -1 | 1) => {
      setStructure(
        moveField(draft.structure, tabId, sectionId, fieldId, direction),
      );
    },
    [draft.structure, setStructure],
  );

  const errors = useMemo(
    () => validateStructure(draft.structure),
    [draft.structure],
  );

  return {
    draft,
    errors,
    load,
    updateMeta,
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
export type { TabDefinition, FieldType };