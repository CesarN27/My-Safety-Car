import type { CarState, Role } from '../../common/enums.js';

/** 0 Recibido · 1 Diagnóstico · 2 Esperando refacción · 3 En reparación · 4 Listo · 5 Entregado */
export const STATE_NAMES: Record<CarState, string> = {
  0: 'Recibido',
  1: 'Diagnóstico',
  2: 'Esperando refacción',
  3: 'En reparación',
  4: 'Listo para entrega',
  5: 'Entregado',
};

/**
 * Transiciones permitidas (diagrama del PDF), más dos regresos que pasan en el taller:
 * 3 → 2 (en plena reparación falta una pieza) y 4 → 3 (hay que corregir algo antes de entregar).
 */
const NEXT: Record<CarState, readonly CarState[]> = {
  0: [1],
  1: [2, 3],
  2: [3],
  3: [2, 4],
  4: [3, 5],
  5: [],
};

/** El ayudante mueve el trabajo; marcar Listo (libera el total al cliente) y Entregado es del dueño. */
const HELPER_TARGETS: readonly CarState[] = [1, 2, 3];

export type TransitionError =
  'misma_etapa' | 'transicion_invalida' | 'rol_no_permitido' | 'sin_total';

export interface TransitionCheck {
  from: CarState;
  to: CarState;
  role: Role;
  /** El expediente tiene un total mayor a cero (costos capturados). */
  hasTotal: boolean;
}

/** null si el cambio procede; si no, el motivo. El servicio lo traduce a 403 o 409. */
export function checkTransition({
  from,
  to,
  role,
  hasTotal,
}: TransitionCheck): TransitionError | null {
  if (from === to) return 'misma_etapa';
  if (role !== 'taller' && role !== 'ayudante') return 'rol_no_permitido';
  if (role === 'ayudante' && !HELPER_TARGETS.includes(to))
    return 'rol_no_permitido';
  if (!NEXT[from].includes(to)) return 'transicion_invalida';
  // El PDF: "la app no deja avanzar sin total".
  if (to === 4 && !hasTotal) return 'sin_total';
  return null;
}

export const allowedNext = (from: CarState): readonly CarState[] => NEXT[from];
