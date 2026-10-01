import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { DEFAULT_SYSTEMS, SYSTEM_LABELS } from '../../types/template';
import type { BuilderDraft } from '../../hooks/useBuilder';

const inputClass =
  'bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
      {children}
    </Text>
  );
}

export function MetaEditor({
  draft,
  updateMeta,
}: {
  draft: BuilderDraft;
  updateMeta: <K extends keyof Omit<BuilderDraft, 'structure'>>(
    key: K,
    value: BuilderDraft[K],
  ) => void;
}) {
  const totalFields = draft.structure.tabs.reduce(
    (sum, tab) =>
      sum + tab.sections.reduce((acc, section) => acc + section.fields.length, 0),
    0,
  );

  return (
    <View className="bg-bg-panel border border-border rounded-card p-4 mb-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-display font-bold text-sm text-text-main tracking-wide">
          Detalhes do modelo
        </Text>
        <View className="bg-bg-card border border-border px-2.5 py-1 rounded-full">
          <Text className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
            {draft.structure.tabs.length} abas · {totalFields} campos
          </Text>
        </View>
      </View>

      <View>
        <FieldLabel>Nome</FieldLabel>
        <TextInput
          value={draft.name}
          onChangeText={value => updateMeta('name', value)}
          placeholder="Nome do modelo"
          placeholderTextColor="#888888"
          className={inputClass}
        />
      </View>

      <View>
        <FieldLabel>Descrição</FieldLabel>
        <TextInput
          value={draft.description}
          onChangeText={value => updateMeta('description', value)}
          placeholder="Breve descrição das regras"
          placeholderTextColor="#888888"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className={`${inputClass} min-h-[72px]`}
        />
      </View>

      <View>
        <FieldLabel>Sistema</FieldLabel>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {DEFAULT_SYSTEMS.map(system => {
            const active = draft.system === system;
            return (
              <Pressable
                key={system}
                onPress={() => updateMeta('system', system)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'bg-gold border-gold' : 'bg-bg-card border-border'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active ? 'text-[#121212]' : 'text-text-muted'
                  }`}
                >
                  {SYSTEM_LABELS[system] ?? system}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <FieldLabel>Tags (separadas por vírgula)</FieldLabel>
        <TextInput
          value={draft.tags.join(', ')}
          onChangeText={value =>
            updateMeta(
              'tags',
              value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
            )
          }
          placeholder="ex.: d&d, fantasia, grupo"
          placeholderTextColor="#888888"
          autoCapitalize="none"
          className={inputClass}
        />
      </View>

      <Pressable
        onPress={() => updateMeta('isPublic', !draft.isPublic)}
        className="flex-row items-center justify-between py-1.5"
      >
        <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Tornar público
        </Text>
        <View
          className={`w-11 h-6 rounded-full px-0.5 justify-center ${
            draft.isPublic ? 'bg-gold' : 'bg-border'
          }`}
        >
          <View
            className={`w-5 h-5 rounded-full bg-[#121212] ${
              draft.isPublic ? 'self-end' : 'self-start'
            }`}
          />
        </View>
      </Pressable>
    </View>
  );
}