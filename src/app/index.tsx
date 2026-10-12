import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Slash, Wordmark } from '@/components/brand';
import { Btn, Eyebrow, Screen, Txt, type IconName } from '@/components/ui';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import type { Role } from '@/types';

const ROLES: { role: Role; title: string; sub: string; icon: IconName; href: '/admin' | '/taller' | '/ayudante' | '/cliente' }[] = [
  { role: 'admin', title: 'Admin master', sub: 'Alta de talleres y mapa', icon: 'star', href: '/admin' },
  { role: 'taller', title: 'Taller (dueño)', sub: 'Expedientes, costos, ayudantes, QR', icon: 'construct', href: '/taller' },
  { role: 'ayudante', title: 'Ayudante', sub: 'Mis coches asignados y mis pagos', icon: 'person', href: '/ayudante' },
  { role: 'cliente', title: 'Cliente', sub: 'Escanear QR y ver mi coche', icon: 'car-sport', href: '/cliente' },
];

export default function Inicio() {
  const { role, signIn } = useStore();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');

  // Si ya hay sesión, directo a su vista (al volver con "atrás" desde un rol).
  const current = ROLES.find((r) => r.role === role);
  if (current) return <Redirect href={current.href} />;

  const enter = (r: (typeof ROLES)[number]) => {
    signIn(r.role);
    router.replace(r.href);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 28, paddingHorizontal: 24, paddingBottom: 28, overflow: 'hidden' }}>
          <Slash width={220} height={14} right={-40} />
          <Wordmark size={44} />
          <View style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: C.orange, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}>
            <Txt b style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Tu taller, conectado con tu cliente
            </Txt>
          </View>
          <Txt style={{ color: '#C9C9C9', marginTop: 18, lineHeight: 22 }}>
            Expedientes, costos y ayudantes para el taller. Estado del coche en tiempo real para el cliente.
          </Txt>
        </View>
        <View style={{ height: 6, backgroundColor: C.orange }} />

        <View style={{ padding: 20, gap: 12 }}>
          <Txt semi style={{ fontSize: 14 }}>
            Entra con tu número de celular
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 10 }}>
              <Txt b>+52</Txt>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="55 1234 5678"
              placeholderTextColor="#8A847D"
              accessibilityLabel="Número de celular"
              style={{ flex: 1, minHeight: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, fontFamily: F.reg, backgroundColor: '#fff' }}
            />
          </View>
          <Btn label="Recibir código por WhatsApp" disabled />
          <Txt style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
            El acceso con código llega con el servidor (fase 0). Por ahora elige un rol para recorrer la app.
          </Txt>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: insets.bottom + 24 }}>
          <Eyebrow>Prototipo: entra como</Eyebrow>
          {ROLES.map((r) => (
            <Pressable
              key={r.role}
              onPress={() => enter(r)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                minHeight: 44,
                backgroundColor: '#fff',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: pressed ? C.orange : C.line,
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={r.icon} size={22} color={C.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt b style={{ fontSize: 16 }}>
                  {r.title}
                </Txt>
                <Txt style={{ fontSize: 13, color: C.muted }}>{r.sub}</Txt>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.mutedLight} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
