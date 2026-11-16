import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@master-sheet/ui/button';
import { api, getApiErrorMessage } from '@/services/api';
import { colors } from '@/lib/colors';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setError('Token de verificação ausente.');
      setLoading(false);
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      await api.post('/auth/verify-email', { token });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha na verificação do e-mail.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-bg-app p-6">
      <View className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-8 items-center">
        <Text className="text-2xl font-bold text-text-main mb-4">
          Verificando...
        </Text>

        {loading ? (
          <>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text className="text-text-muted mt-4">Aguarde um momento</Text>
          </>
        ) : success ? (
          <>
            <Text className="text-text-main text-center mb-6">
              E-mail verificado com sucesso!
            </Text>
            <Button onPress={() => router.replace('/login')} variant="gold">
              Continuar para Login
            </Button>
          </>
        ) : (
          <>
            <Text className="text-red-500 text-center mb-6">{error}</Text>
            <Button onPress={() => router.replace('/login')} variant="outline">
              Voltar
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
