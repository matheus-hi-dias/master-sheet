import { View } from 'react-native';

export function AuraBackground() {
  return (
    <View className="absolute inset-0 items-center justify-center overflow-hidden pointer-events-none">
      {/* Camada Externa: Brilho muito suave e amplo */}
      <View
        className="w-[800px] h-[800px] rounded-full bg-gold/5"
        style={{ transform: [{ scale: 1 }] }}
      />

      {/* Camada Interna: Ponto de luz centralizado atrás do logo */}
      <View
        className="absolute w-[600px] h-[600px] rounded-full bg-gold/10"
        style={{
          // No iOS, podemos usar shadow para suavizar a borda
          shadowColor: '#d4af37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 100,
          // No Android, a sombra é limitada, então focamos na opacidade
          elevation: 0,
        }}
      />
    </View>
  );
}
