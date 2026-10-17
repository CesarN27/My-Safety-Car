import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Txt, type IconName } from '@/components/ui';
import { C } from '@/theme';

export type GlassButtonProps = {
  label: string;
  /** Ícono Ionicons para el botón normal. */
  icon: IconName;
  /** SF Symbol para el botón nativo de iOS 26. */
  sf: string;
  onPress: () => void;
};

/** Botón naranja en línea; es el que se ve en todo menos en iOS 26+ (ver `glass-button.ios.tsx`). */
export function GlassButtonBase({ label, icon, onPress }: GlassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, paddingHorizontal: 14, minHeight: 44, borderRadius: 10 }}
    >
      <Ionicons name={icon} size={20} color={C.text} />
      <Txt b>{label}</Txt>
    </Pressable>
  );
}
