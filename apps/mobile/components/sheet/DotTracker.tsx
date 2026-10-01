import React from 'react';
import { View, Pressable } from 'react-native';

interface DotTrackerProps {
  value: number;
  maxDots: number;
  onChange: (value: number) => void;
}

export function DotTracker({ value, maxDots, onChange }: DotTrackerProps) {
  const current = Math.max(0, Math.min(Math.round(value) || 0, maxDots));
  const dots = Array.from({ length: maxDots }, (_, index) => index);

  const setDot = (index: number) => {
    const next = index + 1 === current ? index : index + 1;
    onChange(next);
  };

  return (
    <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
      {dots.map(index => {
        const filled = index < current;
        return (
          <Pressable
            key={index}
            onPress={() => setDot(index)}
            hitSlop={6}
            className={`w-8 h-8 rounded-full border items-center justify-center ${
              filled
                ? 'bg-gold border-gold'
                : 'bg-bg-panel border-border'
            }`}
          >
            {filled ? (
              <View className="w-2 h-2 rounded-full bg-[#121212]" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}