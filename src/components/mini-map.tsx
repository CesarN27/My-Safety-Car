import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { C } from '@/theme';
import type { Shop } from '@/types';

const PIN_COLOR = { activo: C.orange, pausado: '#9CA3AF', invitado: '#FFFFFF' } as const;

/**
 * Mapa de ejemplo dibujado con vistas. En la fase 3 se cambia por un mapa real
 * (react-native-maps o Mapbox) con la búsqueda por distancia del servidor.
 */
export function MiniMap({
  shops,
  selectedId,
  onSelect,
  height: fixedHeight,
  showYou,
  legend,
}: {
  shops: Shop[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Alto fijo; sin él, el mapa llena el espacio disponible. */
  height?: number;
  showYou?: boolean;
  legend?: boolean;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const w = box.w;
  const height = fixedHeight ?? box.h;
  const road = { position: 'absolute', backgroundColor: '#fff' } as const;
  return (
    <View
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ height: fixedHeight, flex: fixedHeight ? undefined : 1, backgroundColor: '#E9E6E1', overflow: 'hidden' }}
    >
      <View style={[road, { left: -40, top: height * 0.38, width: 600, height: 14, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[road, { left: -40, top: height * 0.76, width: 600, height: 10, transform: [{ rotate: '4deg' }] }]} />
      <View style={[road, { left: w * 0.32, top: -40, width: 12, height: height + 80, transform: [{ rotate: '10deg' }] }]} />
      <View style={[road, { left: w * 0.7, top: -40, width: 9, height: height + 80, transform: [{ rotate: '-6deg' }] }]} />
      <View
        style={{ position: 'absolute', left: w * 0.08, top: height * 0.52, width: 80, height: 44, backgroundColor: '#D3E4CF', borderRadius: 8 }}
      />
      {showYou ? (
        <View
          style={{
            position: 'absolute',
            left: w * 0.62,
            top: height * 0.7,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#2563EB',
            borderWidth: 3,
            borderColor: '#fff',
          }}
        />
      ) : null}
      {w > 0 && height > 0
        ? shops.map((s) => {
            const sel = s.id === selectedId;
            const size = sel ? 36 : 28;
            return (
              <Pressable
                key={s.id}
                onPress={() => onSelect?.(s.id)}
                accessibilityRole="button"
                accessibilityLabel={`${s.name}, ${s.status}`}
                hitSlop={8}
                style={{ position: 'absolute', left: s.mapX * w - 22, top: s.mapY * height - 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: size,
                    height: size,
                    borderTopLeftRadius: size / 2,
                    borderTopRightRadius: size / 2,
                    borderBottomRightRadius: size / 2,
                    borderBottomLeftRadius: 0,
                    transform: [{ rotate: '-45deg' }],
                    borderWidth: sel ? 3 : 2.5,
                    borderColor: sel ? C.orange : C.ink,
                    backgroundColor: sel ? C.ink : PIN_COLOR[s.status],
                  }}
                />
              </Pressable>
            );
          })
        : null}
      {legend ? (
        <View
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            flexDirection: 'row',
            gap: 10,
            backgroundColor: 'rgba(255,255,255,.92)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          {(['activo', 'pausado', 'invitado'] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PIN_COLOR[k], borderWidth: 1.5, borderColor: C.ink }} />
              <Txt semi style={{ fontSize: 11 }}>
                {k[0].toUpperCase() + k.slice(1)}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
