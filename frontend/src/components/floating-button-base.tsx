import { Ionicons } from '@expo/vector-icons';
import { Pressable, type ViewStyle } from 'react-native';

import { Txt, type IconName } from '@/components/ui';
import { C } from '@/theme';

export type FloatingButtonProps = {
  label: string;
  /** Ícono Ionicons para el botón normal. */
  icon: IconName;
  /** SF Symbol para el botón nativo de iOS 26. */
  sf: string;
  onPress: () => void;
  /** Posición absoluta (right/top/bottom). */
  position: Pick<ViewStyle, 'right' | 'top' | 'bottom'>;
  radius?: number;
  minHeight?: number;
  fontSize?: number;
  accessibilityLabel?: string;
};

/** Botón flotante naranja; es el que se ve en todo menos en iOS 26+ (ver `floating-button.ios.tsx`). */
export function FloatingButtonBase({ label, icon, onPress, position, radius = 10, minHeight = 44, fontSize, accessibilityLabel }: FloatingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        position: 'absolute',
        ...position,
        flexDirection: 'row',
        alignItems: 'center',
        gap: radius > 12 ? 8 : 6,
        minHeight,
        paddingHorizontal: radius > 12 ? 18 : 14,
        borderRadius: radius,
        backgroundColor: pressed ? (radius > 12 ? C.orangeHi : '#fff') : C.orange,
        ...(radius > 12
          ? { elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }
          : null),
      })}
    >
      <Ionicons name={icon} size={radius > 12 ? 22 : 20} color={C.text} />
      <Txt b style={fontSize ? { fontSize } : undefined}>
        {label}
      </Txt>
    </Pressable>
  );
}
