import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
}: NumberStepperProps) {
  const clamped = (next: number) => {
    if (min !== undefined && next < min) return min;
    if (max !== undefined && next > max) return max;
    return next;
  };

  const roundToStep = (next: number) => {
    const factor = Math.abs(step) || 1;
    return Math.round(next / factor) * factor;
  };

  const current = clamped(Math.round((value || 0) / (Math.abs(step) || 1)) * (Math.abs(step) || 1));

  const handleDelta = (delta: number) => {
    onChange(clamped(roundToStep((value || 0) + delta)));
  };

  const canDec = min === undefined || clamped((value || 0) - step) >= min;
  const canInc = max === undefined || clamped((value || 0) + step) <= max;

  return (
    <View className="flex-row items-center justify-between bg-bg-panel border border-border rounded-card overflow-hidden">
      <Pressable
        onPress={() => handleDelta(-step)}
        disabled={!canDec}
        className="w-12 h-11 items-center justify-center active:bg-gold/10 disabled:opacity-30"
        hitSlop={4}
      >
        <Minus size={16} color="#D4AF37" />
      </Pressable>

      <Text className="font-display font-bold text-lg text-gold tabular-nums">
        {current}
      </Text>

      <Pressable
        onPress={() => handleDelta(step)}
        disabled={!canInc}
        className="w-12 h-11 items-center justify-center active:bg-gold/10 disabled:opacity-30"
        hitSlop={4}
      >
        <Plus size={16} color="#D4AF37" />
      </Pressable>
    </View>
  );
}