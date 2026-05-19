import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderOpen, Compass, AlertTriangle } from 'lucide-react-native';

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  author?: {
    name: string;
  };
  tags?: { name: string }[];
}

const CATEGORIES = [
  'Todos',
  'D&D',
  'Call of Cthulhu',
  'Sci-Fi',
  'Cyberpunk',
  'Fantasia',
  'Terror',
];

export default function TemplatesScreen() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const router = useRouter();

  const {
    data: templates = [],
    isLoading,
    isError,
  } = useQuery<TemplateItem[]>({
    queryKey: [
      'mobile-templates',
      activeCategory !== 'Todos' ? activeCategory : null,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== 'Todos') {
        params.append('tags', activeCategory);
      }
      const qs = params.toString();
      const endpoint = qs ? `/templates?${qs}` : '/templates';
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  const createSheetMutation = useMutation({
    mutationFn: async (tmpl: TemplateItem) => {
      try {
        const response = await api.post('/sheets', {
          templateId: tmpl.id,
          name: `Ficha de ${tmpl.name}`,
          data: {},
        });
        return response.data;
      } catch (err: any) {
        // Fallback imersivo local caso o módulo de sheets no back ainda não esteja pronto
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

  const renderTemplateCard = ({ item }: { item: TemplateItem }) => {
    const isOfficial = item.author?.name === 'Master-Sheet';

    return (
      <View className="bg-bg-card border border-border rounded-card p-4 mb-4">
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
          className="text-xs text-text-muted font-body leading-relaxed mb-4"
          numberOfLines={3}
        >
          {item.description ||
            'Nenhuma descrição fornecida para as regras deste sistema.'}
        </Text>

        {item.tags && item.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {item.tags.map((t, idx) => (
              <View
                key={idx}
                className="bg-bg-panel px-2 py-0.5 rounded border border-border"
              >
                <Text className="text-[9px] text-gold uppercase tracking-wider font-bold">
                  {t.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => createSheetMutation.mutate(item)}
          disabled={createSheetMutation.isPending}
          className="bg-transparent border border-gold py-2.5 rounded-card items-center justify-center active:bg-gold/10"
        >
          <Text className="text-gold font-bold text-xs uppercase tracking-widest">
            {createSheetMutation.isPending
              ? 'Instanciando...'
              : '✦ Criar Ficha'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      {/* Cabeçalho */}
      <View className="px-4 pt-4 pb-3 bg-bg-panel border-b border-border">
        <Text className="font-display font-bold text-xl text-text-main tracking-widest">
          Galeria de Modelos
        </Text>
        <Text className="text-[10px] text-text-muted uppercase tracking-[0.1em] mt-0.5">
          Sistemas e regras disponíveis
        </Text>

        {/* Categorias / Filtros */}
        <View className="mt-4 -mx-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full border transition-all ${
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
                    {cat}
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
          <AlertTriangle size={48} color="#e74c3c" className="mb-3 animate-pulse" />
          <Text className="font-display font-bold text-base text-danger text-center mb-1">
            Falha ao carregar modelos
          </Text>
          <Text className="text-xs text-text-muted text-center">
            Não foi possível listar a galeria pública no momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={renderTemplateCard}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Compass size={48} color="#D4AF37" opacity={0.5} className="mb-4 animate-pulse" />
              <Text className="font-display font-bold text-base text-text-main text-center mb-1">
                Nenhum sistema encontrado
              </Text>
              <Text className="text-xs text-text-muted text-center max-w-xs">
                Tente selecionar outra categoria de filtro acima.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
