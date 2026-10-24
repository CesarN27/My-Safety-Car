import { API_URL } from '@/lib/api';
import type { Car, CarState, CarTotals, CostItem, Damage, Helper, InspState, LogEntry, Shop, Signature } from '@/types';

/**
 * Traduce las respuestas de la API a los tipos que ya usan las pantallas. Cada rol recibe una
 * forma distinta (el servidor no le manda a cada quien lo que no debe ver); lo que falta queda vacío.
 */

export type Surface = 'shop' | 'helper' | 'client';

interface ApiFile {
  id: string;
  kind: 'entrada' | 'pieza_danada' | 'pieza_nueva' | 'avance' | 'ayudante' | 'taller';
  label?: string | null;
  logId: string | null;
  visibleToClient?: boolean;
}
interface ApiVehicle {
  id?: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plates: string;
  vin?: string;
}
interface ApiLog {
  id: string;
  state: CarState;
  at: string;
  authorName?: string;
  note: string | null;
  visibleToClient?: boolean;
}

export interface ShopCarApi {
  id: string;
  folio: string;
  state: CarState;
  enteredAt: string;
  deliveredAt: string | null;
  qrToken: string;
  km: string;
  fuel: number;
  inspection: Record<string, InspState>;
  damages: Damage[];
  description: string;
  clientDescription: string;
  ivaOn: boolean;
  vehicle: ApiVehicle;
  client: { id: string; name: string; phone: string; address: string; hasAccount: boolean };
  helper: { id: string; name: string } | null;
  costs: { id: string; kind: CostItem['kind']; desc: string; qty: number; cost: number; price: number; supplier: string | null }[];
  totals: { subtotal: number; iva: number; total: number; parts: number; expenses: number; helperPay: number; profit: number };
  log: ApiLog[];
  files: ApiFile[];
  signature: Signature | null;
  signedClauses: string | null;
}

export interface HelperCarApi {
  id: string;
  folio: string;
  state: CarState;
  enteredAt: string;
  vehicle: ApiVehicle;
  clientName: string;
  km: string;
  fuel: number;
  inspection: Record<string, InspState>;
  damages: Damage[];
  description: string;
  log: ApiLog[];
  files: ApiFile[];
}

export interface ClientCarApi {
  id: string;
  folio: string;
  state: CarState;
  enteredAt: string;
  deliveredAt: string | null;
  shop: { name: string; phone: string; address: string; hours: string; lat: number; lng: number };
  vehicle: ApiVehicle;
  total: number | null;
  description: string;
  client: { name: string; phone: string; address: string };
  timeline: { id: string; state: CarState; at: string; note: string | null }[];
  files: ApiFile[];
  signedAt: string | null;
  signedClauses: string | null;
}

export interface HelperApi {
  id: string;
  name: string;
  phone: string;
  payType: 'fijo' | 'porcentaje';
  payAmount: number | null;
  payPct: number | null;
  active?: boolean;
  photoId?: string | null;
}

export const fileUrl = (surface: Surface, id: string) => `${API_URL}/${surface}/files/${id}/content`;

/** El servidor guarda la gasolina de 0 a 1; la app la muestra en 8 rayitas (0–7). */
export const fuelToBars = (f: number) => Math.round(f * 7);
export const barsToFuel = (b: number) => Math.round((b / 7) * 100) / 100;

const TABLERO = 'Tablero';

/** Fotos de entrada: el tablero aparte y las demás en orden de subida. */
function entryPhotos(surface: Surface, files: ApiFile[]) {
  const entry = files.filter((f) => f.kind === 'entrada');
  const dash = entry.find((f) => f.label === TABLERO);
  return {
    dashboardPhoto: dash ? fileUrl(surface, dash.id) : undefined,
    photos: entry.filter((f) => f !== dash).map((f) => fileUrl(surface, f.id)),
  };
}

/** Bitácora de la más reciente a la más vieja (como la lista de la app), con sus fotos. */
function logOf(surface: Surface, log: ApiLog[], files: ApiFile[], forClient = false): LogEntry[] {
  return [...log].reverse().map((l) => ({
    id: l.id,
    state: l.state,
    who: l.authorName ?? '',
    at: l.at,
    note: l.note ?? undefined,
    photos: files.filter((f) => f.logId === l.id).map((f) => fileUrl(surface, f.id)),
    visibleToClient: forClient ? true : (l.visibleToClient ?? true),
  }));
}

const base = (c: { id: string; folio: string; state: CarState; enteredAt: string; vehicle: ApiVehicle }) => ({
  id: c.id,
  folio: c.folio,
  state: c.state,
  enteredAt: c.enteredAt,
  brand: c.vehicle.brand,
  model: c.vehicle.model,
  year: c.vehicle.year,
  color: c.vehicle.color,
  plates: c.vehicle.plates,
  vin: c.vehicle.vin ?? '',
  scans: [],
});

export function carFromShop(c: ShopCarApi): Car {
  const t = c.totals;
  const totals: CarTotals = {
    subtotal: t.subtotal,
    iva: t.iva,
    total: t.total,
    parts: t.parts,
    expenses: t.expenses,
    helperCost: t.helperPay,
    profit: t.profit,
  };
  return {
    ...base(c),
    ...entryPhotos('shop', c.files),
    token: c.qrToken,
    deliveredAt: c.deliveredAt,
    km: c.km,
    client: { name: c.client.name, phone: c.client.phone, address: c.client.address },
    helperId: c.helper?.id,
    description: c.description,
    inspection: c.inspection,
    fuel: fuelToBars(c.fuel),
    damages: c.damages,
    signed: c.signature !== null,
    signature: c.signature ?? undefined,
    signedClauses: c.signedClauses,
    costs: c.costs.map((x) => ({
      id: x.id,
      kind: x.kind,
      desc: x.desc,
      qty: x.qty,
      cost: x.cost,
      price: x.price,
      supplier: x.supplier ?? undefined,
    })),
    ivaOn: c.ivaOn,
    log: logOf('shop', c.log, c.files),
    linked: c.client.hasAccount,
    totals,
  };
}

export function carFromHelper(c: HelperCarApi): Car {
  return {
    ...base(c),
    ...entryPhotos('helper', c.files),
    token: '',
    km: c.km,
    client: { name: c.clientName, phone: '', address: '' },
    description: c.description,
    inspection: c.inspection,
    fuel: fuelToBars(c.fuel),
    damages: c.damages,
    signed: false,
    costs: [],
    ivaOn: false,
    log: logOf('helper', c.log, c.files),
    linked: false,
  };
}

export function carFromClient(c: ClientCarApi): Car {
  const total = c.total ?? 0;
  return {
    ...base(c),
    ...entryPhotos('client', c.files),
    token: '',
    deliveredAt: c.deliveredAt,
    km: '',
    client: c.client,
    description: c.description,
    inspection: {},
    fuel: 0,
    damages: [],
    signed: c.signedAt !== null,
    signedClauses: c.signedClauses,
    costs: [],
    ivaOn: true,
    log: logOf(
      'client',
      c.timeline.map((l) => ({ ...l, visibleToClient: true })),
      c.files,
      true,
    ),
    linked: true,
    shop: c.shop,
    totals: { subtotal: 0, iva: 0, total, parts: 0, expenses: 0, helperCost: 0, profit: 0 },
  };
}

export function helperFromApi(h: HelperApi): Helper {
  return {
    id: h.id,
    name: h.name,
    phone: h.phone,
    photo: h.photoId ? fileUrl('shop', h.photoId) : undefined,
    pay: h.payType === 'fijo' ? { type: 'fijo', amount: h.payAmount ?? 0 } : { type: 'porcentaje', pct: h.payPct ?? 0 },
    paid: false,
  };
}

export type ShopApi = Omit<Shop, 'status'> & { status: Shop['status'] };
