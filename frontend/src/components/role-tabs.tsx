import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import type { Role } from '@/types';

type IconProps = ComponentProps<typeof NativeTabs.Trigger.Icon>;

export type RoleTab = {
  name: string;
  title: string;
  /** SF Symbol (iOS) y glifo Material (Android). */
  sf: { default: string; selected: string };
  md: string;
  /** Rol de sistema de iOS; `search` la separa de la barra como botón aparte en iOS 26. */
  role?: 'search';
};

/**
 * Barra inferior nativa compartida por los cuatro roles: Liquid Glass en iOS 26+,
 * Material en Android. En iOS no se fija `backgroundColor` porque un fondo opaco
 * apaga el efecto de vidrio; solo se tiñe la pestaña activa de naranja.
 */
export function RoleTabs({ role, tabs }: { role: Role; tabs: RoleTab[] }) {
  const { role: current } = useStore();
  if (current !== role) return <Redirect href="/" />;
  return (
    <NativeTabs
      tintColor={C.orange}
      minimizeBehavior="onScrollDown"
      iconColor={Platform.OS === 'android' ? C.mutedLight : undefined}
      backgroundColor={Platform.OS === 'android' ? C.ink : undefined}
      labelStyle={{ fontFamily: F.semi, fontSize: 11 }}
    >
      {tabs.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name} role={t.role}>
          <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon {...({ sf: t.sf, md: t.md } as IconProps)} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

/**
 * Espacio inferior para que la última fila no quede bajo la barra flotante en las
 * pantallas de pestañas. iOS solo ajusta solo el primer ScrollView de la pantalla;
 * si hay una cabecera encima no lo detecta, así que se suma a mano.
 */
export function useTabBottom(extra = 24) {
  return useSafeAreaInsets().bottom + extra;
}
