import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import type { FieldDefinition } from '../../types/template';
import { evaluateFormula } from '../../lib/formula';
import { buildItemDefaults, toNumber, toStringValue } from '../../lib/defaults';
import { NumberStepper } from './NumberStepper';
import { DotTracker } from './DotTracker';

interface RepeaterListProps {
  items: Record<string, unknown>[];
  itemSchema: FieldDefinition[];
  onChange: (items: Record<string, unknown>[]) => void;
}

function computeItem(
  expression: string,
  dependencies: string[],
  item: Record<string, unknown>,
): number | null {
  try {
    const context: Record<string, number> = {};
    for (const dep of dependencies) {
      context[dep] = toNumber(item[dep]);
    }
    return evaluateFormula(expression, context);
  } catch {
    return null;
  }
}

function ItemField({
  field,
  value,
  item,
  onValue,
}: {
  field: FieldDefinition;
  value: unknown;
  item: Record<string, unknown>;
  onValue: (value: unknown) => void;
}) {
  switch (field.type) {
    case 'number':
      return (
        <NumberStepper
          value={toNumber(value)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={onValue}
        />
      );
    case 'text':
      return (
        <TextInput
          value={toStringValue(value)}
          onChangeText={onValue}
          placeholder={field.placeholder}
          placeholderTextColor="#888888"
          className="bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm"
        />
      );
    case 'textarea':
      return (
        <TextInput
          value={toStringValue(value)}
          onChangeText={onValue}
          placeholder={field.placeholder}
          placeholderTextColor="#888888"
          multiline
          numberOfLines={2}
          className="bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm min-h-[60px]"
        />
      );
    case 'dots':
      return (
        <DotTracker
          value={toNumber(value)}
          maxDots={field.maxDots ?? 5}
          onChange={onValue}
        />
      );
    case 'select':
      return (
        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
          {(field.options ?? []).map(option => {
            const active = toStringValue(value) === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onValue(option.value)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'bg-gold border-gold' : 'bg-bg-panel border-border'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active ? 'text-[#121212]' : 'text-text-muted'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    case 'checkbox':
      return (
        <Pressable
          onPress={() => onValue(!Boolean(value))}
          className="self-start items-center"
          hitSlop={8}
        >
          <View
            className={`w-6 h-6 rounded border items-center justify-center ${
              Boolean(value) ? 'bg-gold border-gold' : 'bg-bg-panel border-border'
            }`}
          >
            {Boolean(value) ? (
              <Text className="text-[#121212] font-black text-sm">✓</Text>
            ) : null}
          </View>
        </Pressable>
      );
    case 'formula': {
      const result = computeItem(field.expression, field.dependencies, item);
      return (
        <View className="bg-bg-panel border border-border rounded-card px-3 py-2.5">
          <Text className="font-display font-bold text-lg text-gold tabular-nums">
            {result === null ? '—' : result}
          </Text>
        </View>
      );
    }
    case 'repeater':
      return (
        <Text className="text-[10px] text-text-muted italic">
          Repeaters within items are not supported.
        </Text>
      );
  }
}

export function RepeaterList({
  items,
  itemSchema,
  onChange,
}: RepeaterListProps) {
  const addItem = () => {
    onChange([...items, buildItemDefaults(itemSchema)]);
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <View style={{ gap: 8 }}>
      {items.map((item, index) => (
        <View
          key={index}
          className="bg-bg-card border border-border rounded-card p-3"
        >
          <View className="flex-row items-center mb-2">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex-1">
              Item {index + 1}
            </Text>
            <Pressable
              onPress={() => removeItem(index)}
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <Trash2 size={14} color="#e74c3c" />
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            {itemSchema.map(subField => (
              <View key={subField.id}>
                <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">
                  {subField.label}
                </Text>
                <ItemField
                  field={subField}
                  value={item[subField.id]}
                  item={item}
                  onValue={value => updateItem(index, subField.id, value)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {items.length === 0 && (
        <Text className="text-xs text-text-muted italic py-2">
          Nenhum item adicionado ainda.
        </Text>
      )}

      <Pressable
        onPress={addItem}
        className="flex-row items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-card active:border-gold/60"
      >
        <Plus size={14} color="#D4AF37" />
        <Text className="text-[10px] font-bold uppercase tracking-widest text-gold">
          Adicionar item
        </Text>
      </Pressable>
    </View>
  );
}