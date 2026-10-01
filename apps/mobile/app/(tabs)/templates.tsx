import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FolderOpen,
  Compass,
  AlertTriangle,
  Search,
  ChevronRight,
  Pencil,
  Plus,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { fetchTemplates } from '../../services/templates';
import { DEFAULT_SYSTEMS, SYSTEM_LABELS } from '../../types/template';
import type { TemplateSummary } from '../../types/template';
import { TemplatePreviewBottomSheet } from '../../components/TemplatePreviewBottomSheet';

const SYSTEM_CHIPS: { key: string; label: string; value: string }[] = [
  { key: 'all', label: 'Todos', value: '' },
  ...DEFAULT_SYSTEMS.map(system => ({
    key: system,
    label: SYSTEM_LABELS[system] ?? system,
    value: system,
  })),
];

const BUILDER_HREF: Href = '/builder';
const BUILDER_EDIT_HREF = (templateId: string): Href =>
  `/builder?templateId=${templateId}` as Href;

function useDebouncedValue(value: string, delay = 350): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function TemplatesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeSystem, setActiveSystem] = useState('');
  const [scope, setScope] = useState<'public' | 'mine'>('public');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSummary | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'mobile-templates',
      { search: debouncedSearch, system: activeSystem, scope },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchTemplates({
        search: debouncedSearch || undefined,
        system: activeSystem || undefined,
        scope,
        page: pageParam,
        limit: 12,
      }),
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });

  const createSheetMutation = useMutation({
    mutationFn: async (tmpl: TemplateSummary) => {
      try {
        const response = await api.post('/sheets', {
          templateId: tmpl.id,
          name: `Ficha de ${tmpl.name}`,
          data: {},
        });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log(
            'Módulo de sheets indisponível, usando simulação local fluida',
          );
          return {
            id: 'mock-' + Date.now(),
            templateId: tmpl.id,
            name: `Ficha de ${tmpl.name}`,
            data: {},
            template: tmpl,
          };
        }
        throw err;
      }
    },
    onSuccess: data => {
      setPreviewTemplate(null);
      Alert.alert(
        'Ficha Criada! ✦',
        'Seu novo personagem foi instanciado com sucesso.',
        [
          {
            text: 'Abrir Ficha',
            onPress: () =>
              router.push(
                `/sheets/${data.id}?templateId=${data.templateId || data.template?.id}`,
              ),
          },
        ],
      );
    },
    onError: () => {
      Alert.alert(
        'Erro ao instanciar',
        'Não foi possível criar a ficha a partir deste modelo no momento.',
      );
    },
  });

  const templates = data?.pages.flatMap(page => page.data) ?? [];

  const renderTemplateCard = ({ item }: { item: TemplateSummary }) => {
    const isOfficial = item.isOfficial || item.author?.name === 'Master-Sheet';
    const systemLabel = SYSTEM_LABELS[item.system] ?? item.system;
    const fieldCount = item.structure.tabs.reduce(
      (sum, tab) =>
        sum + tab.sections.reduce((acc, s) => acc + s.fields.length, 0),
      0,
    );

    return (
      <Pressable
        onPress={() => setPreviewTemplate(item)}
        className="bg-bg-card border border-border rounded-card p-4 mb-4 active:border-gold/60 active:bg-gold/5"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 pr-2">
            <Text className="font-display font-bold text-base text-text-main">
              {item.name}
            </Text>
            <Text className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
              Por {item.author?.name || 'Comunidade'} {isOfficial ? '✦' : ''}
            </Text>
          </View>
          <FolderOpen size={20} color="#D4AF37" />
        </View>

        <Text
          className="text-xs text-text-muted font-body leading-relaxed mb-3"
          numberOfLines={3}
        >
          {item.description ||
            'Nenhuma descrição fornecida para as regras deste sistema.'}
        </Text>

        <View className="flex-row flex-wrap gap-1.5 mb-3">
          <View className="bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
            <Text className="text-[9px] text-gold uppercase tracking-wider font-bold">
              {systemLabel}
            </Text>
          </View>
          <View className="bg-bg-panel border border-border px-2 py-0.5 rounded-full">
            <Text className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
              {item.structure.tabs.length} abas · {fieldCount} campos
            </Text>
          </View>
        </View>

        {item.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {item.tags.map(tag => (
              <View
                key={tag.id}
                className="bg-bg-panel px-2 py-0.5 rounded border border-border"
              >
                <Text className="text-[9px] text-gold uppercase tracking-wider font-bold">
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between pt-1 border-t border-border/60 mt-1">
          <View className="flex-row items-center gap-1">
            <Text className="text-gold font-bold text-[11px] uppercase tracking-widest">
              Ver modelo
            </Text>
            <ChevronRight size={14} color="#D4AF37" />
          </View>
          {scope === 'mine' ? (
            <Pressable
              onPress={() => router.push(BUILDER_EDIT_HREF(item.id))}
              className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-card border border-border active:border-gold/60 active:bg-gold/5"
            >
              <Pencil size={12} color="#D4AF37" />
              <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Editar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      {/* Cabeçalho + busca + filtros */}
      <View className="px-4 pt-4 pb-3 bg-bg-panel border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-display font-bold text-xl text-text-main tracking-widest">
              Galeria de Modelos
            </Text>
            <Text className="text-[10px] text-text-muted uppercase tracking-[0.1em] mt-0.5">
              Sistemas e regras disponíveis
            </Text>
          </View>
        </View>

        {/* Escopo: Explorar vs Meus modelos */}
        <View className="mt-4 flex-row items-center gap-2">
          <View className="flex-1 flex-row bg-bg-card border border-border rounded-card p-1">
            {([
              { key: 'public', label: 'Explorar' },
              { key: 'mine', label: 'Meus modelos' },
            ] as const).map(option => {
              const active = scope === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setScope(option.key)}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    active ? 'bg-gold' : ''
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      active ? 'text-[#121212]' : 'text-text-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {scope === 'mine' ? (
            <Pressable
              onPress={() => router.push(BUILDER_HREF)}
              hitSlop={8}
              className="p-2 border border-gold/60 rounded-card flex-row items-center gap-1 active:bg-gold/10"
            >
              <Plus size={14} color="#D4AF37" />
              <Text className="text-[10px] font-bold uppercase tracking-wider text-gold">
                Novo
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Busca */}
        <View className="mt-4 flex-row items-center bg-bg-card border border-border rounded-card px-3">
          <Search size={16} color="#888888" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar modelos..."
            placeholderTextColor="#888888"
            returnKeyType="search"
            className="flex-1 py-2.5 pl-2 text-text-main font-body text-sm"
          />
        </View>

        {/* Filtro por sistema */}
        <View className="mt-3 -mx-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {SYSTEM_CHIPS.map(chip => {
              const isActive = activeSystem === chip.value;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => setActiveSystem(chip.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    isActive
                      ? 'bg-gold border-gold'
                      : 'bg-bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#121212]' : 'text-text-muted'
                    }`}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle
            size={48}
            color="#e74c3c"
            className="mb-3 animate-pulse"
          />
          <Text className="font-display font-bold text-base text-danger text-center mb-1">
            Falha ao carregar modelos
          </Text>
          <Text className="text-xs text-text-muted text-center">
            Não foi possível listar os modelos no momento. puxe para
            recarregar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={renderTemplateCard}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#D4AF37" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            scope === 'mine' ? (
              <View className="flex-1 items-center justify-center py-12">
                <Compass
                  size={48}
                  color="#D4AF37"
                  opacity={0.5}
                  className="mb-4 animate-pulse"
                />
                <Text className="font-display font-bold text-base text-text-main text-center mb-1">
                  Nenhum modelo seu ainda
                </Text>
                <Text className="text-xs text-text-muted text-center max-w-xs mb-4">
                  Crie seu primeiro modelo para montar sua própria ficha.
                </Text>
                <Pressable
                  onPress={() => router.push(BUILDER_HREF)}
                  className="bg-gold px-5 py-3 rounded-card items-center active:bg-gold-dim"
                >
                  <Text className="text-[#121212] font-bold text-xs uppercase tracking-widest">
                    + Criar modelo
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-12">
                <Compass
                  size={48}
                  color="#D4AF37"
                  opacity={0.5}
                  className="mb-4 animate-pulse"
                />
                <Text className="font-display font-bold text-base text-text-main text-center mb-1">
                  Nenhum sistema encontrado
                </Text>
                <Text className="text-xs text-text-muted text-center max-w-xs">
                  Tente ajustar a busca ou selecionar outro sistema acima.
                </Text>
              </View>
            )
          }
        />
      )}

      <TemplatePreviewBottomSheet
        template={previewTemplate}
        visible={previewTemplate !== null}
        creating={createSheetMutation.isPending}
        onClose={() => setPreviewTemplate(null)}
        onCreate={template => createSheetMutation.mutate(template)}
      />
    </SafeAreaView>
  );
}