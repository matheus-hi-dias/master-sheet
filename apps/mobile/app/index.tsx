import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { GemLogo } from '@master-sheet/ui/gem-logo';
import { colors } from '@/lib/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-app">
        <GemLogo size={64} />
        <ActivityIndicator size="large" color={colors.gold} className="mt-8" />
        <Text className="text-text-muted text-xs tracking-widest uppercase mt-4 font-body">
          Carregando Aventura...
        </Text>
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
