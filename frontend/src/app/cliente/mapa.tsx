import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OsmMap } from '@/components/osm-map';
import { Chip, Disp, Row, Tag, Txt } from '@/components/ui';
import { SPECIALTIES } from '@/data/specialties';
import { digits, initials } from '@/lib/format';
import { distanceKm, formatKm } from '@/lib/geo';
import { useUserLocation } from '@/lib/use-location';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** Mapa real (OpenStreetMap) con los talleres activos; las distancias salen de la ubicación del cliente. */
export default function MapaTalleres() {
  const { shops } = useStore();
  const insets = useSafeAreaInsets();
  const [spec, setSpec] = useState<string>();
  const me = useUserLocation();

  const visible = shops
    .filter((s) => s.status === 'activo')
    .filter((s) => !spec || s.specialties.includes(spec))
    .map((s) => ({ shop: s, km: me ? distanceKm(me, s) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
    .map((x) => x.shop);
  const [sel, setSel] = useState<string>();
  const cur = visible.find((s) => s.id === sel) ?? visible[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.ink, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Disp size={26} color="#fff">
            Talleres cerca
          </Disp>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SPECIALTIES.slice(0, 6).map((s) => (
            <Chip key={s} label={s} on={spec === s} onPress={() => setSpec(spec === s ? undefined : s)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ height: 5, backgroundColor: C.orange }} />

      <OsmMap shops={visible} selectedId={cur?.id} onSelect={setSel} user={me} />

      {cur ? (
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 16 + insets.bottom, gap: 10, elevation: 8 }}>
          <Row style={{ gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Disp size={20} color={C.orange}>
                {initials(cur.name)}
              </Disp>
            </View>
            <View style={{ flex: 1 }}>
              <Row style={{ gap: 6 }}>
                <Txt b style={{ fontSize: 17, flexShrink: 1 }}>
                  {cur.name}
                </Txt>
                {cur.verified ? <Ionicons name="checkmark-circle" size={18} color={C.orange} accessibilityLabel="Taller verificado" /> : null}
              </Row>
              <Txt style={{ fontSize: 13, color: C.muted }}>
                {me ? `a ${formatKm(distanceKm(me, cur))} · ` : ''}
                {cur.hours}
              </Txt>
            </View>
          </Row>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {cur.specialties.map((s) => (
              <Tag key={s} label={s} />
            ))}
          </View>
          <Row style={{ gap: 8 }}>
            <Act label="Llamar" onPress={() => Linking.openURL(`tel:${digits(cur.phone)}`)} />
            <Act label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/52${digits(cur.phone).slice(-10)}`)} />
            <Act primary label="Cómo llegar" onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${cur.lat},${cur.lng}`)} />
          </Row>
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', padding: 24 }}>
          <Txt style={{ textAlign: 'center', color: C.muted }}>No hay talleres con esa especialidad cerca.</Txt>
        </View>
      )}
    </View>
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
