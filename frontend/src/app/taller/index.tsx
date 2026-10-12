import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Slash, Wordmark } from '@/components/brand';
import { Avatar, Empty, Screen, StatePill, Txt } from '@/components/ui';
import { ago, initials, todayLabel } from '@/lib/format';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import { STATES_SHORT } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Tablero() {
  const { cars, helperById } = useStore();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState<number>(-1);

  const inShop = cars.filter((c) => c.state < 5).length;
  const shown = cars.filter((c) => sel === -1 || c.state === sel);
  const filters = [
    { i: -1, label: 'Todos', n: cars.length },
    ...STATES_SHORT.map((label, i) => ({ i, label, n: cars.filter((c) => c.state === i).length })),
  ];

  return (
    <Screen>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 14, overflow: 'hidden' }}>
        <Slash width={160} height={10} />
        <Pressable
          onPress={() => router.push('/escaneo')}
          accessibilityRole="button"
          accessibilityLabel="Registrar escaneo"
          style={({ pressed }) => ({
            position: 'absolute',
            right: 16,
            top: insets.top + 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: pressed ? '#fff' : C.orange,
          })}
        >
          <Ionicons name="scan-outline" size={20} color={C.text} />
          <Txt b style={{ fontSize: 14 }}>
            Escaneo
          </Txt>
        </Pressable>
        <Wordmark size={28} />
        <Txt style={{ color: C.mutedLight, fontSize: 13, marginTop: 4 }}>
          {todayLabel()} · {inShop} coches en el taller
        </Txt>
      </View>
      <View style={{ height: 5, backgroundColor: C.orange }} />

      <View style={{ height: 82 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, padding: 12, paddingHorizontal: 16 }}>
          {filters.map((f) => (
            <Pressable
              key={f.i}
              onPress={() => setSel(f.i)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel === f.i }}
              style={{
                minWidth: 84,
                minHeight: 56,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: sel === f.i ? C.ink : C.border,
                backgroundColor: sel === f.i ? C.ink : '#fff',
              }}
            >
              <Txt style={{ fontFamily: F.disp, fontSize: 24, lineHeight: 26, color: sel === f.i ? '#fff' : C.text }}>{f.n}</Txt>
              <Txt semi style={{ fontSize: 12, color: sel === f.i ? '#fff' : C.text }}>
                {f.label}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 10 }}>
        {shown.map((c) => {
          const h = helperById(c.helperId);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/expediente/[id]', params: { id: c.id } })}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: 14,
                gap: 8,
                borderWidth: 1.5,
                borderColor: pressed ? C.orange : 'transparent',
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt b style={{ fontSize: 13, color: C.orangeText }}>
                  FOLIO {c.folio}
                </Txt>
                <StatePill state={c.state} />
              </View>
              <Txt b style={{ fontSize: 17 }}>
                {c.brand} {c.model} {c.year}
              </Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt style={{ fontSize: 13, color: C.muted, flex: 1 }} numberOfLines={1}>
                  {c.plates} · {c.client.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Avatar size={28} text={h ? initials(h.name) : '—'} />
                  <Txt style={{ fontSize: 13, color: C.muted }}>{ago(c.log[0]?.at ?? c.enteredAt)}</Txt>
                </View>
              </View>
            </Pressable>
          );
        })}
        {shown.length === 0 ? <Empty text="No hay coches en este estado." /> : null}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/nuevo-expediente')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          position: 'absolute',
          right: 16,
          bottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 52,
          paddingHorizontal: 18,
          borderRadius: 26,
          backgroundColor: pressed ? C.orangeHi : C.orange,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        })}
      >
        <Ionicons name="add" size={22} color={C.text} />
        <Txt b>Nuevo expediente</Txt>
      </Pressable>
    </Screen>
  );
}
