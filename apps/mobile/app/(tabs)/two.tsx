import { Text, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg-app">
      <Text className="font-xl font-bold">Tab Two</Text>
      <View className="bg-bg-card my-8 h-px w-4/5" />
    </View>
  );
}
