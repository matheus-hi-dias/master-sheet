import React from 'react';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { FileText, FolderOpen, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#1A1A1B',
          borderTopColor: '#3D3D3D',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#1A1A1B',
          borderBottomColor: '#3D3D3D',
          borderBottomWidth: 1,
        },
        headerTintColor: '#E0E0E0',
        headerTitleStyle: {
          fontFamily: 'Cinzel',
          fontWeight: 'bold',
          fontSize: 18,
          letterSpacing: 1,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Minhas Fichas',
          tabBarLabel: 'Fichas',
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Explorar Modelos',
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ color }) => <FolderOpen color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
