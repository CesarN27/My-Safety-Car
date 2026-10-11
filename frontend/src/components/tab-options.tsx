import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Barra inferior negra con la pestaña activa en naranja, igual para los cuatro roles. */
export function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: C.orange,
    tabBarInactiveTintColor: C.mutedLight,
    tabBarLabelStyle: { fontFamily: F.semi, fontSize: 11 },
    tabBarStyle: {
      backgroundColor: C.ink,
      borderTopColor: '#262626',
      height: 66 + insets.bottom,
      paddingTop: 8,
      paddingBottom: Math.max(insets.bottom, 8),
    },
  } as const;
}

export function tabIcon(name: IconName) {
  const render = ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
  render.displayName = `TabIcon(${name})`;
  return render;
}
