import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { Dices, AlertTriangle } from 'lucide-react-native';

const TABS = ['Atributos', 'Perícias', 'Equipamento', 'Anotações'];

interface SheetData {
  id: string;
  name?: string;
  data: Record<string, any>;
  template?: {
    name: string;
    structure?: any;
  };
}

export default function SheetViewScreen() {
  const { id, templateId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('Atributos');
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Busca a ficha do banco ou simula se for mock local
  const isMock = typeof id === 'string' && id.startsWith('mock-');

  const {
    data: sheet,
    isLoading,
    isError,
  } = useQuery<SheetData>({
    queryKey: ['sheet', id],
    queryFn: async () => {
      if (isMock) {
        // Busca info do template para montar mock rico
        let tmplName = 'Sistema Customizado';
        if (templateId) {
          try {
            const res = await api.get(`/templates/${templateId}`);
            tmplName = res.data.name;
          } catch (e) {}
        }
        return {
          id: id as string,
          name: 'Personagem em Treinamento',
          data: {
            FOR: '14',
            DES: '16',
            CON: '13',
            INT: '10',
            SAB: '12',
            CAR: '8',
            HP: '24',
            MP: '10',
            Equipamento:
              '• Espada Longa (1d8)\n• Cota de Malha\n• Mochila de Aventureiro',
            Anotações: 'Iniciando a jornada nas cavernas do desespero...',
          },
          template: { name: tmplName },
        };
      }
      const response = await api.get(`/sheets/${id}`);
      return response.data;
    },
  });

  // Inicializa o estado local editável para optimistic UI
  useEffect(() => {
    if (sheet?.data) {
      setLocalData(sheet.data);
    }
  }, [sheet]);

  // Mutação para Auto-save com Optimistic UI
  const updateSheetMutation = useMutation({
    mutationFn: async (newData: Record<string, any>) => {
      if (isMock) return newData;
      const response = await api.patch(`/sheets/${id}`, { data: newData });
      return response.data;
    },
    onMutate: async newData => {
      setSaveStatus('saving');
      // Cancela queries ativas para não sobrescrever o optimistic
      await queryClient.cancelQueries({ queryKey: ['sheet', id] });
      const previousSheet = queryClient.getQueryData<SheetData>(['sheet', id]);

      // Atualiza o cache otimista local
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
      // Rola de volta em caso de erro
      if (context?.previousSheet) {
        queryClient.setQueryData(['sheet', id], context.previousSheet);
      }
      Alert.alert(
        'Erro na sincronização',
        'Não foi possível salvar as últimas alterações.',
      );
    },
  });

  // Manipulador genérico de alteração de campo com debounce simples / disparo imediato
  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateSheetMutation.mutate(updated);
  };

  // Rolagem rápida via FAB
  const handleQuickRoll = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let modifier = 0;
    // Tenta extrair modificador baseado na aba ou atributo
    const forVal = parseInt(localData.FOR || '10', 10);
    modifier = Math.floor((forVal - 10) / 2);
    const total = d20 + modifier;

    Alert.alert(
      '🎲 Rolagem Rápida (d20)',
      `Resultado do Dado: ${d20}\nModificador (FOR): ${modifier >= 0 ? '+' : ''}${modifier}\n\n✦ Total: ${total}`,
      [{ text: 'Incrível!' }],
    );
  };

  const sheetName = sheet?.name || localData?.name || 'Ficha do Aventureiro';
  const systemName = sheet?.template?.name || 'Sistema Dinâmico';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Cabeçalho */}
        <View className="px-4 pt-3 pb-3 bg-bg-panel border-b border-border flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="p-2 -ml-2 active:opacity-60"
          >
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

        {/* Abas Deslizáveis / Segmentadas */}
        <View className="bg-bg-panel/50 border-b border-border">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`py-3 px-4 border-b-2 transition-all ${
                    isActive ? 'border-gold' : 'border-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isActive ? 'text-gold' : 'text-text-muted'
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Conteúdo Dinâmico da Aba */}
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
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            {activeTab === 'Atributos' && (
              <View className="gap-4">
                <Text className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1 border-b border-border pb-1">
                  ✦ Atributos Principais
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {[
                    { key: 'FOR', label: 'Força' },
                    { key: 'DES', label: 'Destreza' },
                    { key: 'CON', label: 'Constituição' },
                    { key: 'INT', label: 'Inteligência' },
                    { key: 'SAB', label: 'Sabedoria' },
                    { key: 'CAR', label: 'Carisma' },
                  ].map(attr => (
                    <View
                      key={attr.key}
                      className="w-[48%] bg-bg-card border border-border rounded-card p-3"
                    >
                      <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1.5 text-center">
                        {attr.label}
                      </Text>
                      <TextInput
                        value={localData[attr.key] || ''}
                        onChangeText={val => handleFieldChange(attr.key, val)}
                        keyboardType="numeric"
                        maxLength={3}
                        className="font-display font-bold text-xl text-center text-gold py-1 bg-bg-panel/50 rounded border border-border/50"
                      />
                    </View>
                  ))}
                </View>

                <Text className="text-[10px] font-bold text-gold uppercase tracking-widest mt-4 mb-1 border-b border-border pb-1">
                  ✦ Recursos
                </Text>
                <View className="flex-row justify-between">
                  <View className="w-[48%] bg-bg-card border border-border rounded-card p-3">
                    <Text className="text-[10px] text-danger font-bold uppercase tracking-wider mb-1.5 text-center">
                      Pontos de Vida (HP)
                    </Text>
                    <TextInput
                      value={localData.HP || ''}
                      onChangeText={val => handleFieldChange('HP', val)}
                      keyboardType="numeric"
                      className="font-display font-bold text-lg text-center text-text-main py-1 bg-bg-panel/50 rounded"
                    />
                  </View>
                  <View className="w-[48%] bg-bg-card border border-border rounded-card p-3">
                    <Text className="text-[10px] text-[#3498db] font-bold uppercase tracking-wider mb-1.5 text-center">
                      Pontos de Mana (MP)
                    </Text>
                    <TextInput
                      value={localData.MP || ''}
                      onChangeText={val => handleFieldChange('MP', val)}
                      keyboardType="numeric"
                      className="font-display font-bold text-lg text-center text-text-main py-1 bg-bg-panel/50 rounded"
                    />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'Perícias' && (
              <View className="bg-bg-card border border-border rounded-card p-4">
                <Text className="text-xs text-text-muted italic text-center py-8">
                  Nenhuma perícia mapeada para este nível ainda. Use atalhos de
                  rolagens com os atributos principais.
                </Text>
              </View>
            )}

            {activeTab === 'Equipamento' && (
              <View className="gap-2">
                <Text className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1 border-b border-border pb-1">
                  ✦ Inventário e Carga
                </Text>
                <TextInput
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  value={localData.Equipamento || ''}
                  onChangeText={val => handleFieldChange('Equipamento', val)}
                  placeholder="Liste suas armas, armaduras e itens..."
                  placeholderTextColor="#888888"
                  className="bg-bg-card border border-border rounded-card p-3 text-text-main font-body min-h-[160px] text-xs leading-relaxed"
                />
              </View>
            )}

            {activeTab === 'Anotações' && (
              <View className="gap-2">
                <Text className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1 border-b border-border pb-1">
                  ✦ Diário de Campanha
                </Text>
                <TextInput
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  value={localData.Anotações || ''}
                  onChangeText={val => handleFieldChange('Anotações', val)}
                  placeholder="Escreva segredos, missões e pistas..."
                  placeholderTextColor="#888888"
                  className="bg-bg-card border border-border rounded-card p-3 text-text-main font-body min-h-[220px] text-xs leading-relaxed"
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating Action Button (FAB) Global */}
        <Pressable
          onPress={handleQuickRoll}
          className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-gold items-center justify-center shadow-card border-2 border-gold-dim active:scale-95 transition-all"
        >
          <Dices size={28} color="#121212" />
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
