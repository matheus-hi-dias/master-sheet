import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'nativewind'; // Use o hook do nativewind para o tema
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Adicionando as fontes do seu projeto Master-Sheet
    Cinzel: require('../assets/fonts/Cinzel-VariableFont_wght.ttf'), // Ajuste o caminho/nome se necessário
    Lato: require('../assets/fonts/Lato-Regular.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* O ThemeProvider ajuda a manter as cores nativas do sistema em sincronia */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Tela de Login definida como inicial ou independente */}
            <Stack.Screen name="login" options={{ animation: 'fade' }} />

            {/* O grupo de abas principal do app */}
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
