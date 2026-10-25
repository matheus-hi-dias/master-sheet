import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { X, Eye } from 'lucide-react-native';
import { DynamicSheetRenderer } from '../sheet/DynamicSheetRenderer';
import { buildItemDefaults, structureDefaultValues } from '../../lib/defaults';
import type { TemplateStructure } from '../../types/template';

interface PreviewModalProps {
  visible: boolean;
  structure: TemplateStructure;
  onClose: () => void;
}

function seedPreviewValues(structure: TemplateStructure): Record<string, unknown> {
  const values = structureDefaultValues(structure);

  for (const tab of structure.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        if (field.type === 'repeater') {
          values[field.id] =
            field.itemSchema.length > 0
              ? [buildItemDefaults(field.itemSchema)]
              : [];
        }
      }
    }
  }

  return values;
}

export function PreviewModal({ visible, structure, onClose }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  const versionKey = JSON.stringify(structure);
  const tab = structure.tabs[Math.min(activeTab, structure.tabs.length - 1)];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="bg-bg-panel border-t border-border rounded-t-3xl max-h-[88%]">
          <View className="items-center py-2.5">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-2">
            <View className="flex-row items-center gap-2">
              <Eye size={16} color="#D4AF37" />
              <Text className="font-display font-bold text-base text-text-main">
                Preview da ficha
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

          {structure.tabs.length > 1 ? (
            <View className="px-5 pb-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {structure.tabs.map((candidate, index) => {
                  const active = index === activeTab;
                  return (
                    <Pressable
                      key={candidate.id}
                      onPress={() => setActiveTab(index)}
                      className={`px-3 py-1.5 rounded-full border ${
                        active ? 'bg-gold border-gold' : 'bg-bg-card border-border'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          active ? 'text-[#121212]' : 'text-text-muted'
                        }`}
                      >
                        {candidate.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          >
            {tab ? (
              <PreviewTab key={versionKey} structure={structure} tabIndex={activeTab} />
            ) : (
              <Text className="text-xs text-text-muted text-center py-8">
                Nenhuma aba definida ainda.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PreviewTab({
  structure,
  tabIndex,
}: {
  structure: TemplateStructure;
  tabIndex: number;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    seedPreviewValues(structure),
  );

  const tab = structure.tabs[Math.min(tabIndex, structure.tabs.length - 1)];

  return (
    <DynamicSheetRenderer
      key={tab.id}
      tab={tab}
      values={values}
      onChange={(key, value) => setValues(prev => ({ ...prev, [key]: value }))}
    />
  );
}