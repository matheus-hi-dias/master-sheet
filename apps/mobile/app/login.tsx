import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { GemLogo } from '../components/GemLogo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: async (data: any) => {
      if (data && data.access_token) {
        await login(data.access_token);
      }
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro ao entrar',
        error.response?.data?.message ||
          'Verifique suas credenciais e tente novamente.',
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      return response.data;
    },
    onSuccess: async () => {
      setTab('login');
      Alert.alert('Conta criada!', 'Você já pode entrar na plataforma.');
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro ao criar conta',
        error.response?.data?.message || 'Tente novamente mais tarde.',
      );
    },
  });

  const handleSubmit = () => {
    setErrors({});
    let newErrors: { email?: string; password?: string; name?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    }
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    }

    if (tab === 'register') {
      if (!name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (tab === 'login') {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-sm self-center bg-bg-card border border-border border-t-4 border-t-gold rounded-xl px-8 py-10">
            {/* Header */}
            <View className="items-center mb-8">
              <GemLogo size={48} />
              <Text className="font-display font-black text-2xl text-gold tracking-widest mt-3">
                Master-Sheet
              </Text>
              <Text className="text-[10px] text-text-muted tracking-[4px] uppercase mt-1 text-center">
                Sua plataforma de fichas de RPG
              </Text>
            </View>

            {/* Tabs Selector */}
            <View className="flex-row rounded-card overflow-hidden border border-border mb-7">
              {['login', 'register'].map(t => (
                <Pressable
                  key={t}
                  onPress={() => {
                    setTab(t as 'login' | 'register');
                    setErrors({});
                  }}
                  className={`flex-1 py-3 items-center ${tab === t ? 'bg-gold' : 'bg-transparent'}`}
                >
                  <Text
                    className={`text-[11px] font-bold uppercase tracking-widest ${tab === t ? 'text-[#121212]' : 'text-text-muted'}`}
                  >
                    {t === 'login' ? 'Entrar' : 'Cadastrar'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Form */}
            <View className="gap-1">
              {tab === 'register' && (
                <Input
                  label="Nome"
                  placeholder="Seu nome de aventureiro"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  error={errors.name}
                />
              )}
              <Input
                label="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="joao@email.com"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={errors.email}
              />
              <Input
                ref={passwordRef}
                label="Senha"
                secureTextEntry
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.password}
              />
            </View>

            <Button
              variant="gold"
              size="lg"
              className="w-full mt-4"
              onPress={handleSubmit}
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {loginMutation.isPending || registerMutation.isPending
                ? 'Carregando...'
                : tab === 'login'
                  ? '⚔️ Entrar na Plataforma'
                  : '📜 Criar Conta'}
            </Button>

            <Text className="text-center text-[10px] text-text-muted mt-6 leading-4">
              Ao entrar, você concorda com os{'\n'}
              <Text className="text-gold font-bold">Termos de Aventura ✦</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
