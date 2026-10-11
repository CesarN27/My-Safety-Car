import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '@/lib/geo';

/** Ubicación actual del usuario; null si no da permiso o no se puede obtener. */
export function useUserLocation() {
  const [pos, setPos] = useState<LatLng | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (alive) setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      } catch {
        // sin permiso o sin GPS: el mapa funciona sin distancias
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return pos;
}
