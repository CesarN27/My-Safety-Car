import { CLAUSULA } from '@/data/clausula';
import { MONTHS_FULL, clock } from '@/lib/format';
import { ENTRY_PHOTO_LABELS } from '@/types';
import type { Car, Shop } from '@/types';

const esc = (s: string | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function longDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS_FULL[d.getMonth()]} de ${d.getFullYear()}, ${clock(d)} h`;
}

/** Etiqueta de cada foto de ingreso: las cuatro obligatorias y luego "Extra n". */
export const photoLabel = (i: number) => ENTRY_PHOTO_LABELS[i] ?? `Extra ${i - ENTRY_PHOTO_LABELS.length + 1}`;

/** Fotos de la hoja y de la inspección en un solo orden: tablero primero y luego las del vehículo. */
export const sheetPhotos = (car: Car): { label: string; uri: string }[] => [
  ...(car.dashboardPhoto ? [{ label: 'Tablero (odómetro)', uri: car.dashboardPhoto }] : []),
  ...car.photos.map((uri, i) => ({ label: photoLabel(i), uri })),
];

const figure = (label: string, src: string | null | undefined) =>
  `<figure>${src ? `<img src="${src}" alt="${esc(label)}">` : '<div class="noimg">Foto no disponible</div>'}<figcaption>${esc(label)}</figcaption></figure>`;

/**
 * Hoja de recepción lista para imprimir (carta): datos del vehículo y del cliente, servicio, foto del tablero,
 * fotos del vehículo, cláusula y firma del cliente. No incluye costos ni ganancia.
 * `photos` ya vienen como data-URI, en el mismo orden que `sheetPhotos(car)` (null = no se pudo leer).
 */
export function buildHojaHtml(car: Car, shop: Shop | undefined, photos: (string | null)[]): string {
  const list = sheetPhotos(car);
  const hasDash = !!car.dashboardPhoto;
  const dashSrc = hasDash ? photos[0] : null;
  const vehicle = list
    .map((p, i) => ({ ...p, src: photos[i] }))
    .slice(hasDash ? 1 : 0);

  const dashboard = hasDash
    ? `<div class="dash">${figure(`Tablero completo · odómetro ${car.km || 'sin captura'}${car.km ? ' km' : ''}`, dashSrc)}</div>`
    : '<div class="noimg wide-empty">Sin foto del tablero.</div>';

  const vehiclePhotos = vehicle.length
    ? `<div class="photos">${vehicle.map((p) => figure(p.label, p.src)).join('')}</div>`
    : '<div class="noimg wide-empty">Sin fotos del vehículo.</div>';

  const sig = car.signature;
  const signature = sig
    ? `<svg viewBox="0 0 ${sig.w} ${sig.h}" preserveAspectRatio="xMidYMax meet" class="sig">${sig.strokes
        .map((d) => `<path d="${d}" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
        .join('')}</svg>`
    : '<div class="sig"></div>';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hoja de recepción ${esc(car.folio)}</title>
<style>
  @page { size: letter; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111; font-size: 12px; line-height: 1.4; margin: 0; padding: 12px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #F26A1B; padding-bottom: 8px; }
  h1 { margin: 0; font-size: 20px; letter-spacing: .5px; text-transform: uppercase; }
  h2 { margin: 14px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: #5B5650; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .muted { color: #6b6761; }
  .folio { text-align: right; } .folio b { font-size: 22px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 14px; }
  .grid div span { display: block; font-size: 10px; color: #6b6761; text-transform: uppercase; }
  .grid div b { font-weight: 600; }
  .wide { grid-column: span 3; }
  .dash { max-width: 70%; margin: 0 auto; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  figure { margin: 0; break-inside: avoid; } figure img, .noimg { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border: 1px solid #bbb; border-radius: 4px; display: block; }
  .noimg { display: flex; align-items: center; justify-content: center; color: #888; background: #f3f3f3; }
  .wide-empty { aspect-ratio: auto; padding: 18px; }
  figcaption { font-size: 10px; text-align: center; color: #5B5650; margin-top: 2px; }
  .clause { border: 1.5px solid #111; border-radius: 6px; padding: 8px 10px; font-size: 11px; text-align: justify; break-inside: avoid; }
  .sign { display: flex; gap: 28px; margin-top: 8px; break-inside: avoid; }
  .sign > div { flex: 1; text-align: center; font-size: 11px; }
  .sig { width: 100%; height: 70px; display: block; border-bottom: 1px solid #111; }
  .foot { margin-top: 10px; font-size: 10px; color: #6b6761; text-align: center; }
</style></head><body>
<header>
  <div><h1>${esc(shop?.name ?? 'Taller')}</h1><div class="muted">${esc(shop?.address)}${shop?.phone ? ' · Tel. ' + esc(shop.phone) : ''}</div></div>
  <div class="folio"><div class="muted">Hoja de recepción</div><b>Folio ${esc(car.folio)}</b><div>${esc(longDate(car.enteredAt))}</div></div>
</header>

<h2>Vehículo</h2>
<div class="grid">
  <div><span>Marca</span><b>${esc(car.brand)}</b></div><div><span>Modelo</span><b>${esc(car.model)}</b></div><div><span>Año</span><b>${esc(car.year) || '—'}</b></div>
  <div><span>Color</span><b>${esc(car.color) || '—'}</b></div><div><span>Placas</span><b>${esc(car.plates)}</b></div><div><span>Odómetro (km)</span><b>${esc(car.km) || '—'}</b></div>
  <div class="wide"><span>N. de serie (VIN)</span><b>${esc(car.vin) || '—'}</b></div>
</div>

<h2>Cliente</h2>
<div class="grid">
  <div><span>Nombre</span><b>${esc(car.client.name)}</b></div><div><span>Teléfono</span><b>${esc(car.client.phone)}</b></div><div><span>Domicilio</span><b>${esc(car.client.address) || '—'}</b></div>
</div>

<h2>Servicio solicitado</h2>
<div>${esc(car.description) || '—'}</div>

<h2>Foto del tablero</h2>
${dashboard}

<h2>Fotos del vehículo</h2>
${vehiclePhotos}

<h2>Cláusula de aceptación</h2>
<div class="clause">${esc(CLAUSULA)}</div>
<div class="sign">
  <div>${signature}<div><b>${esc(car.client.name)}</b></div><div class="muted">Firma del cliente · ${esc(longDate(car.enteredAt))}</div></div>
  <div><div class="sig"></div><div><b>${esc(shop?.owner ?? '')}</b></div><div class="muted">Recibe por el taller</div></div>
</div>
<div class="foot">Folio ${esc(car.folio)} · ${esc(car.brand)} ${esc(car.model)} · ${esc(car.plates)}</div>
</body></html>`;
}
