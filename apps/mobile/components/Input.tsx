import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Input({ label, icon, className = '', ...props }: InputProps) {
  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </Text>
      )}
      <View className="relative flex-row items-center">
        {icon && <View className="absolute left-3 z-10">{icon}</View>}
        <TextInput
          placeholderTextColor="#888888"
          className={`w-full bg-bg-panel border border-border rounded-card py-3 px-3 text-text-main font-body text-[13px] ${
            icon ? 'pl-10' : 'px-3'
          } ${className}`}
          {...props}
        />
      </View>
    </View>
  );
}
