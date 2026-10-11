import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { OsmMap } from '@/components/osm-map';
import { AppHeader, Chip, Row, Screen, Tag, Txt } from '@/components/ui';
import { digits } from '@/lib/format';
import { fixed } from '@/lib/geo';
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

/** Mapa completo con todos los talleres dados de alta (activos, pausados e invitados) y su ficha de ubicación. */
export default function AdminMapa() {
  const { shops } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos');
  const [sel, setSel] = useState<string>();

  const shown = shops.filter((s) => filter === 'Todos' || s.status === filter);
  const cur = shown.find((s) => s.id === sel);

  return (
    <Screen>
      <AppHeader eyebrow="Admin master" title="Mapa de talleres" subtitle={`${shown.length} de ${shops.length} en el mapa`} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f === 'Todos' ? f : LABEL[f]} on={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <OsmMap shops={shown} selectedId={cur?.id} onSelect={setSel} legend />

      <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 10 }}>
        {cur ? (
          <>
            <Row style={{ justifyContent: 'space-between', gap: 8 }}>
              <Txt b style={{ fontSize: 17, flexShrink: 1 }}>
                {cur.name}
              </Txt>
              <Tag label={LABEL[cur.status]} bg={TAG[cur.status].bg} fg={TAG[cur.status].fg} dashed={cur.status === 'invitado'} />
            </Row>
            <Txt style={{ fontSize: 13, color: C.muted, lineHeight: 19 }}>
              {cur.address} · {cur.zone}
            </Txt>
            <Txt style={{ fontSize: 13, color: C.muted }} selectable>
              Coordenadas: {fixed(cur.lat)}, {fixed(cur.lng)}
            </Txt>
            <Txt style={{ fontSize: 13, color: C.muted }}>
              Dueño: {cur.owner} · {cur.phone}
            </Txt>
            <Row style={{ gap: 8 }}>
              <Act label="Ver ficha" onPress={() => router.push({ pathname: '/admin-taller/[id]', params: { id: cur.id } })} />
              <Act label="Llamar" onPress={() => Linking.openURL(`tel:${digits(cur.phone)}`)} />
              <Act
                primary
                label="Abrir en OSM"
                onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${cur.lat}&mlon=${cur.lng}#map=18/${cur.lat}/${cur.lng}`)}
              />
            </Row>
          </>
        ) : (
          <Txt style={{ textAlign: 'center', color: C.muted }}>
            {shown.length ? 'Toca un pin para ver dónde está el taller y sus coordenadas.' : 'No hay talleres con ese estado.'}
          </Txt>
        )}
      </View>
    </Screen>
  );
}

function Act({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flex: 1,
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: primary ? C.orange : C.ink,
        backgroundColor: primary ? C.orange : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt b style={{ fontSize: 14 }}>
        {label}
      </Txt>
    </Pressable>
  );
}
