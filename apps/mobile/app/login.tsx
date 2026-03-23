import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GemLogo } from '../components/GemLogo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuraBackground } from '../components/AuraBackground';

export default function Login() {
  const [tab, setTab] = useState('login');
  const router = useRouter();

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app">
      {/* 1. O Fundo de Aura */}
      {/* <AuraBackground /> */}

      {/* 2. Ajuste para o teclado não cobrir os inputs */}
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
              <Text className="text-[10px] text-text-muted tracking-[4px] uppercase mt-1">
                Sua plataforma de fichas de RPG
              </Text>
            </View>

            {/* Tabs Selector */}
            <View className="flex-row rounded-card overflow-hidden border border-border mb-7">
              {['login', 'register'].map(t => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
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
                <Input label="Nome" placeholder="Seu nome de aventureiro" />
              )}
              <Input
                label="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="joao@email.com"
              />
              <Input label="Senha" secureTextEntry placeholder="••••••••" />
              {tab === 'register' && (
                <Input
                  label="Confirmar Senha"
                  secureTextEntry
                  placeholder="••••••••"
                />
              )}
            </View>

            <Button
              variant="gold"
              size="lg"
              className="w-full mt-4"
              onPress={handleLogin}
            >
              {tab === 'login' ? '⚔️ Entrar na Plataforma' : '📜 Criar Conta'}
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
