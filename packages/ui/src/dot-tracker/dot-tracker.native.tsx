import { Pressable, Text, View } from 'react-native';

import { joinClasses } from '../shared/cn';
import { clampDotValue, toggleDotValue } from '../shared/dot';
import type { DotTrackerProps } from './types';

export function DotTracker({
  value,
  maxDots,
  onChange,
  className,
  testID,
}: DotTrackerProps) {
  const current = clampDotValue(value, maxDots);

  return (
    <View
      className={joinClasses('flex-row flex-wrap items-center', className)}
      style={{ gap: 8 }}
      testID={testID}
    >
      {Array.from({ length: maxDots }, (_, index) => {
        const filled = index < current;

        return (
          <Pressable
            key={index}
            onPress={() => onChange(toggleDotValue(current, index, maxDots))}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Dot ${index + 1} of ${maxDots}`}
            accessibilityState={{ selected: filled }}
            className={joinClasses(
              'w-8 h-8 rounded-full border items-center justify-center',
              filled ? 'bg-gold border-gold' : 'bg-bg-panel border-border',
            )}
          >
            {filled ? (
              <View className="w-2 h-2 rounded-full bg-on-gold" />
            ) : null}
          </Pressable>
        );
      })}
      <Text className="ml-1 text-[11px] text-text-muted">
        {current}/{maxDots}
      </Text>
    </View>
  );
}
