import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { fetchTemplateDetail } from '@/services/templates';
import { Dices, AlertTriangle, X } from 'lucide-react-native';
import type { TemplateStructure } from '@/types/template';
import { structureDefaultValues, toNumber } from '@/lib/defaults';
import { evaluateFormula } from '@/lib/formula';
import { DynamicSheetRenderer } from '@/components/sheet/DynamicSheetRenderer';

interface SheetData {
  id: string;
  name?: string;
  data: Record<string, any>;
  template?: {
    name: string;
    structure?: TemplateStructure;
  };
}

interface DiceAttribute {
  id: string;
  label: string;
  value: number;
}

function collectDiceAttributes(
  structure: TemplateStructure | undefined,
  values: Record<string, unknown>,
): DiceAttribute[] {
  if (!structure) return [];

  const attributes: DiceAttribute[] = [];
  const numericTypes = new Set(['number', 'dots', 'checkbox']);

  for (const tab of structure.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        if (field.type === 'repeater') continue;

        if (field.type === 'formula') {
          try {
            const context: Record<string, number> = {};
            for (const dep of field.dependencies) {
              context[dep] = toNumber(values[dep]);
            }
            attributes.push({
              id: field.id,
              label: field.label,
              value: evaluateFormula(field.expression, context),
            });
          } catch {
            // Formulas with unresolved dependencies are skipped.
          }
          continue;
        }

        if (numericTypes.has(field.type)) {
          attributes.push({
            id: field.id,
            label: field.label,
            value: toNumber(values[field.id]),
          });
        }
      }
    }
  }

  return attributes;
}

export default function SheetViewScreen() {
  const { id, templateId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [rollOpen, setRollOpen] = useState(false);

  const isMock = typeof id === 'string' && id.startsWith('mock-');

  const {
    data: sheet,
    isLoading,
    isError,
    refetch,
  } = useQuery<SheetData>({
    queryKey: ['sheet', id],
    queryFn: async () => {
      if (isMock) {
        let tmplName = 'Sistema Customizado';
        let structure: TemplateStructure | undefined;

        if (templateId) {
          try {
            const detail = await fetchTemplateDetail(String(templateId));
            tmplName = detail.name;
            structure = detail.structure;
          } catch {}
        }

        return {
          id: id as string,
          name: 'Personagem em Treinamento',
          data: {},
          template: { name: tmplName, structure },
        };
      }
      const response = await api.get(`/sheets/${id}`);
      return response.data;
    },
  });

  const structure = sheet?.template?.structure;
  const tabs = useMemo(() => structure?.tabs ?? [], [structure]);

  // Inicializa o estado local editável para optimistic UI
  useEffect(() => {
    if (sheet?.data) {
      const defaults = structure
        ? structureDefaultValues(structure, sheet.data)
        : sheet.data;
      setLocalData(defaults);

      const firstTab = structure?.tabs?.[0];
      if (firstTab && activeTabId === null) {
        setActiveTabId(firstTab.id);
      }
    }
    // A aba ativa é definida apenas quando o structure chega pela primeira vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(tab => tab.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  // Mutação para Auto-save com Optimistic UI
  const updateSheetMutation = useMutation({
    mutationFn: async (newData: Record<string, any>) => {
      if (isMock) return newData;
      const response = await api.patch(`/sheets/${id}`, { data: newData });
      return response.data;
    },
    onMutate: async newData => {
      setSaveStatus('saving');
      await queryClient.cancelQueries({ queryKey: ['sheet', id] });
      const previousSheet = queryClient.getQueryData<SheetData>(['sheet', id]);

      if (previousSheet) {
        queryClient.setQueryData(['sheet', id], {
          ...previousSheet,
          data: newData,
        });
      }
      return { previousSheet };
    },
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: (err, newData, context) => {
      setSaveStatus('saved');
      if (context?.previousSheet) {
        queryClient.setQueryData(['sheet', id], context.previousSheet);
      }
      Alert.alert(
        'Erro na sincronização',
        'Não foi possível salvar as últimas alterações.',
      );
    },
  });

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateSheetMutation.mutate(updated);
  };

  const diceAttributes = useMemo(
    () => collectDiceAttributes(structure, localData),
    [structure, localData],
  );

  const handleRoll = (attribute: DiceAttribute) => {
    setRollOpen(false);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + attribute.value;

    Alert.alert(
      '🎲 Teste de Atributo',
      `${attribute.label} (mod ${attribute.value >= 0 ? '+' : ''}${attribute.value})\n\nDado: ${d20}\n✦ Total: ${total}`,
      [{ text: 'Incrível!' }],
    );
  };

  const sheetName = sheet?.name || localData?.name || 'Ficha do Aventureiro';
  const systemName = sheet?.template?.name || 'Sistema Dinâmico';

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Cabeçalho */}
        <View className="px-4 pt-3 pb-3 bg-bg-panel border-b border-border flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Text className="text-gold font-bold text-base">◀ Voltar</Text>
          </Pressable>

          <View className="flex-1 px-4 items-center">
            <Text className="font-display font-bold text-base text-text-main truncate">
              {sheetName}
            </Text>
            <Text className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5 truncate">
              {systemName}
            </Text>
          </View>

          <View className="w-12 items-end">
            <View
              className={`w-2 h-2 rounded-full ${saveStatus === 'saving' ? 'bg-warning animate-pulse' : 'bg-success'}`}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center p-6">
            <AlertTriangle size={48} color="#e74c3c" className="mb-2" />
            <Text className="font-display font-bold text-base text-danger text-center">
              Ficha Inacessível
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-4 border border-gold px-4 py-2 rounded-card"
            >
              <Text className="text-gold text-xs font-bold uppercase tracking-widest">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : tabs.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <AlertTriangle size={40} color="#D4AF37" className="mb-3" />
            <Text className="font-display font-bold text-base text-text-main text-center mb-1">
              Modelo sem estrutura
            </Text>
            <Text className="text-xs text-text-muted text-center">
              O template desta ficha ainda não possui abas configuradas.
            </Text>
          </View>
        ) : (
          <>
            {/* Abas Deslizáveis do template */}
            <View className="bg-bg-panel/50 border-b border-border">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
              >
                {tabs.map(tab => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setActiveTabId(tab.id)}
                      className={`py-3 px-4 border-b-2 transition-all ${
                        isActive ? 'border-gold' : 'border-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isActive ? 'text-gold' : 'text-text-muted'
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
            >
              {activeTab ? (
                <DynamicSheetRenderer
                  tab={activeTab}
                  values={localData}
                  onChange={handleFieldChange}
                />
              ) : null}
            </ScrollView>
          </>
        )}

        {/* Floating Action Button (FAB) Rolagem Contextual */}
        {tabs.length > 0 && diceAttributes.length > 0 && (
          <Pressable
            onPress={() => setRollOpen(true)}
            className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-gold items-center justify-center shadow-card border-2 border-gold-dim active:scale-95 transition-all"
          >
            <Dices size={28} color="#121212" />
          </Pressable>
        )}

        {/* Modal contextual de atributos */}
        <Modal
          visible={rollOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setRollOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <Pressable
              className="absolute inset-0"
              onPress={() => setRollOpen(false)}
            />
            <View className="bg-bg-panel border-t border-border rounded-t-3xl max-h-[70%]">
              <View className="items-center py-2.5">
                <View className="w-10 h-1 rounded-full bg-border" />
              </View>
              <View className="flex-row items-center px-5 pb-3">
                <Dices size={16} color="#D4AF37" />
                <Text className="ml-2 font-display font-bold text-sm text-text-main uppercase tracking-widest">
                  Roletar Atributo
                </Text>
                <Pressable
                  onPress={() => setRollOpen(false)}
                  className="ml-auto p-1"
                  hitSlop={8}
                >
                  <X size={18} color="#888888" />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 8 }}
              >
                {diceAttributes.map(attribute => (
                  <Pressable
                    key={attribute.id}
                    onPress={() => handleRoll(attribute)}
                    className="bg-bg-card border border-border rounded-card px-4 py-3 flex-row items-center active:border-gold/60"
                  >
                    <Text className="text-sm font-bold text-text-main flex-1">
                      {attribute.label}
                    </Text>
                    <View className="bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">
                      <Text className="text-[11px] text-gold font-bold tabular-nums">
                        {attribute.value >= 0 ? '+' : ''}
                        {attribute.value}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}