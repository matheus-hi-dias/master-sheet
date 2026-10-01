import React from 'react';
import { View, Text, type DimensionValue } from 'react-native';
import type { TabDefinition } from '../../types/template';
import { FieldInput } from './FieldInput';

interface DynamicSheetRendererProps {
  tab: TabDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const COLUMN_WIDTHS: Record<number, DimensionValue> = {
  1: '100%',
  2: '48%',
  3: '31%',
  4: '23%',
};

export function DynamicSheetRenderer({
  tab,
  values,
  onChange,
}: DynamicSheetRendererProps) {
  return (
    <View style={{ gap: 16 }}>
      {tab.sections.map(section => {
        const columns = Math.max(
          1,
          Math.min(section.columns ?? 1, section.fields.length),
        );

        return (
          <View key={section.id} style={{ gap: 4 }}>
            <View className="flex-row items-center mb-2">
              <View className="w-1 h-4 rounded-full bg-gold mr-2" />
              <Text className="text-[10px] font-display font-semibold uppercase tracking-[0.16em] text-gold">
                {section.title}
              </Text>
            </View>

            <View
              className="flex-row flex-wrap"
              style={{ gap: 8, justifyContent: 'flex-start' }}
            >
              {section.fields.map(field => (
                <View
                  key={field.id}
                  style={{ width: COLUMN_WIDTHS[columns] ?? '100%' }}
                >
                  <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">
                    {field.label}
                  </Text>
                  <FieldInput
                    field={field}
                    value={values[field.id]}
                    context={values}
                    onChange={value => onChange(field.id, value)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}