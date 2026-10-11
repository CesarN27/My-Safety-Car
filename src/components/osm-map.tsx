import { useMemo } from 'react';
import { View } from 'react-native';

import { MapSurface } from '@/components/map-surface';
import type { MapEvent, MapState } from '@/components/osm-html';
import { Txt } from '@/components/ui';
import type { LatLng } from '@/lib/geo';
import { C } from '@/theme';
import type { Shop } from '@/types';

const PIN_COLOR = { activo: C.orange, pausado: '#9CA3AF', invitado: '#FFFFFF' } as const;

/**
 * Mapa real de OpenStreetMap (Leaflet) con los talleres como pines.
 * - `onSelect`: se toca un taller.
 * - `pin` + `onPick`: modo "elegir ubicación" (alta de taller): se muestra el punto y tocar el mapa manda las coordenadas.
 */
export function OsmMap({
  shops,
  selectedId,
  onSelect,
  height,
  user,
  pin,
  onPick,
  legend,
}: {
  shops: Shop[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Alto fijo; sin él, el mapa llena el espacio disponible. */
  height?: number;
  /** Ubicación del usuario (punto azul). */
  user?: LatLng | null;
  pin?: LatLng | null;
  onPick?: (p: LatLng) => void;
  legend?: boolean;
}) {
  const state = useMemo<MapState>(
    () => ({
      shops: shops.map((s) => ({ id: s.id, name: s.name, status: s.status, lat: s.lat, lng: s.lng })),
      selectedId,
      user,
      pin,
      pickable: !!onPick,
    }),
    [shops, selectedId, user, pin, onPick],
  );

  const onEvent = (e: MapEvent) => {
    if (e.type === 'select') onSelect?.(e.id);
    else if (e.type === 'pick') onPick?.({ lat: e.lat, lng: e.lng });
  };

  return (
    <View style={{ height, flex: height ? undefined : 1, backgroundColor: '#E9E6E1', overflow: 'hidden' }}>
      <MapSurface state={state} onEvent={onEvent} />
      {legend ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 10,
            bottom: 24,
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
