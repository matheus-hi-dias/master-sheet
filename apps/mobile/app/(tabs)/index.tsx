import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Dices, AlertTriangle } from 'lucide-react-native';

interface SheetItem {
  id: string;
  name?: string;
  data?: any;
  template?: {
    name: string;
  };
  updatedAt?: string;
}

export default function SheetsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: sheets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<SheetItem[]>({
    queryKey: ['mobile-sheets'],
    queryFn: async () => {
      const response = await api.get('/sheets');
      return response.data;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = ({ item }: { item: SheetItem }) => {
    const sheetName = item.name || item.data?.name || 'Aventureiro Sem Nome';
    const systemName = item.template?.name || 'Sistema Customizado';

    return (
      <Pressable
        onPress={() => router.push(`/sheets/${item.id}`)}
        className="bg-bg-card border border-border rounded-card p-4 mb-4 active:opacity-70 flex-row items-center justify-between min-h-[70px]"
      >
        <View className="flex-1 pr-3">
          <Text className="font-display font-bold text-base text-gold mb-1">
            {sheetName}
          </Text>
          <Text className="text-xs text-text-muted font-body uppercase tracking-widest">
            {systemName}
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-bg-panel items-center justify-center border border-border">
          <Dices size={20} color="#D4AF37" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      <View className="px-4 pt-4 pb-2 border-b border-border bg-bg-panel">
        <Text className="font-display font-bold text-xl text-text-main tracking-widest">
          Minhas Fichas
        </Text>
        <Text className="text-[10px] text-text-muted uppercase tracking-[0.1em] mt-0.5">
          Seus personagens ativos
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle size={48} color="#e74c3c" className="mb-3 animate-pulse" />
          <Text className="font-display font-bold text-base text-danger text-center mb-1">
            Erro ao carregar fichas
          </Text>
          <Text className="text-xs text-text-muted text-center">
            Verifique sua conexão ou tente recarregar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sheets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <FileText size={48} color="#D4AF37" opacity={0.5} className="mb-4 animate-pulse" />
              <Text className="font-display font-bold text-base text-text-main text-center mb-2">
                Nenhuma ficha criada
              </Text>
              <Text className="text-xs text-text-muted text-center mb-6 max-w-xs">
                Explore a galeria de modelos para criar seu primeiro personagem.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/templates')}
                className="bg-gold px-5 py-3 rounded-card active:opacity-80"
              >
                <Text className="text-[#121212] font-bold text-xs uppercase tracking-widest text-center">
                  Explorar Modelos
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
