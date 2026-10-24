export type Role = 'admin' | 'taller' | 'ayudante' | 'cliente';

/** 0 Recibido · 1 Diagnóstico · 2 Esperando refacción · 3 En reparación · 4 Listo · 5 Entregado */
export type CarState = 0 | 1 | 2 | 3 | 4 | 5;

export const STATES = [
  'Recibido',
  'Diagnóstico',
  'Esperando refacción',
  'En reparación',
  'Listo para entrega',
  'Entregado',
] as const;

export const STATES_SHORT = ['Recibido', 'Diagnóstico', 'Esp. refacción', 'En reparación', 'Listo', 'Entregado'] as const;

/** 0 bien · 1 dañado · 2 no aplica */
export type InspState = 0 | 1 | 2;

export const INSPECTION_POINTS = [
  'Llantas',
  'Parabrisas',
  'Puertas',
  'Cajuela',
  'Espejos',
  'Calaveras',
  'Batería',
  'Luces',
  'Cristales',
  'Fluidos',
  'Motor',
  'Transmisión',
  'Refrigerante',
  'Frenos',
  'Tapón gasolina',
] as const;

/** Fotos obligatorias al recibir el coche, en este orden (las que se agreguen después son "extra"). */
export const ENTRY_PHOTO_LABELS = ['Frente', 'Atrás', 'Lado izquierdo', 'Lado derecho'] as const;

/** Firma del cliente: trazos SVG y el tamaño del recuadro donde se dibujaron. */
export interface Signature {
  w: number;
  h: number;
  strokes: string[];
}

export type ShopStatus = 'activo' | 'pausado' | 'invitado';

export interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  zone: string;
  address: string;
  specialties: string[];
  status: ShopStatus;
  verified: boolean;
  hours: string;
  /** Ubicación del taller en grados decimales (WGS84), la captura el admin en el alta. */
  lat: number;
  lng: number;
  /** Cláusulas de la orden que el cliente acepta al firmar (las manda el servidor). */
  clauses?: string;
}

export type PayRule = { type: 'fijo'; amount: number } | { type: 'porcentaje'; pct: number };

export interface Helper {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  pay: PayRule;
  paid: boolean;
}

export type CostKind = 'refaccion' | 'mano' | 'gasto';

export interface CostItem {
  id: string;
  kind: CostKind;
  desc: string;
  /** Lo que le cuesta al taller (refacciones y gastos). */
  cost: number;
  /** Lo que se le cobra al cliente (refacciones y mano de obra). */
  price: number;
  /** Cantidad; cost y price son por unidad. 1 si no se indica. */
  qty?: number;
  supplier?: string;
}

/** Dinero de un expediente tal como lo calcula el servidor (el cliente solo recibe `total`). */
export interface CarTotals {
  subtotal: number;
  iva: number;
  total: number;
  parts: number;
  expenses: number;
  helperCost: number;
  profit: number;
}

export interface LogEntry {
  id?: string;
  state: CarState;
  who: string;
  at: string;
  note?: string;
  photos: string[];
  visibleToClient: boolean;
}

/** Escaneo de diagnóstico (OBDII) registrado en un expediente. Sin códigos = escaneo limpio. */
export interface Scan {
  id: string;
  at: string;
  who: string;
  /** Códigos de falla (DTC) como P0302. */
  codes: string[];
  note: string;
  /** Foto de la pantalla del escáner. */
  photo?: string;
}

export interface Damage {
  id: number;
  x: number;
  y: number;
  note: string;
}

export interface Car {
  id: string;
  folio: string;
  token: string;
  enteredAt: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plates: string;
  vin: string;
  /** Lectura del odómetro (km). */
  km: string;
  /** Foto del tablero completo con el odómetro, tomada al recibir el coche. */
  dashboardPhoto?: string;
  client: { name: string; phone: string; address: string };
  state: CarState;
  helperId?: string;
  description: string;
  inspection: Record<string, InspState>;
  fuel: number;
  damages: Damage[];
  photos: string[];
  signed: boolean;
  /** Trazos de la firma de recepción; es lo que se imprime en la hoja. */
  signature?: Signature;
  costs: CostItem[];
  ivaOn: boolean;
  log: LogEntry[];
  scans: Scan[];
  /** El cliente ya escaneó el QR y el coche está ligado a su cuenta. */
  linked: boolean;
  /** Totales calculados por el servidor; mandan sobre el cálculo local. */
  totals?: CarTotals;
  deliveredAt?: string | null;
  /** Taller del coche (lo usa la vista del cliente, que puede tener coches en varios talleres). */
  shop?: Pick<Shop, 'name' | 'phone' | 'address' | 'hours' | 'lat' | 'lng'>;
  /** Cláusulas que el cliente aceptó al firmar. */
  signedClauses?: string | null;
}
