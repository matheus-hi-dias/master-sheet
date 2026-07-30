import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { api } from '@/services/api';

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
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Falha na verificação do e-mail.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#121212] p-6">
      <View className="w-full max-w-sm rounded-lg border border-[#3D3D3D] bg-[#242424] p-8 items-center">
        <Text className="text-2xl font-bold text-[#E0E0E0] mb-4">
          Verificando...
        </Text>

        {loading ? (
          <>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-[#888888] mt-4">Aguarde um momento</Text>
          </>
        ) : success ? (
          <>
            <Text className="text-[#E0E0E0] text-center mb-6">
              E-mail verificado com sucesso!
            </Text>
            <Button
              title="Continuar para Login"
              onPress={() => router.replace('/login')}
              variant="gold"
            />
          </>
        ) : (
          <>
            <Text className="text-red-500 text-center mb-6">{error}</Text>
            <Button
              title="Voltar"
              onPress={() => router.replace('/login')}
              variant="outline"
            />
          </>
        )}
      </View>
    </View>
  );
}
