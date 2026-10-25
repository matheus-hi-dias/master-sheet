import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  X,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
  ChevronLeft,
} from 'lucide-react-native';
import {
  evaluateFormula,
  extractIdentifiers,
  renderExpressionWithLabels,
  type FormulaContext,
} from '../../lib/formula';
import {
  createField,
  slugify,
  type DepCandidate,
} from '../../lib/builder/structureOps';
import type {
  FieldDefinition,
  FieldType,
} from '../../types/template';

interface FieldInspectorSheetProps {
  field: FieldDefinition | null;
  candidates: DepCandidate[];
  labelById?: Record<string, string>;
  previewContext?: FormulaContext;
  onChange: (field: FieldDefinition) => void;
  onClose: () => void;
}

const BROAD_TYPES: FieldType[] = [
  'number',
  'text',
  'textarea',
  'dots',
  'select',
  'checkbox',
  'formula',
  'repeater',
];

const CONFIG_TYPES = BROAD_TYPES.filter(type => type !== 'repeater');
const CHILD_TYPES = BROAD_TYPES.filter(type => type !== 'repeater');

const defaultInput =
  'bg-bg-panel border border-border rounded-card px-3 py-2.5 text-text-main font-body text-sm';

function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
      {children}
    </Text>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <View>
      <SheetLabel>{label}</SheetLabel>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        className={`${defaultInput} ${multiline ? 'min-h-[72px]' : ''} ${
          mono ? 'font-mono' : ''
        }`}
      />
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
}) {
  return (
    <View className="flex-1">
      <SheetLabel>{label}</SheetLabel>
      <TextInput
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={text =>
          onChange(text === '' ? undefined : Number(text))
        }
        keyboardType="numeric"
        placeholderTextColor="#888888"
        className={defaultInput}
      />
    </View>
  );
}

function TypeChips({
  value,
  options,
  onSelect,
  disabled,
}: {
  value: FieldType;
  options: FieldType[];
  onSelect: (type: FieldType) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
      {options.map(type => {
        const active = type === value;
        return (
          <Pressable
            key={type}
            onPress={() => onSelect(type)}
            disabled={disabled}
            className={`px-2.5 py-1 rounded-full border ${
              active ? 'bg-gold border-gold' : 'bg-bg-card border-border'
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                active ? 'text-[#121212]' : 'text-text-muted'
              }`}
            >
              {type}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FieldInspectorSheet({
  field,
  candidates,
  labelById = {},
  previewContext = {},
  onChange,
  onClose,
}: FieldInspectorSheetProps) {
  const [childIndex, setChildIndex] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ label: '', value: '' });
  const [newChildType, setNewChildType] = useState<FieldType>('text');

  useEffect(() => {
    setChildIndex(null);
    setNewOption({ label: '', value: '' });
    setNewChildType('text');
  }, [field?.id]);

  const patch = (patchProps: Partial<FieldDefinition>) => {
    if (!field) return;
    onChange({ ...field, ...patchProps } as FieldDefinition);
  };

  const formulaDiagnostics = useFormulaDiagnostics(
    field,
    candidates,
    previewContext,
  );

  if (!field) return null;

  const children = field.type === 'repeater' ? field.itemSchema : [];

  const activeChild =
    childIndex !== null ? children[childIndex] : null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="bg-bg-panel border-t border-border rounded-t-3xl max-h-[85%]">
          <View className="items-center py-2.5">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-2">
            <View className="flex-row items-center gap-2">
              {activeChild ? (
                <Pressable
                  onPress={() => setChildIndex(null)}
                  hitSlop={8}
                  className="p-1 active:opacity-60"
                >
                  <ChevronLeft size={20} color="#888888" />
                </Pressable>
              ) : null}
              <Text className="font-display font-bold text-base text-text-main">
                {activeChild
                  ? `Campo interno #${(childIndex ?? 0) + 1}`
                  : 'Configurar campo'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setChildIndex(null);
                onClose();
              }}
              className="p-1.5 active:opacity-60"
              hitSlop={8}
            >
              <X size={20} color="#888888" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {activeChild ? (
              <View className="gap-3">
                <TextField
                  label="Rótulo"
                  value={activeChild.label}
                  onChange={label =>
                    patch({
                      itemSchema: children.map((child, index) =>
                        index === childIndex ? { ...child, label } : child,
                      ),
                    })
                  }
                />
                <View>
                  <SheetLabel>Tipo</SheetLabel>
                  <TypeChips
                    value={activeChild.type}
                    options={CHILD_TYPES}
                    onSelect={type =>
                      patch({
                        itemSchema: children.map((child, index) =>
                          index === childIndex
                            ? {
                                ...createField(type),
                                id: child.id,
                                label: child.label,
                              }
                            : child,
                        ),
                      })
                    }
                  />
                </View>
                <ChildConfig
                  field={activeChild}
                  patch={next =>
                    patch({
                      itemSchema: children.map((child, index) =>
                        index === childIndex ? next : child,
                      ),
                    })
                  }
                />
              </View>
            ) : (
              <View className="gap-3">
                <View>
                  <SheetLabel>Rótulo</SheetLabel>
                  <TextInput
                    value={field.label}
                    onChangeText={label => patch({ label })}
                    placeholderTextColor="#888888"
                    className={defaultInput}
                  />
                </View>

                <View>
                  <SheetLabel>Tipo</SheetLabel>
                  <TypeChips
                    value={field.type}
                    options={CONFIG_TYPES}
                    onSelect={type =>
                      onChange({
                        ...createField(type),
                        id: field.id,
                        label: field.label,
                      } as FieldDefinition)
                    }
                  />
                </View>

                <View>
                  <SheetLabel>ID interno</SheetLabel>
                  <View className="flex-row items-stretch" style={{ gap: 8 }}>
                    <TextInput
                      value={field.id}
                      onChangeText={id => patch({ id })}
                      placeholderTextColor="#888888"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className={`${defaultInput} font-mono flex-1`}
                    />
                    <Pressable
                      onPress={() => patch({ id: slugify(field.label) })}
                      hitSlop={8}
                      className="px-3 justify-center border border-border rounded-card active:bg-gold/10"
                    >
                      <Sparkles size={15} color="#D4AF37" />
                    </Pressable>
                  </View>
                </View>

                {field.type === 'formula' && formulaDiagnostics ? (
                  <FormulaConfig
                    field={field}
                    candidates={candidates}
                    labelById={labelById}
                    previewContext={previewContext}
                    diagnostics={formulaDiagnostics}
                    patch={patch}
                  />
                ) : null}

                {field.type === 'repeater' ? (
                  <RepeaterConfig
                    children={children}
                    newChildType={newChildType}
                    setNewChildType={setNewChildType}
                    onOpenChild={setChildIndex}
                    onAddChild={() => {
                      patch({
                        itemSchema: [
                          ...children,
                          createField(
                            newChildType,
                            children.map(child => child.id),
                          ),
                        ],
                      });
                    }}
                    onRemoveChild={childId =>
                      patch({
                        itemSchema: children.filter(child => child.id !== childId),
                      })
                    }
                  />
                ) : null}

                {field.type === 'select' ? (
                  <SelectConfig
                    options={field.options ?? []}
                    newOption={newOption}
                    setNewOption={setNewOption}
                    patch={patch}
                  />
                ) : null}

                {field.type === 'number' ? (
                  <View className="flex-row" style={{ gap: 8 }}>
                    <NumberField
                      label="Mínimo"
                      value={field.min}
                      onChange={min => patch({ min })}
                    />
                    <NumberField
                      label="Máximo"
                      value={field.max}
                      onChange={max => patch({ max })}
                    />
                    <NumberField
                      label="Passo"
                      value={field.step}
                      onChange={step => patch({ step })}
                    />
                  </View>
                ) : null}

                {field.type === 'text' || field.type === 'textarea' ? (
                  <>
                    <TextField
                      label="Placeholder"
                      value={field.placeholder ?? ''}
                      onChange={placeholder => patch({ placeholder })}
                    />
                    <NumberField
                      label="Max. caracteres"
                      value={field.maxLength}
                      onChange={maxLength => patch({ maxLength })}
                    />
                  </>
                ) : null}

                {field.type === 'dots' ? (
                  <NumberField
                    label="Max. pontos"
                    value={field.maxDots}
                    onChange={maxDots => patch({ maxDots })}
                  />
                ) : null}

                {field.type === 'checkbox' ? (
                  <Pressable
                    onPress={() =>
                      patch({ defaultValue: !Boolean(field.defaultValue) })
                    }
                    className="flex-row items-center justify-between py-2"
                  >
                    <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                      Marcado por padrão
                    </Text>
                    <View
                      className={`w-11 h-6 rounded-full px-0.5 justify-center ${
                        field.defaultValue ? 'bg-gold' : 'bg-border'
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded-full bg-[#121212] ${
                          field.defaultValue ? 'self-end' : 'self-start'
                        }`}
                      />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormulaConfig({
  field,
  candidates,
  labelById,
  previewContext,
  diagnostics,
  patch,
}: {
  field: Extract<FieldDefinition, { type: 'formula' }>;
  candidates: DepCandidate[];
  labelById: Record<string, string>;
  previewContext: FormulaContext;
  diagnostics: NonNullable<
    ReturnType<typeof useFormulaDiagnostics>
  >;
  patch: (patchProps: Partial<FieldDefinition>) => void;
}) {
  const readout = renderExpressionWithLabels(field.expression, labelById);

  return (
    <>
      <View>
        <SheetLabel>Expressão</SheetLabel>
        <TextInput
          value={field.expression}
          onChangeText={expression => {
            const used = extractIdentifiers(expression);
            const deps = used
              .filter(id => candidates.some(candidate => candidate.id === id))
              .filter((id, index, all) => all.indexOf(id) === index);
            patch({ expression, dependencies: deps });
          }}
          placeholder="floor((forca + destreza) / 2)"
          placeholderTextColor="#888888"
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          className={`${defaultInput} font-mono min-h-[72px]`}
        />
        {field.expression.trim() !== '' ? (
          <Text className="text-[10px] font-mono text-text-muted/80 mt-1">
            {readout}
          </Text>
        ) : null}
      </View>

      <View>
        <SheetLabel>Inserir dependência</SheetLabel>
        {candidates.length > 0 ? (
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {candidates.map(candidate => (
              <Pressable
                key={candidate.id}
                onPress={() =>
                  patch({
                    expression: `${field.expression}${
                      field.expression ? ' + ' : ''
                    }${candidate.id}`,
                    dependencies: [
                      ...field.dependencies.filter(dep => dep !== candidate.id),
                      candidate.id,
                    ],
                  })
                }
                className="flex-row items-center px-2.5 py-1 rounded border border-border bg-bg-card"
                style={{ gap: 6 }}
              >
                <Text className="text-[11px] text-text-muted">
                  {candidate.label}
                </Text>
                <Text className="text-[10px] font-mono text-text-muted/70">
                  {candidate.id}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text className="text-[11px] text-text-muted">
            Adicione campos numéricos antes para usá-los como dependências.
          </Text>
        )}
      </View>

      <View>
        <SheetLabel>Diagnóstico</SheetLabel>
        {diagnostics.unknown.length > 0 ? (
          <View className="flex-row items-center gap-1.5 mb-1">
            <TriangleAlert size={12} color="#e74c3c" />
            <Text className="text-[11px] text-danger flex-1">
              Desconhecidos:{' '}
              {diagnostics.unknown
                .map(id => (labelById[id] ? `${id} (${labelById[id]})` : id))
                .join(', ')}
            </Text>
          </View>
        ) : null}
        <Text className="text-[11px] text-text-muted mb-1">
          Dependências:{' '}
          {diagnostics.deps.length > 0
            ? diagnostics.deps.map(id => labelById[id] ?? id).join(', ')
            : 'nenhuma'}
        </Text>
        <Text
          className={`font-mono tabular-nums text-[12px] ${
            diagnostics.blocked ? 'text-text-muted' : 'text-gold'
          }`}
        >
          Preview: {diagnostics.previewValue}
        </Text>
        {!diagnostics.blocked && diagnostics.deps.length > 0 ? (
          <Text className="text-[10px] font-mono text-text-muted/70 mt-1">
            {diagnostics.deps
              .map(id => `${id} = ${previewContext[id] ?? 0}`)
              .join(' · ')}
          </Text>
        ) : null}
      </View>
    </>
  );
}

function RepeaterConfig({
  children,
  newChildType,
  setNewChildType,
  onOpenChild,
  onAddChild,
  onRemoveChild,
}: {
  children: FieldDefinition[];
  newChildType: FieldType;
  setNewChildType: (type: FieldType) => void;
  onOpenChild: (index: number) => void;
  onAddChild: () => void;
  onRemoveChild: (childId: string) => void;
}) {
  return (
    <>
      {children.length > 0 ? (
        <View style={{ gap: 6 }}>
          {children.map((child, index) => (
            <View
              key={child.id}
              className="flex-row items-center bg-bg-card border border-border rounded-card pl-3"
            >
              <Pressable
                onPress={() => onOpenChild(index)}
                className="flex-1 py-3 active:opacity-60"
              >
                <Text className="text-[12px] font-bold text-text-main">
                  {child.label || child.type}
                </Text>
                <Text className="text-[10px] uppercase tracking-wider text-gold mt-0.5">
                  {child.type}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onRemoveChild(child.id)}
                hitSlop={6}
                className="px-3 py-2 active:opacity-60"
              >
                <Trash2 size={15} color="#e74c3c" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-[11px] text-text-muted">
          Nenhum campo interno ainda. Adicione um abaixo.
        </Text>
      )}

      <View>
        <SheetLabel>Adicionar campo interno</SheetLabel>
        <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
          <TypeChips
            value={newChildType}
            options={CHILD_TYPES}
            onSelect={setNewChildType}
          />
          <Pressable
            onPress={onAddChild}
            className="px-3 py-1.5 rounded-card border border-gold active:bg-gold/10"
            hitSlop={8}
          >
            <Plus size={14} color="#D4AF37" />
          </Pressable>
        </View>
        <Text className="text-[11px] text-text-muted mt-2">
          Itens do repetidor compartilham o mesmo sub-esquema. Repetidores
          aninhados não são suportados.
        </Text>
      </View>
    </>
  );
}

function ChildConfig({
  field,
  patch,
}: {
  field: FieldDefinition;
  patch: (field: FieldDefinition) => void;
}) {
  if (field.type === 'select') {
    const options = field.options ?? [];
    return (
      <SelectConfig
        options={options}
        newOption={{ label: '', value: '' }}
        setNewOption={() => undefined}
        patch={patchProps =>
          patch({ ...field, ...patchProps } as FieldDefinition)
        }
      />
    );
  }

  if (field.type === 'number') {
    return (
      <View className="flex-row" style={{ gap: 8 }}>
        <NumberField
          label="Mínimo"
          value={field.min}
          onChange={min => patch({ ...field, min } as FieldDefinition)}
        />
        <NumberField
          label="Máximo"
          value={field.max}
          onChange={max => patch({ ...field, max } as FieldDefinition)}
        />
        <NumberField
          label="Passo"
          value={field.step}
          onChange={step => patch({ ...field, step } as FieldDefinition)}
        />
      </View>
    );
  }

  if (field.type === 'dots') {
    return (
      <NumberField
        label="Max. pontos"
        value={field.maxDots}
        onChange={maxDots => patch({ ...field, maxDots } as FieldDefinition)}
      />
    );
  }

  if (field.type === 'text' || field.type === 'textarea') {
    return (
      <TextField
        label="Placeholder"
        value={field.placeholder ?? ''}
        onChange={placeholder =>
          patch({ ...field, placeholder } as FieldDefinition)
        }
      />
    );
  }

  if (field.type === 'checkbox') {
    return (
      <Pressable
        onPress={() =>
          patch({ ...field, defaultValue: !Boolean(field.defaultValue) } as FieldDefinition)
        }
        className="flex-row items-center justify-between py-2"
      >
        <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Marcado por padrão
        </Text>
        <View
          className={`w-11 h-6 rounded-full px-0.5 justify-center ${
            field.defaultValue ? 'bg-gold' : 'bg-border'
          }`}
        >
          <View
            className={`w-5 h-5 rounded-full bg-[#121212] ${
              field.defaultValue ? 'self-end' : 'self-start'
            }`}
          />
        </View>
      </Pressable>
    );
  }

  if (field.type === 'formula') {
    return (
      <TextField
        label="Expressão"
        value={field.expression}
        onChange={expression =>
          patch({
            ...field,
            expression,
            dependencies: extractIdentifiers(expression),
          } as FieldDefinition)
        }
        placeholder="floor((FOR + DES) / 2)"
        mono
        multiline
      />
    );
  }

  return null;
}

function SelectConfig({
  options,
  newOption,
  setNewOption,
  patch,
}: {
  options: { label: string; value: string }[];
  newOption: { label: string; value: string };
  setNewOption: (option: { label: string; value: string }) => void;
  patch: (patchProps: Partial<FieldDefinition>) => void;
}) {
  return (
    <View>
      <SheetLabel>Opções</SheetLabel>
      <View style={{ gap: 6 }}>
        {options.map((option, index) => (
          <View key={`${option.value}-${index}`} className="flex-row gap-2">
            <TextInput
              value={option.label}
              onChangeText={label =>
                patch({
                  options: options.map((opt, i) =>
                    i === index ? { label, value: opt.value } : opt,
                  ),
                })
              }
              placeholder="Rótulo"
              placeholderTextColor="#888888"
              className={`${defaultInput} flex-1`}
            />
            <TextInput
              value={option.value}
              onChangeText={value =>
                patch({
                  options: options.map((opt, i) =>
                    i === index ? { ...opt, value } : opt,
                  ),
                })
              }
              placeholder="Valor"
              placeholderTextColor="#888888"
              autoCapitalize="none"
              className={`${defaultInput} flex-1`}
            />
            <Pressable
              onPress={() =>
                patch({ options: options.filter((_, i) => i !== index) })
              }
              className="px-2 justify-center active:opacity-60"
              hitSlop={6}
            >
              <Trash2 size={15} color="#888888" />
            </Pressable>
          </View>
        ))}

        <View className="flex-row gap-2">
          <TextInput
            value={newOption.label}
            onChangeText={label => setNewOption({ ...newOption, label })}
            placeholder="Novo rótulo"
            placeholderTextColor="#888888"
            className={`${defaultInput} flex-1`}
          />
          <TextInput
            value={newOption.value}
            onChangeText={value => setNewOption({ ...newOption, value })}
            placeholder="Valor"
            placeholderTextColor="#888888"
            autoCapitalize="none"
            className={`${defaultInput} flex-1`}
          />
          <Pressable
            onPress={() => {
              if (!newOption.label) return;
              patch({ options: [...options, newOption] });
              setNewOption({ label: '', value: '' });
            }}
            className="px-3 border border-gold rounded-card justify-center active:bg-gold/10"
            hitSlop={6}
          >
            <Plus size={15} color="#D4AF37" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function useFormulaDiagnostics(
  field: FieldDefinition | null,
  candidates: DepCandidate[],
  previewContext: FormulaContext,
) {
  return useMemo(() => {
    if (!field || field.type !== 'formula') return null;

    const used = extractIdentifiers(field.expression);
    const candidateIds = new Set(candidates.map(candidate => candidate.id));
    const unknown = used.filter(id => !candidateIds.has(id));
    const deps = used
      .filter(id => candidateIds.has(id))
      .filter((id, index, all) => all.indexOf(id) === index);

    let previewValue: string | null = null;
    try {
      previewValue = String(evaluateFormula(field.expression, previewContext));
    } catch (error) {
      previewValue =
        error instanceof Error ? error.message : 'Fórmula inválida';
    }

    return { unknown, deps, previewValue, blocked: unknown.length > 0 };
  }, [field, candidates, previewContext]);
}