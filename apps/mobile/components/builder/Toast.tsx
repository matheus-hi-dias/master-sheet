import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';

export interface ToastState {
  type: 'ok' | 'error';
  text: string;
}

export function Toast({
  toast,
  onHide,
}: {
  toast: ToastState | null;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 2600);

    return () => clearTimeout(timer);
  }, [toast, onHide, opacity]);

  if (!toast) return null;

  const accent = toast.type === 'ok' ? '#2ecc71' : '#e74c3c';
  const Icon = toast.type === 'ok' ? CheckCircle2 : AlertTriangle;

  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity }}
      className="absolute top-4 left-4 right-4 z-50"
    >
      <Animated.View
        className="bg-bg-panel border border-border rounded-card px-3 py-3 flex-row items-center gap-2.5"
        style={{ transform: [{ translateY: 0 }] }}
      >
        <Icon size={16} color={accent} />
        <Text className="flex-1 text-text-main font-body text-xs leading-relaxed">
          {toast.text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}