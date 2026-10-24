export const ROLES = ['admin', 'taller', 'ayudante', 'cliente'] as const;
export type Role = (typeof ROLES)[number];

export const SHOP_STATUSES = ['activo', 'pausado', 'invitado'] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];

export const COST_KINDS = ['refaccion', 'mano', 'gasto'] as const;
export type CostKind = (typeof COST_KINDS)[number];

export const PAY_TYPES = ['fijo', 'porcentaje'] as const;
export type PayType = (typeof PAY_TYPES)[number];

/** 0 Recibido · 1 Diagnóstico · 2 Esperando refacción · 3 En reparación · 4 Listo · 5 Entregado */
export type CarState = 0 | 1 | 2 | 3 | 4 | 5;

/** 0 bien · 1 dañado · 2 no aplica */
export type InspState = 0 | 1 | 2;

/**
 * Tipo de archivo, que decide a qué pertenece:
 * entrada / pieza_danada / pieza_nueva → coche · avance → entrada de la bitácora ·
 * ayudante → foto del ayudante · taller → foto del perfil público del taller.
 * La firma no es un archivo: se guarda como trazos en `cars.signature`.
 */
export const FILE_KINDS = [
  'entrada',
  'pieza_danada',
  'pieza_nueva',
  'avance',
  'ayudante',
  'taller',
] as const;
export type FileKind = (typeof FILE_KINDS)[number];
