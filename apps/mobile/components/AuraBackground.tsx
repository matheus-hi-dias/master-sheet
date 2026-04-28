import { View } from 'react-native';

export function AuraBackground() {
  return (
    <View
      className="absolute inset-0 items-center justify-center overflow-hidden"
      pointerEvents="none"
    >
      <View
        className="w-[800px] h-[800px] rounded-full bg-gold/5"
        style={{ transform: [{ scale: 1 }] }}
      />
      <View
        className="absolute w-[600px] h-[600px] rounded-full bg-gold/10"
        style={{
          shadowColor: '#d4af37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 100,
          elevation: 0,
        }}
      />
    </View>
  );
}
