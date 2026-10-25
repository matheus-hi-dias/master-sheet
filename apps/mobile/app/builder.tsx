import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Eye,
  Save,
  TriangleAlert,
} from 'lucide-react-native';
import {
  useBuilder,
  type BuilderDraft,
} from '../hooks/useBuilder';
import {
  dependencyCandidates,
  fieldLabelMap,
  type DepCandidate,
} from '../lib/builder/structureOps';
import { structureDefaultValues, toNumber } from '../lib/defaults';
import {
  createTemplate,
  fetchTemplateDetail,
  updateTemplate,
} from '../services/templates';
import type { TemplateSummary, FieldType } from '../types/template';
import { MetaEditor } from '../components/builder/MetaEditor';
import { BuilderRow, AddRow } from '../components/builder/BuilderRow';
import { FieldInspectorSheet } from '../components/builder/FieldInspectorSheet';
import { PreviewModal } from '../components/builder/PreviewModal';
import { Toast, type ToastState } from '../components/builder/Toast';

type Level =
  | { kind: 'tabs' }
  | { kind: 'sections'; tabId: string }
  | { kind: 'fields'; tabId: string; sectionId: string };

interface InspectorTarget {
  tabId: string;
  sectionId: string;
  fieldId: string;
}

const TYPE_ACTION_LABELS: Record<FieldType, string> = {
  number: 'number',
  text: 'text',
  textarea: 'textarea',
  dots: 'dots',
  select: 'select',
  checkbox: 'checkbox',
  formula: 'formula',
  repeater: 'repeater',
};

function draftFromTemplate(template: TemplateSummary): BuilderDraft {
  return {
    name: template.name,
    description: template.description ?? '',
    system: template.system,
    isPublic: template.isPublic,
    tags: template.tags.map(tag => tag.name),
    structure: template.structure,
  };
}

function extractTemplateError(err: unknown): string {
  const error = err as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' · ');
  if (typeof message === 'string' && message.length > 0) return message;
  return 'Não foi possível salvar o modelo. Tente novamente.';
}

export default function BuilderScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const editingId = typeof templateId === 'string' ? templateId : undefined;

  const [initial, setInitial] = useState<BuilderDraft | null>(null);
  const [loading, setLoading] = useState(Boolean(editingId));
  const [level, setLevel] = useState<Level>({ kind: 'tabs' });
  const [inspector, setInspector] = useState<InspectorTarget | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const builder = useBuilder(initial);

  useEffect(() => {
    if (editingId) {
      fetchTemplateDetail(editingId)
        .then(template => setInitial(draftFromTemplate(template)))
        .catch(() =>
          setToast({
            type: 'error',
            text: 'Não foi possível carregar o modelo para edição.',
          }),
        )
        .finally(() => setLoading(false));
    }
  }, [editingId]);

  const showToast = useCallback((next: ToastState) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const tab =
    level.kind !== 'tabs'
      ? builder.draft.structure.tabs.find(t => t.id === level.tabId)
      : undefined;

  const section =
    level.kind === 'fields' && tab
      ? tab.sections.find(s => s.id === level.sectionId)
      : undefined;

  const candidates: DepCandidate[] = dependencyCandidates(builder.draft.structure);

  const labelById = useMemo(
    () => fieldLabelMap(builder.draft.structure),
    [builder.draft.structure],
  );

  const previewContext = useMemo(() => {
    const defaults = structureDefaultValues(builder.draft.structure);
    const context: Record<string, number> = {};
    for (const candidate of candidates) {
      context[candidate.id] = toNumber(defaults[candidate.id]);
    }
    return context;
  }, [builder.draft.structure, candidates]);

  const selectedField =
    inspector && tab && section
      ? section.fields.find(f => f.id === inspector.fieldId) ?? null
      : null;

  const goBack = () => {
    if (level.kind === 'sections') {
      setLevel({ kind: 'tabs' });
    } else if (level.kind === 'fields') {
      setLevel({ kind: 'sections', tabId: level.tabId });
    } else {
      router.back();
    }
  };

  const headerTitle =
    level.kind === 'tabs'
      ? 'Editor de modelo'
      : level.kind === 'sections'
        ? tab?.label ?? 'Abas'
        : section?.title ?? 'Seções';

  const handleSave = async () => {
    if (builder.errors.length > 0) {
      showToast({ type: 'error', text: builder.errors[0] });
      return;
    }

    if (saving) return;
    setSaving(true);

    const { name, description, system, isPublic, tags, structure } =
      builder.draft;

    const payload = {
      name,
      description: description || undefined,
      system,
      isPublic,
      tags,
      structure,
    };

    try {
      if (editingId) {
        await updateTemplate(editingId, payload);
      } else {
        await createTemplate(payload);
      }
      showToast({ type: 'ok', text: 'Modelo salvo com sucesso!' });
      toastTimer.current = setTimeout(() => router.back(), 700);
    } catch (error) {
      showToast({ type: 'error', text: extractTemplateError(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg-app items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-xs text-text-muted mt-3">
          Carregando modelo…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      <View className="px-4 pt-3 pb-3 bg-bg-panel border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-2">
            <Pressable
              onPress={goBack}
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <ChevronLeft size={22} color="#D4AF37" />
            </Pressable>
            <Text
              className="font-display font-bold text-base text-text-main flex-1"
              numberOfLines={1}
            >
              {headerTitle}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setPreviewOpen(true)}
              hitSlop={6}
              className="p-2 border border-border rounded-card active:bg-gold/10"
            >
              <Eye size={18} color="#D4AF37" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-gold px-3.5 py-2 rounded-card items-center justify-center flex-row gap-1.5 active:bg-gold-dim"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Save size={15} color="#121212" />
              )}
              <Text className="text-[#121212] font-bold text-[11px] uppercase tracking-widest">
                Salvar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {builder.errors.length > 0 ? (
        <View className="mx-4 mt-3 bg-danger/10 border border-danger/40 rounded-card px-3 py-2.5 flex-row items-start gap-2">
          <TriangleAlert size={15} color="#e74c3c" className="mt-0.5" />
          <View className="flex-1" style={{ gap: 2 }}>
            {builder.errors.map(error => (
              <Text
                key={error}
                className="text-[11px] text-danger font-body"
              >
                {error}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {level.kind === 'tabs' ? (
            <TabsLevel builder={builder} onDrill={tabId => setLevel({ kind: 'sections', tabId })} />
          ) : null}

          {level.kind === 'sections' && tab ? (
            <SectionsLevel
              builder={builder}
              tab={tab}
              onDrill={sectionId =>
                setLevel({ kind: 'fields', tabId: tab.id, sectionId })
              }
            />
          ) : null}

          {level.kind === 'fields' && tab && section ? (
            <FieldsLevel
              builder={builder}
              tabId={tab.id}
              section={section}
              onOpenInspector={fieldId =>
                setInspector({ tabId: tab.id, sectionId: section.id, fieldId })
              }
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <FieldInspectorSheet
        field={selectedField}
        candidates={candidates}
        labelById={labelById}
        previewContext={previewContext}
        onChange={(next) => {
          if (!inspector) return;
          const nextId = builder.handleReplaceField(
            inspector.tabId,
            inspector.sectionId,
            inspector.fieldId,
            next,
          );
          if (nextId !== inspector.fieldId) {
            setInspector(prev =>
              prev ? { ...prev, fieldId: nextId } : prev,
            );
          }
        }}
        onClose={() => setInspector(null)}
      />

      <PreviewModal
        visible={previewOpen}
        structure={builder.draft.structure}
        onClose={() => setPreviewOpen(false)}
      />

      <Toast toast={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

function TabsLevel({
  builder,
  onDrill,
}: {
  builder: ReturnType<typeof useBuilder>;
  onDrill: (tabId: string) => void;
}) {
  const { draft } = builder;

  return (
    <View>
      <MetaEditor draft={draft} updateMeta={builder.updateMeta} />

      <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-2">
        Abas
      </Text>
      <View style={{ gap: 8 }}>
        {draft.structure.tabs.map((tab, index) => (
          <BuilderRow
            key={tab.id}
            onPress={() => onDrill(tab.id)}
            subtitle={`${tab.sections.length} ${
              tab.sections.length === 1 ? 'seção' : 'seções'
            }`}
            onUp={() => builder.handleMoveTab(tab.id, -1)}
            onDown={() => builder.handleMoveTab(tab.id, 1)}
            onDelete={() => builder.handleRemoveTab(tab.id)}
            isFirst={index === 0}
            isLast={index === draft.structure.tabs.length - 1}
            label={
              <TextInput
                value={tab.label}
                onChangeText={label => builder.handleRenameTab(tab.id, label)}
                placeholder="Nome da aba"
                placeholderTextColor="#888888"
                className="text-text-main font-body text-sm py-0"
              />
            }
          />
        ))}
      </View>

      <View className="mt-3">
        <AddRow label="Adicionar aba" onPress={() => builder.handleAddTab()} />
      </View>
    </View>
  );
}

function SectionsLevel({
  builder,
  tab,
  onDrill,
}: {
  builder: ReturnType<typeof useBuilder>;
  tab: ReturnType<typeof useBuilder>['draft']['structure']['tabs'][number];
  onDrill: (sectionId: string) => void;
}) {
  const { draft } = builder;

  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-2">
        Seções de «{tab.label}»
      </Text>
      <View style={{ gap: 8 }}>
        {tab.sections.map((section, index) => (
          <BuilderRow
            key={section.id}
            onPress={() => onDrill(section.id)}
            subtitle={`${section.fields.length} ${
              section.fields.length === 1 ? 'campo' : 'campos'
            } · ${section.columns ?? 1} col.`}
            onUp={() => builder.handleMoveSection(tab.id, section.id, -1)}
            onDown={() => builder.handleMoveSection(tab.id, section.id, 1)}
            onDelete={() => builder.handleRemoveSection(tab.id, section.id)}
            isFirst={index === 0}
            isLast={index === tab.sections.length - 1}
            label={
              <TextInput
                value={section.title}
                onChangeText={title =>
                  builder.handlePatchSection(tab.id, section.id, { title })
                }
                placeholder="Título da seção"
                placeholderTextColor="#888888"
                className="text-text-main font-body text-sm py-0"
              />
            }
          />
        ))}
      </View>

      <View className="mt-3">
        <AddRow label="Adicionar seção" onPress={() => builder.handleAddSection(tab.id)} />
      </View>
    </View>
  );
}

function FieldsLevel({
  builder,
  tabId,
  section,
  onOpenInspector,
}: {
  builder: ReturnType<typeof useBuilder>;
  tabId: string;
  section: ReturnType<typeof useBuilder>['draft']['structure']['tabs'][number]['sections'][number];
  onOpenInspector: (fieldId: string) => void;
}) {
  const columns = Math.min(Math.max(section.columns ?? 1, 1), 4);

  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-2">
        Campos de «{section.title}»
      </Text>

      <View className="bg-bg-panel border border-border rounded-card p-3 mb-4">
        <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-2">
          Colunas da grade
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {[1, 2, 3, 4].map(count => {
            const active = count === columns;
            return (
              <Pressable
                key={count}
                onPress={() =>
                  builder.handlePatchSection(tabId, section.id, { columns: count })
                }
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'bg-gold border-gold' : 'bg-bg-card border-border'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active ? 'text-[#121212]' : 'text-text-muted'
                  }`}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {section.fields.map((field, index) => (
          <BuilderRow
            key={field.id}
            onPress={() => onOpenInspector(field.id)}
            subtitle={field.type}
            onUp={() => builder.handleMoveField(tabId, section.id, field.id, -1)}
            onDown={() => builder.handleMoveField(tabId, section.id, field.id, 1)}
            onDelete={() => builder.handleRemoveField(tabId, section.id, field.id)}
            isFirst={index === 0}
            isLast={index === section.fields.length - 1}
            label={
              <Text className="text-text-main font-body text-sm" numberOfLines={1}>
                {field.label || field.type}
              </Text>
            }
          />
        ))}
      </View>

      <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-2 mt-4">
        Adicionar campo
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {(Object.keys(TYPE_ACTION_LABELS) as FieldType[]).map(type => (
          <Pressable
            key={type}
            onPress={() => {
              const field = builder.handleAddField(tabId, section.id, type);
              onOpenInspector(field.id);
            }}
            className="px-3 py-1.5 rounded-full border border-gold/60 bg-gold/10 active:bg-gold/20"
          >
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gold">
              {TYPE_ACTION_LABELS[type]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}