import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  sub?: string;
  email?: string;
  name?: string;
  userId?: string;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [userData, setUserData] = useState<UserPayload | null>(null);

  useEffect(() => {
    async function fetchPayload() {
      try {
        const token = await SecureStore.getItemAsync('master-sheet-jwt');
        if (token) {
          const decoded: any = jwtDecode(token);
          setUserData(decoded);
        }
      } catch (err) {
        console.log('Erro ao ler token no profile', err);
      }
    }
    fetchPayload();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sair da Plataforma',
      'Tem certeza que deseja desconectar sua identidade deste dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const userName = userData?.name || 'Aventureiro';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-app">
      {/* Cabeçalho */}
      <View className="px-4 pt-4 pb-3 bg-bg-panel border-b border-border">
        <Text className="font-display font-bold text-xl text-text-main tracking-widest">
          Seu Grimório
        </Text>
        <Text className="text-[10px] text-text-muted uppercase tracking-[0.1em] mt-0.5">
          Identidade e credenciais
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        {/* Avatar Dourado */}
        <View className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold items-center justify-center mb-4 shadow-card">
          <Text className="font-display font-bold text-4xl text-gold">
            {userInitial}
          </Text>
        </View>

        <Text className="font-display font-bold text-xl text-text-main mb-1 text-center">
          {userName}
        </Text>
        <Text className="text-xs text-text-muted font-body mb-8 text-center">
          {userData?.email || 'email@desconhecido.com'}
        </Text>

        {/* Informações da Conta */}
        <View className="w-full bg-bg-card border border-border rounded-card p-4 mb-8">
          <Text className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3">
            ✦ Status da Sessão
          </Text>
          <View className="flex-row justify-between py-1.5 border-b border-border/50">
            <Text className="text-xs text-text-muted">Conexão</Text>
            <Text className="text-xs text-success font-bold">Autenticado via JWT</Text>
          </View>
          <View className="flex-row justify-between py-1.5 border-b border-border/50">
            <Text className="text-xs text-text-muted">Armazenamento</Text>
            <Text className="text-xs text-text-main">Expo SecureStore</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs text-text-muted">Sincronização</Text>
            <Text className="text-xs text-gold">Ativa</Text>
          </View>
        </View>

        {/* Ação de Sair */}
        <Button
          variant="danger"
          size="lg"
          className="w-full mt-2"
          onPress={handleSignOut}
        >
          Desconectar Identidade
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
