import type { CostKind, PayType } from '../../common/enums.js';

/**
 * Cálculo del dinero de un expediente. Todo se hace en centavos enteros para no arrastrar errores
 * de punto flotante, y se devuelve en pesos con dos decimales. Nada de esto se guarda en la base
 * (salvo el pago al ayudante, que se congela al entregar el coche): se deriva de los conceptos.
 */

/** IVA por defecto, en porcentaje. */
export const DEFAULT_IVA_PCT = 16;

export interface PricedItem {
  kind: CostKind;
  /** Lo que le cuesta al taller, en pesos. */
  cost: number;
  /** Lo que se le cobra al cliente, en pesos. */
  price: number;
}

export interface HelperRate {
  payType: PayType;
  /** Monto fijo por coche (payType = fijo). */
  payAmount: number | null;
  /** Porcentaje de la mano de obra (payType = porcentaje). */
  payPct: number | null;
}

export interface Totals {
  /** Suma de precios al cliente (refacciones y mano de obra). */
  subtotal: number;
  iva: number;
  /** Lo único del dinero que ve el cliente. */
  total: number;
  /** Costo de refacciones para el taller. */
  parts: number;
  /** Otros gastos del taller. */
  expenses: number;
  helperPay: number;
  /** subtotal − refacciones − pago al ayudante − otros gastos. Puede ser negativa. */
  profit: number;
}

export const toCents = (pesos: number) => Math.round(pesos * 100);
export const toPesos = (cents: number) => cents / 100;

/** Porcentaje de una cantidad en centavos, redondeado al centavo (medio centavo hacia arriba). */
function pctOf(cents: number, pct: number) {
  // El porcentaje se pasa a centésimas enteras (16 → 1600, 8.5 → 850) para no multiplicar flotantes.
  return Math.round((cents * Math.round(pct * 100)) / 10_000);
}

const sumCents = (xs: readonly number[]) =>
  xs.reduce((acc, x) => acc + toCents(x), 0);

/** Lo que se le debe al ayudante por este coche: fijo, o porcentaje de la mano de obra. */
export function helperPayCents(
  items: readonly PricedItem[],
  rate: HelperRate | null,
): number {
  if (!rate) return 0;
  if (rate.payType === 'fijo') return toCents(rate.payAmount ?? 0);
  const labor = sumCents(
    items.filter((i) => i.kind === 'mano').map((i) => i.price),
  );
  return pctOf(labor, rate.payPct ?? 0);
}

export function computeTotals(
  items: readonly PricedItem[],
  opts: { ivaOn: boolean; ivaPct?: number; helper?: HelperRate | null },
): Totals {
  // Los gastos no se le cobran al cliente aunque traigan precio.
  const subtotal = sumCents(
    items.filter((i) => i.kind !== 'gasto').map((i) => i.price),
  );
  const iva = opts.ivaOn ? pctOf(subtotal, opts.ivaPct ?? DEFAULT_IVA_PCT) : 0;
  const parts = sumCents(
    items.filter((i) => i.kind === 'refaccion').map((i) => i.cost),
  );
  const expenses = sumCents(
    items.filter((i) => i.kind === 'gasto').map((i) => i.cost),
  );
  const helperPay = helperPayCents(items, opts.helper ?? null);
  return {
    subtotal: toPesos(subtotal),
    iva: toPesos(iva),
    total: toPesos(subtotal + iva),
    parts: toPesos(parts),
    expenses: toPesos(expenses),
    helperPay: toPesos(helperPay),
    profit: toPesos(subtotal - parts - helperPay - expenses),
  };
}
