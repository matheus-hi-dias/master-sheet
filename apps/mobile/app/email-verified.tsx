import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@master-sheet/ui/button';

export default function EmailVerifiedScreen() {
  const { status, message } = useLocalSearchParams<{
    status: string;
    message: string;
  }>();
  const router = useRouter();

  const isSuccess = status === 'success';

  return (
    <View className="flex-1 items-center justify-center bg-bg-app p-6">
      <View className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-8 items-center">
        <Text className="text-2xl font-bold text-text-main mb-4">
          Verificação de E-mail
        </Text>

        {isSuccess ? (
          <>
            <Text className="text-text-main text-center mb-6">
              Seu e-mail foi verificado com sucesso! Agora você pode acessar sua
              conta.
            </Text>
            <Button onPress={() => router.replace('/login')} variant="gold">
              Ir para Login
            </Button>
          </>
        ) : (
          <>
            <Text className="text-red-500 text-center mb-2">
              Status: {status}
            </Text>
            {message ? (
              <Text className="text-text-muted text-center mb-6 text-sm">
                {message}
              </Text>
            ) : null}
            <Text className="text-text-main text-center mb-6">
              Não foi possível verificar seu e-mail. O link pode ter expirado ou
              ser inválido.
            </Text>
            <Button onPress={() => router.replace('/login')} variant="outline">
              Voltar
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
