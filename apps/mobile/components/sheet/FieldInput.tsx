import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { evaluateFormula } from '../../lib/formula';
import type { FieldDefinition } from '../../types/template';
import { toNumber, toStringValue } from '../../lib/defaults';
import { NumberStepper } from './NumberStepper';
import { DotTracker } from './DotTracker';
import { RepeaterList } from './RepeaterList';

interface FieldInputProps {
  field: FieldDefinition;
  value: unknown;
  context: Record<string, unknown>;
  onChange: (value: unknown) => void;
}

export function FieldInput({
  field,
  value,
  context,
  onChange,
}: FieldInputProps) {
  switch (field.type) {
    case 'number':
      return (
        <NumberStepper
          value={toNumber(value)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={onChange}
        />
      );
    case 'text':
      return (
        <TextInput
          value={toStringValue(value)}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor="#888888"
          maxLength={field.maxLength}
          className="bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm"
        />
      );
    case 'textarea':
      return (
        <TextInput
          value={toStringValue(value)}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor="#888888"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm min-h-[80px]"
        />
      );
    case 'dots':
      return (
        <DotTracker
          value={toNumber(value)}
          maxDots={field.maxDots ?? 5}
          onChange={onChange}
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
                onPress={() => onChange(option.value)}
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
          onPress={() => onChange(!Boolean(value))}
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
      let result: number | null = null;
      try {
        const formulaContext: Record<string, number> = {};
        for (const dep of field.dependencies) {
          formulaContext[dep] = toNumber(context[dep]);
        }
        result = evaluateFormula(field.expression, formulaContext);
      } catch {
        result = null;
      }

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
        <RepeaterList
          items={
            Array.isArray(value)
              ? (value as Record<string, unknown>[])
              : []
          }
          itemSchema={field.itemSchema}
          onChange={onChange as (items: Record<string, unknown>[]) => void}
        />
      );
  }
}