import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { OsmMap } from '@/components/osm-map';
import { AppHeader, Chip, Disp, Row, Screen, Tag, Txt } from '@/components/ui';
import { initials } from '@/lib/format';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import type { ShopStatus } from '@/types';

const FILTERS: ('Todos' | ShopStatus)[] = ['Todos', 'activo', 'pausado', 'invitado'];
const LABEL = { activo: 'Activo', pausado: 'Pausado', invitado: 'Invitado' } as const;
const TAG = {
  activo: { bg: C.orangeSoft, fg: '#9A3412' },
  pausado: { bg: '#E5E7EB', fg: '#374151' },
  invitado: { bg: '#fff', fg: C.text },
} as const;

export default function AdminTalleres() {
  const { shops, cars } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos');
  const [selected, setSelected] = useState<string>();

  const shown = shops.filter((s) => filter === 'Todos' || s.status === filter);

  return (
    <Screen>
      <AppHeader
        eyebrow="Admin master"
        title="Talleres"
        right={
          <Pressable
            onPress={() => router.push('/alta-taller')}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, paddingHorizontal: 14, minHeight: 44, borderRadius: 10 }}
          >
            <Ionicons name="add" size={20} color={C.text} />
            <Txt b>Alta</Txt>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Row style={{ gap: 8 }}>
          <Stat n={shops.filter((s) => s.status === 'activo').length} label="Talleres activos" />
          <Stat n={cars.length} label="Coches este mes" />
          <Stat n="1,120" label="Clientes" />
        </Row>
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border }}>
          <OsmMap shops={shown} selectedId={selected} onSelect={setSelected} height={280} legend />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f === 'Todos' ? f : LABEL[f]} on={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>
        {shown.map((s) => {
          const t = TAG[s.status];
          return (
            <Pressable
              key={s.id}
              onPress={() => router.push({ pathname: '/admin-taller/[id]', params: { id: s.id } })}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: s.id === selected ? C.orange : 'transparent',
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Disp size={18} color={C.orange}>
                  {initials(s.name)}
                </Disp>
              </View>
              <View style={{ flex: 1 }}>
                <Txt b>{s.name}</Txt>
                <Txt style={{ fontSize: 13, color: C.muted }}>
                  {s.zone} · {s.specialties.slice(0, 2).join(', ')}
                </Txt>
              </View>
              <Tag label={LABEL[s.status]} bg={t.bg} fg={t.fg} dashed={s.status === 'invitado'} />
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
      <Disp size={28}>{String(n)}</Disp>
      <Txt style={{ fontSize: 12, color: C.muted }}>{label}</Txt>
    </View>
  );
}
