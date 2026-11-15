import { Pressable, Text } from 'react-native';

import { joinClasses } from '../shared/cn';
import type { TagProps } from './types';

const filterBase = 'flex-row items-center rounded-full border px-3 py-1';

const filterActive = 'bg-gold border-gold';

const filterInactive = 'bg-transparent border-border';

const filterTextBase = 'text-[11px] font-bold uppercase tracking-[0.08em]';

const filterTextActive = 'text-on-gold';

const filterTextInactive = 'text-text-muted';

const displayBase =
  'flex-row items-center bg-bg-panel border border-border rounded px-2 py-0.5';

const displayText = 'text-[9px] text-gold uppercase tracking-wider font-bold';

export function Tag({
  active = false,
  variant = 'filter',
  className,
  children,
  disabled,
  onPress,
  onClick,
  accessibilityLabel,
  testID,
}: TagProps) {
  const isDisplay = variant === 'display';
  const interactive = Boolean(onPress ?? onClick);

  return (
    <Pressable
      onPress={onPress ?? onClick}
      disabled={disabled}
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={isDisplay ? undefined : { selected: active }}
      testID={testID}
      className={joinClasses(
        isDisplay
          ? displayBase
          : joinClasses(filterBase, active ? filterActive : filterInactive),
        className,
      )}
    >
      {typeof children === 'string' ? (
        <Text
          className={
            isDisplay
              ? displayText
              : joinClasses(
                  filterTextBase,
                  active ? filterTextActive : filterTextInactive,
                )
          }
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
