import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Layers, Sparkles, Dices } from 'lucide-react-native';
import type { TemplateSummary } from '../types/template';
import { SYSTEM_LABELS } from '../types/template';
import { collectTabFieldLabels, totalFields } from '../services/templates';

interface TemplatePreviewBottomSheetProps {
  template: TemplateSummary | null;
  visible: boolean;
  creating: boolean;
  onClose: () => void;
  onCreate: (template: TemplateSummary) => void;
}

export function TemplatePreviewBottomSheet({
  template,
  visible,
  creating,
  onClose,
  onCreate,
}: TemplatePreviewBottomSheetProps) {
  if (!template) return null;

  const systemLabel = SYSTEM_LABELS[template.system] ?? template.system;
  const keyFields = collectTabFieldLabels(template);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="bg-bg-panel border-t border-border rounded-t-3xl max-h-[85%]">
          {/* Handle */}
          <View className="items-center py-2.5">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          >
            <View className="flex-row items-start">
              <View className="flex-1 pr-3">
                <Text className="font-display font-bold text-lg text-text-main leading-snug">
                  {template.name}
                </Text>
                <Text className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
                  Por {template.author?.name || 'Comunidade'}
                  {template.isOfficial ? ' ✦ Oficial' : ''}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="p-1.5 active:opacity-60"
                hitSlop={8}
              >
                <X size={20} color="#888888" />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2 mt-3">
              <View className="bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] text-gold font-bold uppercase tracking-widest">
                  {systemLabel} · v{template.version}
                </Text>
              </View>
              <View className="bg-bg-card border border-border px-2.5 py-1 rounded-full flex-row items-center gap-1">
                <Layers size={11} color="#888888" />
                <Text className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  {template.structure.tabs.length} abas · {totalFields(template)}{' '}
                  campos
                </Text>
              </View>
            </View>

            {template.description ? (
              <Text className="text-xs text-text-muted font-body leading-relaxed mt-3">
                {template.description}
              </Text>
            ) : null}

            {template.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-3">
                {template.tags.map(tag => (
                  <View
                    key={tag.id}
                    className="bg-bg-card px-2 py-0.5 rounded border border-border"
                  >
                    <Text className="text-[9px] text-gold uppercase tracking-wider font-bold">
                      {tag.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="mt-4 border border-border rounded-card overflow-hidden">
              <View className="bg-bg-card px-3 py-2 border-b border-border flex-row items-center gap-2">
                <Sparkles size={13} color="#D4AF37" />
                <Text className="text-[10px] font-bold text-text-main uppercase tracking-widest">
                  Estrutura do modelo
                </Text>
              </View>
              {template.structure.tabs.map(tab => (
                <View
                  key={tab.id}
                  className="px-3 py-2.5 border-b border-border/60 flex-row items-center"
                >
                  <Text className="text-xs font-bold text-text-main flex-1">
                    {tab.label}
                  </Text>
                  <Text className="text-[10px] text-text-muted">
                    {tab.sections.reduce(
                      (sum, section) => sum + section.fields.length,
                      0,
                    )}{' '}
                    campos
                  </Text>
                </View>
              ))}
            </View>

            {keyFields.length > 0 && (
              <View className="mt-4">
                <View className="flex-row flex-wrap justify-start gap-2">
                  {keyFields.map(label => (
                    <View
                      key={label}
                      className="bg-bg-card border border-border px-2.5 py-1 rounded-full"
                    >
                      <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Pressable
              onPress={() => onCreate(template)}
              disabled={creating}
              className="mt-6 bg-gold py-3.5 rounded-card items-center justify-center active:bg-gold-dim flex-row gap-2"
            >
              {creating ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Dices size={16} color="#121212" />
              )}
              <Text className="text-[#121212] font-bold text-xs uppercase tracking-widest">
                {creating ? 'Instanciando...' : '✦ Criar Ficha'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}