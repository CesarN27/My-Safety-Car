export interface LatLng {
  lat: number;
  lng: number;
}

/** Centro por defecto del mapa (CDMX) cuando todavía no hay talleres ni ubicación. */
export const DEFAULT_CENTER: LatLng = { lat: 19.4326, lng: -99.1332 };

/** Distancia en km entre dos puntos (fórmula de haversine). */
export function distanceKm(a: LatLng, b: LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Número decimal con punto; devuelve null si está vacío o no es un número. */
export function parseCoord(text: string, kind: 'lat' | 'lng'): number | null {
  const t = text.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  const max = kind === 'lat' ? 90 : 180;
  return Math.abs(n) <= max ? n : null;
}

/** Detecta "19.3589, -99.0846" (como lo copia Google Maps u OpenStreetMap) y lo separa. */
export function splitPair(text: string): LatLng | null {
  const m = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseCoord(m[1], 'lat');
  const lng = parseCoord(m[2], 'lng');
  return lat === null || lng === null ? null : { lat, lng };
}

export const fixed = (n: number) => n.toFixed(6);
