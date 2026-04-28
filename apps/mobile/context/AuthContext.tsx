import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('master-sheet-jwt');
      if (token) {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          await SecureStore.deleteItemAsync('master-sheet-jwt');
          setIsAuthenticated(false);
        }
      }
    } catch (e) {
      console.log('Error loading token', e);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // We should enforce navigation manually when auth state changes significantly
  // But Expo Router handles basic transitions well if we use router.replace 
  // explicitly during login/logout interactions.
  const login = async (token: string) => {
    await SecureStore.setItemAsync('master-sheet-jwt', token);
    setIsAuthenticated(true);
    router.replace('/(tabs)');
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('master-sheet-jwt');
    setIsAuthenticated(false);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
