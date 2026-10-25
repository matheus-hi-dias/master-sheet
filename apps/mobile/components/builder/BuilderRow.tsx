import React from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronUp, ChevronDown, Trash2, ChevronRight } from 'lucide-react-native';

interface BuilderRowProps {
  label: React.ReactNode;
  subtitle?: string;
  onPress?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onDelete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BuilderRow({
  label,
  subtitle,
  onPress,
  onUp,
  onDown,
  onDelete,
  isFirst,
  isLast,
  style,
}: BuilderRowProps) {
  return (
    <View
      className={`flex-row items-center bg-bg-card border border-border rounded-card pl-3 ${
        onPress ? '' : 'pr-3'
      }`}
      style={[style, { minHeight: 56 }]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className={`flex-1 py-3 ${onPress ? '' : 'pr-1'}`}
      >
        {label}
        {subtitle ? (
          <Text className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </Pressable>

      <View className="flex-row items-center px-1.5">
        {onPress ? (
          <ChevronRight size={16} color="#888888" />
        ) : null}
        {onUp ? (
          <Pressable
            onPress={onUp}
            disabled={isFirst}
            hitSlop={6}
            className={`px-1.5 py-2 ${isFirst ? 'opacity-25' : 'active:opacity-60'}`}
          >
            <ChevronUp size={16} color="#D4AF37" />
          </Pressable>
        ) : null}
        {onDown ? (
          <Pressable
            onPress={onDown}
            disabled={isLast}
            hitSlop={6}
            className={`px-1.5 py-2 ${isLast ? 'opacity-25' : 'active:opacity-60'}`}
          >
            <ChevronDown size={16} color="#D4AF37" />
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            hitSlop={6}
            className="px-1.5 py-2 active:opacity-60"
          >
            <Trash2 size={16} color="#e74c3c" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AddRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center py-3.5 rounded-card border border-dashed border-gold/50 active:bg-gold/10"
    >
      <Text className="text-gold font-bold text-xs uppercase tracking-widest">
        + {label}
      </Text>
    </Pressable>
  );
}