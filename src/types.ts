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
  supplier?: string;
}

export interface LogEntry {
  state: CarState;
  who: string;
  at: string;
  note?: string;
  photos: string[];
  visibleToClient: boolean;
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
  km: string;
  client: { name: string; phone: string; address: string };
  state: CarState;
  helperId?: string;
  description: string;
  inspection: Record<string, InspState>;
  fuel: number;
  damages: Damage[];
  photos: string[];
  signed: boolean;
  costs: CostItem[];
  ivaOn: boolean;
  log: LogEntry[];
  /** El cliente ya escaneó el QR y el coche está ligado a su cuenta. */
  linked: boolean;
}
